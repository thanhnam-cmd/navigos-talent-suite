/* ==========================================================
   server.js — Máy chủ web + API cho Navigos Talent Suite
   Node.js (không framework) + MySQL 8 (mysql2)
     GET  /api/health            tình trạng máy chủ & CSDL
     GET  /api/me                phiên hiện tại + dữ liệu theo quyền
     POST /api/login             { username, password }
     POST /api/logout
     POST /api/rpc               { fn, args }  — gọi nghiệp vụ (services.js) trên máy chủ
     POST /api/switch            { id }        — chuyển nhanh tài khoản (chỉ DEMO_MODE)
     POST /api/reset                           — khôi phục dữ liệu mẫu (DEMO_MODE / Quản trị viên)
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
const sessions = new Map(); // sid → { uid, at }
const SESSION_TTL = 8 * 3600 * 1000;

/* ---------- Thực thi tuần tự (mỗi thao tác là một giao dịch nhất quán) ---------- */
let chain = Promise.resolve();
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };

/* ---------- Phân quyền gọi nghiệp vụ ---------- */
const ADMIN_FNS = new Set(['saveAccount', 'resetPassword', 'setRole', 'deactivateAccount', 'addCatalog', 'toggleChannel']);
const ADMIN_OR_LEAD_FNS = new Set(['saveScheduleRules']); // BR10-6
const BLOCKED = new Set(['_withdrawActive', 'ingest', 'filterCandidates', 'suggestStaff', 'genPassword']);

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
const dbJson = () => JSON.stringify(E.Store.db, (k, v) => (k === 'mat_khau' || k === '_seq' ? undefined : v));
const userJson = (u) => ({ id: u.id, ho_ten: u.ho_ten, vai_tro: u.vai_tro });
const payload = (extra, u) => `{"ok":true,"server":${JSON.stringify({ db: cfg.DB_NAME, demo: cfg.DEMO_MODE })}${u ? `,"user":${JSON.stringify(userJson(u))},"db":${dbJson()}` : ''}${extra ? ',' + JSON.stringify(extra).slice(1, -1) : ''}}`;

/** Nếu ghi MySQL lỗi: nạp lại bộ nhớ từ CSDL để không lệch dữ liệu */
async function persistOrRollback() {
  try { await repo.persist(E.Store.db); }
  catch (e) { console.error('✖ Ghi MySQL thất bại:', e.message); E.Store.db = await repo.loadAll(E.Store.empty()); throw new Error('Không lưu được vào CSDL: ' + (e.sqlMessage || e.message)); }
}

async function seedFresh() {
  console.log('• CSDL trống — sinh dữ liệu mẫu bằng chính quy trình nghiệp vụ…');
  E.Auth.user = null; E.Store.db = E.Seed.build(); E.App.clock = null; E.Auth.user = null;
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
    return serial(async () => {
      const r = E.Auth.login(String(b.username || ''), String(b.password || '')); const u = E.Auth.user; E.Auth.user = null;
      if (!r.ok) return send(res, 401, r);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...newSession(req, u.id) });
      res.end(payload(null, u));
    });
  }

  const s = sessionUser(req);
  if (p === '/api/me') return s ? send(res, 200, payload(null, s.user)) : send(res, 200, payload());
  if (!s) return send(res, 401, { ok: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });

  if (p === '/api/logout' && req.method === 'POST') { sessions.delete(s.sid); return send(res, 200, { ok: true }, { 'Set-Cookie': 'nts_sid=; Path=/; Max-Age=0' }); }

  if (p === '/api/switch' && req.method === 'POST') {
    if (!cfg.DEMO_MODE) return send(res, 403, { ok: false, error: 'Chỉ dùng ở chế độ demo.' });
    const b = await readBody(req); const u = E.Store.get('nhan_su', b.id);
    if (!u || u.trang_thai_lam_viec !== 'Đang làm việc') return send(res, 400, { ok: false, error: 'Tài khoản không hợp lệ.' });
    sessions.get(s.sid).uid = u.id; return send(res, 200, payload(null, u));
  }

  if (p === '/api/reset' && req.method === 'POST') {
    if (!cfg.DEMO_MODE && s.user.vai_tro !== 'Quản trị viên') return send(res, 403, { ok: false, error: 'Không có quyền.' });
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
        const allowed = ADMIN_FNS.has(fn) ? E.Auth.isAdmin() : ADMIN_OR_LEAD_FNS.has(fn) ? E.Auth.isAdmin() || E.Auth.isLead() : E.Auth.canWork();
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
  server.listen(cfg.APP_PORT, '0.0.0.0', () => console.log(`\n✔ Navigos Talent Suite: http://localhost:${cfg.APP_PORT}  (MySQL ${cfg.DB_HOST}:${cfg.DB_PORT}/${cfg.DB_NAME})\n`));
}

main().catch((e) => { console.error('✖ Không khởi động được máy chủ:', e.message); process.exit(1); });
