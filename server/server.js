/* ==========================================================
   server.js — Máy chủ web + API cho Navigos Talent Suite
   Node.js (không framework) + MySQL 8 (mysql2)
     GET  /api/health            tình trạng máy chủ & CSDL
     GET  /api/me                phiên hiện tại + dữ liệu theo quyền
     POST /api/login             { username, password }
     POST /api/logout
     POST /api/rpc               { fn, args }  — gọi nghiệp vụ (services.js) trên máy chủ
     POST /api/reset                           — khôi phục dữ liệu mẫu (chỉ Quản trị viên)
     GET  /api/contact                         — thông tin liên hệ Quản trị viên (trang đăng nhập)
     POST /api/forgot            { username, lien_he, ghi_chu } — gửi yêu cầu cấp lại mật khẩu cho Quản trị viên
     POST /api/recover           { username, code, password }   — Quản trị viên quên mật khẩu: đặt lại bằng mã khôi phục
   ========================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadEnv } = require('./env');
const { createEngine } = require('./engine');
const { Repository } = require('./repository');

const cfg = loadEnv();
const PUBLIC = path.join(cfg.ROOT, 'public');
const E = createEngine(cfg.ROOT);
const repo = new Repository(cfg);
const { current: ACCOUNTS, recovery: RECOVERY, configured: ACC_SET } = require('./accounts'); // mã băm mật khẩu ban đầu, mã khôi phục Quản trị viên
if (!ACC_SET) console.warn('⚠ Chưa đặt biến NTS_ACCOUNTS — dùng mật khẩu ban đầu dự phòng (xem server/accounts.js).');
const sessions = new Map(); // sid → { uid, at }
const failed = new Map(); // tên đăng nhập → { n: số lần sai liên tiếp, at }
const SESSION_TTL = 8 * 3600 * 1000;

/* ---------- Thực thi tuần tự (mỗi thao tác là một giao dịch nhất quán) ---------- */
let chain = Promise.resolve();
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };

/* ---------- Phân quyền gọi nghiệp vụ ---------- */
const ADMIN_FNS = new Set(['saveAccount', 'resetPassword', 'setRole', 'deactivateAccount', 'addCatalog', 'toggleChannel', 'closePasswordRequest']);
// Bảng phân quyền (Fix Demo lần 1): mặc định mọi thao tác nghiệp vụ chỉ dành cho Nhân viên
const ADMIN_OR_QL_FNS = new Set([]); // Test demo lần 2: bỏ màn hình Quy tắc xếp lịch — quy tắc là cấu hình hệ thống cố định
const QL_FNS = new Set(['assign', 'approveRecommendation', 'requestEdit', 'markCommentsSeen', 'closeSupportRequest']);
const BGD_FNS = new Set(['addRecommendationComment']);
const ANY_FNS = new Set(['changePassword']);
const BLOCKED = new Set(['_withdrawActive', 'ingest', 'filterCandidates', 'suggestStaff', 'genPassword', 'requestPasswordReset', 'closePasswordRequestsOf']);

/* ---------- Tiện ích HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const readBody = (req) => new Promise((resolve, reject) => { let d = ''; req.on('data', (c) => { d += c; if (d.length > 2e6) { reject(new Error('Payload quá lớn')); req.destroy(); } }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(new Error('JSON không hợp lệ')); } }); });

function sessionUser(req) {
  const sid = cookies(req).nts_sid; const s = sid && sessions.get(sid);
  if (!s || Date.now() - s.at > SESSION_TTL) { if (sid) sessions.delete(sid); return null; }
  const u = E.Store.get('nhan_su', s.uid);
  if (!u || u.trang_thai_lam_viec !== 'Đang làm việc') { sessions.delete(sid); return null; } // BR1-2
  s.at = Date.now(); return { sid, user: u };
}
function newSession(req, uid) {
  const sid = crypto.randomBytes(24).toString('base64url'); sessions.set(sid, { uid, at: Date.now() });
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''; // HTTPS sau proxy (Render)
  return { 'Set-Cookie': `nts_sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}${secure}` };
}
/** Dữ liệu trả về cho trình duyệt — không bao giờ gửi mật khẩu đã mã hóa */
// Yêu cầu cấp lại mật khẩu (kèm số liên hệ) chỉ gửi cho Quản trị viên
const dbJson = (u) => JSON.stringify(E.Store.db, (k, v) => (k === 'mat_khau' || k === '_seq' || (k === 'yeu_cau_mat_khau' && u?.vai_tro !== 'Quản trị viên') ? undefined : v));
const userJson = (u) => ({ id: u.id, ho_ten: u.ho_ten, vai_tro: u.vai_tro });
const payload = (extra, u) => `{"ok":true,"server":${JSON.stringify({ db: cfg.DB_NAME, demo: cfg.DEMO_MODE })}${u ? `,"user":${JSON.stringify(userJson(u))},"db":${dbJson(u)}` : ''}${extra ? ',' + JSON.stringify(extra).slice(1, -1) : ''}}`;

/** Nếu ghi MySQL lỗi: nạp lại bộ nhớ từ CSDL để không lệch dữ liệu */
async function persistOrRollback() {
  try { await repo.persist(E.Store.db); }
  catch (e) { console.error('✖ Ghi MySQL thất bại:', e.message); E.Store.db = await repo.loadAll(E.Store.empty()); throw new Error('Không lưu được vào CSDL: ' + (e.sqlMessage || e.message)); }
}

async function seedFresh() {
  console.log('• CSDL trống — sinh dữ liệu mẫu bằng chính quy trình nghiệp vụ…');
  E.Auth.user = null; E.Store.db = E.Seed.build(); E.App.clock = null; E.Auth.user = null;
  E.Store.db.nhan_su.forEach((n) => { if (ACCOUNTS[n.ten_dang_nhap]) n.mat_khau = ACCOUNTS[n.ten_dang_nhap]; });
  await repo.persist(E.Store.db);
  const total = E.TABLES.reduce((n, t) => n + E.Store.db[t].length, 0);
  console.log(`• Đã ghi ${total} bản ghi vào MySQL`);
}

/* ---------- Định tuyến API ---------- */
async function api(req, res, url) {
  const p = url.pathname;
  if (p === '/api/health') { const [r] = await repo.pool.query('SELECT VERSION() v, DATABASE() d'); return send(res, 200, { ok: true, mysql: r[0].v, database: r[0].d, sessions: sessions.size }); }

  if (p === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    // Chống dò mật khẩu: sai 5 lần liên tiếp với cùng tên đăng nhập → khóa đăng nhập 5 phút
    const key = String(b.username || '').trim().toLowerCase(); const f = failed.get(key);
    if (f && f.n >= 5 && Date.now() - f.at < 5 * 60000) return send(res, 429, { ok: false, error: 'Đăng nhập sai quá 5 lần. Vui lòng thử lại sau 5 phút hoặc liên hệ Quản trị viên.' });
    return serial(async () => {
      const r = E.Auth.login(String(b.username || ''), String(b.password || '')); const u = E.Auth.user; E.Auth.user = null;
      if (!r.ok) { const x = failed.get(key); failed.set(key, { n: x && Date.now() - x.at < 5 * 60000 ? x.n + 1 : 1, at: Date.now() }); return send(res, 401, r); }
      failed.delete(key);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...newSession(req, u.id) });
      res.end(payload(null, u));
    });
  }

  // ----- Trước khi đăng nhập: liên hệ Quản trị viên, quên mật khẩu, khôi phục tài khoản Quản trị viên -----
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const tooMany = (key, max) => { const f = failed.get(key); return f && f.n >= max && Date.now() - f.at < 5 * 60000; };
  const bump = (key) => { const x = failed.get(key); failed.set(key, { n: x && Date.now() - x.at < 5 * 60000 ? x.n + 1 : 1, at: Date.now() }); };
  if (p === '/api/contact') {
    const admins = E.Store.db.nhan_su.filter((n) => n.vai_tro === 'Quản trị viên' && n.trang_thai_lam_viec === 'Đang làm việc');
    return send(res, 200, { ok: true, admins: admins.map((n) => ({ ho_ten: n.ho_ten, chuc_vu: n.chuc_vu, email: n.email, so_dien_thoai: n.so_dien_thoai })) });
  }
  if (p === '/api/forgot' && req.method === 'POST') {
    const b = await readBody(req); const name = String(b.username || '').trim().slice(0, 100);
    if (!name) return send(res, 400, { ok: false, errors: { username: 'Nhập tên đăng nhập hoặc email.' } });
    if (tooMany('forgot:' + ip, 5)) return send(res, 429, { ok: false, error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút hoặc liên hệ trực tiếp Quản trị viên.' });
    bump('forgot:' + ip);
    return serial(async () => {
      const r = E.Svc.requestPasswordReset(name, String(b.lien_he || '').slice(0, 150), String(b.ghi_chu || '').slice(0, 500));
      if (r.ok && r.changed) await persistOrRollback();
      // Không cho biết tài khoản có tồn tại hay không
      send(res, 200, { ok: true, message: 'Đã gửi yêu cầu tới Quản trị viên. Quản trị viên sẽ cấp lại mật khẩu và liên hệ với bạn.' });
    });
  }
  if (p === '/api/recover' && req.method === 'POST') {
    const b = await readBody(req); const name = String(b.username || '').trim().toLowerCase(); const key = 'recover:' + ip;
    if (tooMany(key, 5)) return send(res, 429, { ok: false, error: 'Nhập sai quá 5 lần. Vui lòng thử lại sau 5 phút.' });
    const code = String(b.code || '').trim().toUpperCase(); const pw = String(b.password || '');
    if (!RECOVERY) return send(res, 400, { ok: false, error: 'Máy chủ chưa cấu hình mã khôi phục (biến NTS_RECOVERY). Hãy liên hệ người quản lý hệ thống.' });
    const okCode = crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update('navigos-recovery::' + code).digest('hex')), Buffer.from(RECOVERY));
    const u = E.Store.db.nhan_su.find((n) => (n.ten_dang_nhap.toLowerCase() === name || n.email.toLowerCase() === name) && n.vai_tro === 'Quản trị viên' && n.trang_thai_lam_viec === 'Đang làm việc');
    if (!okCode || !u) { bump(key); return send(res, 400, { ok: false, error: 'Tên đăng nhập Quản trị viên hoặc mã khôi phục không đúng.' }); }
    if (pw.length < 6) return send(res, 400, { ok: false, errors: { password: 'Mật khẩu mới tối thiểu 6 ký tự.' } });
    return serial(async () => {
      u.mat_khau = E.hashPw(pw); failed.delete(u.ten_dang_nhap.toLowerCase()); failed.delete(key);
      E.Svc.closePasswordRequestsOf(u.id, null);
      await persistOrRollback();
      console.log(`• Quản trị viên ${u.ten_dang_nhap} đặt lại mật khẩu bằng mã khôi phục`);
      send(res, 200, { ok: true, message: 'Đã đặt lại mật khẩu Quản trị viên. Hãy đăng nhập bằng mật khẩu mới.' });
    });
  }

  const s = sessionUser(req);
  if (p === '/api/me') return s ? send(res, 200, payload(null, s.user)) : send(res, 200, payload());
  if (!s) return send(res, 401, { ok: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });

  if (p === '/api/logout' && req.method === 'POST') { sessions.delete(s.sid); return send(res, 200, { ok: true }, { 'Set-Cookie': 'nts_sid=; Path=/; Max-Age=0' }); }

  if (p === '/api/reset' && req.method === 'POST') {
    if (s.user.vai_tro !== 'Quản trị viên') return send(res, 403, { ok: false, error: 'Chỉ Quản trị viên được khôi phục dữ liệu mẫu.' });
    const uname = s.user.ten_dang_nhap;
    return serial(async () => {
      await repo.truncateAll(); await seedFresh();
      const u = E.Store.db.nhan_su.find((n) => n.ten_dang_nhap === uname); if (u) sessions.get(s.sid).uid = u.id;
      send(res, 200, payload(null, u || s.user));
    });
  }

  if (p === '/api/rpc' && req.method === 'POST') {
    const { fn, args = [] } = await readBody(req);
    if (typeof fn !== 'string' || BLOCKED.has(fn) || typeof E.Svc[fn] !== 'function' || !Array.isArray(args)) return send(res, 400, { ok: false, error: 'Thao tác không hợp lệ.' });
    return serial(async () => {
      const u = E.Store.get('nhan_su', sessions.get(s.sid)?.uid); E.Auth.user = u;
      try {
        const allowed = ADMIN_FNS.has(fn) ? E.Auth.isAdmin() : ADMIN_OR_QL_FNS.has(fn) ? E.Auth.isAdmin() || E.Auth.isQL()
          : QL_FNS.has(fn) ? E.Auth.isQL() : BGD_FNS.has(fn) ? E.Auth.isBGD() : ANY_FNS.has(fn) ? true : E.Auth.canOperate();
        if (!allowed) return send(res, 403, { ok: false, error: 'Chức năng không thuộc phạm vi vai trò của bạn.' });
        const result = E.Svc[fn](...args);
        await persistOrRollback();
        send(res, 200, payload({ result }, E.Store.get('nhan_su', u.id) || u));
      } catch (e) { console.error(`✖ rpc ${fn}:`, e.message); send(res, 500, { ok: false, error: e.message }); }
      finally { E.Auth.user = null; E.App.clock = null; }
    });
  }
  send(res, 404, { ok: false, error: 'Không tìm thấy API' });
}

/* ---------- Tệp tĩnh ---------- */
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname); if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) return send(res, 403, { ok: false });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { ok: false, error: 'Không tìm thấy' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- Khởi động ---------- */
async function main() {
  console.log(`• Kết nối MySQL ${cfg.DB_HOST}:${cfg.DB_PORT}/${cfg.DB_NAME}${cfg.DB_SSL ? ' (SSL)' : ''}`);
  if (cfg.MYSQL_MANAGED) await require('../scripts/mysql').start(cfg);
  await repo.ensureSchema();
  await repo.connect();
  if (await repo.isEmpty()) await seedFresh();
  else { E.Store.db = await repo.loadAll(E.Store.empty()); console.log('• Đã nạp dữ liệu từ MySQL'); }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try { if (url.pathname.startsWith('/api/')) await api(req, res, url); else serveStatic(req, res, url); }
    catch (e) { console.error('✖', e); if (!res.headersSent) send(res, 500, { ok: false, error: e.message }); }
  });
  server.listen(cfg.APP_PORT, cfg.HOST, () => console.log(`\n✔ Navigos Talent Suite: http://localhost:${cfg.APP_PORT}  (MySQL ${cfg.DB_HOST}:${cfg.DB_PORT}/${cfg.DB_NAME})\n`));
}

main().catch((e) => { console.error('✖ Không khởi động được máy chủ:', e.message); process.exit(1); });
