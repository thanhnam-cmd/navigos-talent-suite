/* ==========================================================
   core.js — tiện ích, lưu trữ, xác thực, router, UI dùng chung
   ========================================================== */
window.App = window.App || {};

/* ---------- Tiện ích ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, l = 2) => String(n).padStart(l, '0');
const DAY = 86400000;

App.clock = null; // đồng hồ giả lập khi sinh dữ liệu mẫu
const now = () => (App.clock ? new Date(App.clock) : new Date());
const nowISO = () => now().toISOString();
const todayStr = () => { const d = now(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const toDateStr = (d) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const startOfDay = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };
const daysUntil = (dateStr) => Math.round((startOfDay(dateStr) - startOfDay(now())) / DAY);
const fmtDate = (d) => { if (!d) return '—'; d = new Date(d); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
const fmtTime = (d) => { d = new Date(d); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDT = (d) => (d ? `${fmtTime(d)} · ${fmtDate(d)}` : '—');
const fmtMoney = (n) => (n || n === 0 ? Number(n).toLocaleString('vi-VN') + ' ₫' : '—');
const fmtDur = (ms) => {
  const d = Math.floor(ms / DAY); const h = Math.floor((ms % DAY) / 3600000);
  if (d >= 1) return `${d} ngày${h && d < 3 ? ' ' + h + ' giờ' : ''}`;
  if (h >= 1) return `${h} giờ`;
  return `${Math.max(1, Math.round(ms / 60000))} phút`;
};
const relTime = (d) => {
  const ms = now() - new Date(d); const m = Math.round(ms / 60000);
  if (m < 1) return 'vừa xong'; if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60); if (h < 24) return `${h} giờ trước`;
  const dd = Math.round(h / 24); return dd < 30 ? `${dd} ngày trước` : fmtDate(d);
};
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const initials = (name) => { const p = String(name || '?').trim().split(/\s+/); return ((p.length > 1 ? p[p.length - 2][0] : '') + p[p.length - 1][0]).toUpperCase(); };
const AV_COLORS = ['#0a6cff', '#7c3aed', '#12a150', '#d97706', '#e5383b', '#0891b2', '#283583', '#db2777'];
const avatar = (name, cls = '') => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `<span class="avatar ${cls}" style="background:${AV_COLORS[h % AV_COLORS.length]}">${esc(initials(name))}</span>`; };
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim());
const isPhone = (s) => /^(\+?\d[\d\s.-]{7,14})$/.test(String(s).trim());
const sum = (a) => a.reduce((x, y) => x + y, 0);
const groupBy = (a, f) => a.reduce((m, x) => ((m[f(x)] = m[f(x)] || []).push(x), m), {});
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------- SHA-256 (BR1-1: mật khẩu chỉ lưu dạng đã mã hóa) ---------- */
function sha256(ascii) {
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const maxWord = 2 ** 32; let result = ''; const words = []; const asciiBitLength = ascii.length * 8;
  const hash = []; const k = []; let primeCounter = 0; const isComposite = {};
  for (let c = 2; primeCounter < 64; c++) {
    if (!isComposite[c]) { for (let i = 0; i < 313; i += c) isComposite[i] = c;
      if (primeCounter < 8) hash[primeCounter] = (c ** .5 * maxWord) | 0;
      k[primeCounter++] = (c ** (1 / 3) * maxWord) | 0; }
  }
  ascii = unescape(encodeURIComponent(ascii)) + '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) { const j = ascii.charCodeAt(i); words[i >> 2] |= j << (((3 - i) % 4) * 8); }
  words[words.length] = (asciiBitLength / maxWord) | 0; words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16)); const oldHash = hash.slice(0, 8);
    let h = hash;
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2]; const a = h[0], e = h[4];
      const temp1 = h[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + k[i] +
        (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h = [(temp1 + temp2) | 0].concat(h); h[4] = (h[4] + temp1) | 0; h.length = 8;
    }
    for (let i = 0; i < 8; i++) hash[i] = (h[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
  return result;
}
const hashPw = (pw) => sha256('navigos::' + pw);

/* ---------- Biểu tượng (SVG nét) ---------- */
const ICONS = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  users: '<path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3.5"/><path d="M21 20v-1a4 4 0 0 0-3-3.8M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  idcard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
  building: '<rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 9h3a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4M10 21v-3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 5-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  filter: '<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  userX: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- Kho dữ liệu (19 bảng theo ERD — Hình 3.26) ---------- */
const DB_KEY = 'navigos_talent_db_v3';
const TABLES = ['khu_vuc', 'linh_vuc', 'cap_bac', 'chuyen_mon', 'nhan_su', 'khach_hang', 'du_an_tuyen_dung', 'chi_tiet_du_an',
  'kenh_dang_tuyen', 'tin_dang', 'phan_cong', 'ung_vien', 'ho_so_ung_tuyen', 'lich_su_trang_thai', 'de_cu', 'lich_phong_van',
  'ket_qua_phong_van', 'feedback', 'ket_qua_tuyen_dung', 'quy_tac_xep_lich'];

const Store = {
  db: null,
  empty() { const d = { _seq: {}, _sync_log: [] }; TABLES.forEach((t) => (d[t] = [])); return d; },
  load() {
    try { const raw = localStorage.getItem(DB_KEY); if (raw) { this.db = JSON.parse(raw); return true; } } catch (e) { /* bỏ qua */ }
    return false;
  },
  save() { if (App.seeding) return; try { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); } catch (e) { console.warn('Không lưu được dữ liệu', e); } },
  reset() { try { localStorage.removeItem(DB_KEY); } catch (e) { /* bỏ qua */ } this.db = Seed.build(); this.save(); },
  nextId(t) { this.db._seq[t] = (this.db._seq[t] || 0) + 1; return this.db._seq[t]; },
  insert(t, row) { const r = { id: this.nextId(t), ...row }; this.db[t].push(r); return r; },
  all(t) { return this.db[t]; },
  get(t, id) { id = Number(id); return this.db[t].find((r) => r.id === id); },
  where(t, f) { return this.db[t].filter(f); },
  name(t, id) { const r = this.get(t, id); return r ? r.ten : '—'; },
};
const DB = new Proxy({}, { get: (_, t) => Store.db[t] });

/* ---------- Mã hiển thị ---------- */
const Code = {
  kh: (id) => 'KH' + pad(id, 3), da: (id) => 'DA' + pad(id, 3), ct: (id) => 'VT' + pad(id, 3),
  uv: (id) => 'UV' + pad(id, 4), hs: (id) => 'HS' + pad(id, 4), dc: (id) => 'DC' + pad(id, 4), ns: (id) => 'NS' + pad(id, 3),
};

/* ---------- Xác thực & phân quyền (UC_01, UC_02) ---------- */
const ROLES = { ADMIN: 'Quản trị viên', BGD: 'Ban Giám đốc', QL: 'Quản lý', NV: 'Nhân viên' };
const Auth = {
  user: null,
  restore() {
    try { const id = sessionStorage.getItem('navigos_uid'); if (id) { const u = Store.get('nhan_su', id); if (u && u.trang_thai_lam_viec === 'Đang làm việc') this.user = u; } } catch (e) { /* bỏ qua */ }
  },
  login(username, password) {
    const u = DB.nhan_su.find((x) => norm(x.ten_dang_nhap) === norm(username) || norm(x.email) === norm(username));
    if (!u || u.mat_khau !== hashPw(password)) return { ok: false, error: 'Đăng nhập thất bại. Tên đăng nhập hoặc mật khẩu không đúng.' }; // 5a — không nêu trường sai
    if (u.trang_thai_lam_viec !== 'Đang làm việc') return { ok: false, error: 'Tài khoản đã ngừng hoạt động (nhân sự đã nghỉ việc). Vui lòng liên hệ Quản trị viên.' }; // 5b
    this.user = u; try { sessionStorage.setItem('navigos_uid', u.id); } catch (e) { /* bỏ qua */ }
    return { ok: true };
  },
  switchTo(id) { this.user = Store.get('nhan_su', id); try { sessionStorage.setItem('navigos_uid', id); } catch (e) { /* bỏ qua */ } return { ok: true }; },
  logout() { this.user = null; try { sessionStorage.removeItem('navigos_uid'); } catch (e) { /* bỏ qua */ } location.hash = '#/login'; },
  role() { return this.user?.vai_tro; },
  isAdmin() { return this.role() === ROLES.ADMIN; },
  isLead() { return [ROLES.BGD, ROLES.QL].includes(this.role()); },
  isStaff() { return this.role() === ROLES.NV; },
  canWork() { return this.isLead() || this.isStaff(); }, // nghiệp vụ tuyển dụng
};

/* ---------- Router ---------- */
const Router = {
  routes: [],
  add(pattern, page, opts = {}) { const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$'); this.routes.push({ re, keys, page, opts }); },
  go(h) { location.hash = h; },
  resolve() {
    const raw = location.hash.slice(1) || '/'; const [path, qs] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    if (!Auth.user && path !== '/login') { App.afterLogin = raw; return this.go('#/login'); } // 3a
    for (const r of this.routes) {
      const m = path.match(r.re); if (!m) continue;
      const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      if (r.opts.allow && !r.opts.allow()) return UI.renderDenied();
      return UI.render(r.page, params, query, r.opts);
    }
    UI.renderNotFound();
  },
};

/* ---------- UI dùng chung ---------- */
const UI = {
  current: null,
  render(page, params, query, opts) {
    closeAllOverlays();
    if (opts.bare) { document.body.innerHTML = ''; page.render(document.body, params, query); this.current = null; return; }
    this.ensureShell(opts.nav);
    const view = $('#view'); view.innerHTML = '';
    this.current = { page, params, query };
    try { page.render(view, params, query); } catch (e) { console.error(e); view.innerHTML = `<div class="callout red">${icon('alert')} Đã xảy ra lỗi khi hiển thị trang: ${esc(e.message)}</div>`; }
    window.scrollTo(0, 0);
  },
  refresh() { if (this.current) { const y = window.scrollY; const v = $('#view'); v.innerHTML = ''; this.current.page.render(v, this.current.params, this.current.query); this.updateNav(); window.scrollTo(0, y); } },
  renderDenied() { this.ensureShell(); $('#view').innerHTML = `<div class="card card-pad empty">${icon('lock')}<h3>Không có quyền truy cập</h3><p>Chức năng này không thuộc phạm vi vai trò <b>${esc(Auth.role())}</b>.</p><a class="btn" href="#/">Về trang chủ</a></div>`; },
  renderNotFound() { this.ensureShell(); $('#view').innerHTML = `<div class="card card-pad empty">${icon('info')}<h3>Không tìm thấy trang</h3><a class="btn" href="#/">Về trang chủ</a></div>`; },

  ensureShell(active) {
    if (!$('#view')) {
      document.body.innerHTML = `
      <div class="app" id="app">
        <aside class="sidebar" id="sidebar"></aside>
        <div class="scrim" id="scrim"></div>
        <div class="main">
          <header class="topbar">
            <button class="icon-btn menu-btn" id="menuBtn" aria-label="Mở menu">${icon('menu')}</button>
            <div class="search">${icon('search', 'sm')}<input id="gsearch" placeholder="Tìm vị trí, ứng viên, khách hàng…" autocomplete="off"></div>
            <div class="spacer"></div>
            <button class="icon-btn" id="bellBtn" aria-label="Thông báo">${icon('bell')}<span class="dot" id="bellDot" hidden></span></button>
            <button class="user-chip" id="userBtn"><div class="meta"><b id="uName"></b><span id="uRole"></span></div><span id="uAv"></span></button>
          </header>
          <main class="view" id="view"></main>
          <footer class="footer">© ${new Date().getFullYear()} Navigos Group Việt Nam · Talent Suite — Hệ thống quản lý dự án tuyển dụng (Navigos Search)</footer>
        </div>
      </div><div class="toasts" id="toasts"></div>`;
      $('#menuBtn').onclick = () => $('#app').classList.toggle('nav-open');
      $('#scrim').onclick = () => $('#app').classList.remove('nav-open');
      $('#bellBtn').onclick = (e) => { e.stopPropagation(); Shell.toggleNotifications(); };
      $('#userBtn').onclick = (e) => { e.stopPropagation(); Shell.toggleUserMenu(); };
      $('#gsearch').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) Router.go('#/tim-kiem?q=' + encodeURIComponent(e.target.value.trim())); });
      document.addEventListener('click', (e) => { if (!e.target.closest('.dropdown')) $$('.dropdown').forEach((d) => d.remove()); });
    }
    this.updateNav();
  },
  updateNav() {
    const u = Auth.user; if (!u || !$('#sidebar')) return;
    $('#uName').textContent = u.ho_ten; $('#uRole').textContent = u.vai_tro + ' · ' + Store.name('khu_vuc', u.ma_khu_vuc);
    $('#uAv').innerHTML = avatar(u.ho_ten);
    const c = Shell.counts();
    const item = (href, ic, label, n) => `<a href="${href}" data-href="${href}">${icon(ic)}<span>${label}</span>${n ? `<span class="count">${n}</span>` : ''}</a>`;
    let nav = item('#/', 'home', 'Trang chủ');
    if (Auth.canWork()) {
      nav += `<div class="nav-label">Nghiệp vụ tuyển dụng</div>`;
      nav += item('#/du-an', 'briefcase', 'Dự án tuyển dụng', Auth.isLead() ? c.choPhanCong : 0);
      nav += item('#/ung-vien', 'users', 'Kho ứng viên', c.chuaChuanHoa);
      nav += item('#/thu-thap', 'inbox', 'Thu thập hồ sơ', c.choGan);
      nav += item('#/de-cu', 'send', 'Đề cử ứng viên', Auth.isLead() ? c.choDuyet : c.canSua);
      nav += item('#/phong-van', 'calendar', 'Quản lý phỏng vấn', c.pvHomNay);
      nav += item('#/ket-qua', 'checkCircle', 'Kết quả tuyển dụng');
      nav += item('#/khach-hang', 'building', 'Khách hàng');
    }
    if (Auth.isLead()) { nav += `<div class="nav-label">Quản lý</div>` + item('#/bao-cao', 'chart', 'Báo cáo - Thống kê') + item('#/nhan-su', 'idcard', 'Nhân sự') + item('#/quy-tac-lich', 'clock', 'Quy tắc xếp lịch PV'); }
    if (Auth.isAdmin()) { nav += `<div class="nav-label">Quản trị hệ thống</div>` + item('#/tai-khoan', 'shield', 'Tài khoản & phân quyền') + item('#/danh-muc', 'layers', 'Danh mục dùng chung') + item('#/quy-tac-lich', 'clock', 'Quy tắc xếp lịch PV'); }
    $('#sidebar').innerHTML = `<a class="brand" href="#/"><img src="assets/logo.png" alt="Navigos Group"></a>
      <nav class="nav">${nav}</nav>
      <div class="sidebar-foot"><a href="#/cai-dat">${icon('settings')}<span>Cài đặt</span></a><a href="#" class="danger" id="logoutBtn">${icon('logout')}<span>Đăng xuất</span></a></div>`;
    $('#logoutBtn').onclick = (e) => { e.preventDefault(); Auth.logout(); };
    const path = '#' + (location.hash.slice(1).split('?')[0] || '/');
    let best = null; $$('.nav a').forEach((a) => { const h = a.dataset.href; if (path === h || (h !== '#/' && path.startsWith(h))) if (!best || h.length > best.dataset.href.length) best = a; });
    (best || $('.nav a')).classList.add('active');
    $$('.nav a').forEach((a) => a.addEventListener('click', () => $('#app').classList.remove('nav-open')));
    $('#bellDot').hidden = !Shell.notifications().length;
  },
};

/* ---------- Toast / Modal / Drawer ---------- */
function toast(msg, type = 'ok', ms = 3800) {
  const box = $('#toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'toasts', className: 'toasts' }));
  const ic = { ok: 'checkCircle', err: 'alert', warn: 'alert', info: 'info' }[type];
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = icon(ic) + `<div>${msg}</div>`;
  box.appendChild(t); setTimeout(() => t.remove(), ms);
}
function closeAllOverlays() { $$('.overlay').forEach((o) => o.remove()); $$('.dropdown').forEach((d) => d.remove()); }
function modal({ title, body, foot, size = '', drawer = false, onMount }) {
  const ov = document.createElement('div'); ov.className = 'overlay' + (drawer ? ' drawer-ov' : '');
  ov.innerHTML = `<div class="${drawer ? 'drawer' : 'modal ' + size}" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Đóng">${icon('x')}</button></div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  document.body.appendChild(ov);
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  $$('[data-close]', ov).forEach((b) => (b.onclick = close));
  const api = { el: ov, close, $: (s) => $(s, ov), $$: (s) => $$(s, ov) };
  onMount && onMount(api);
  const first = $('input:not([type=hidden]):not([type=checkbox]),select,textarea', ov); first && setTimeout(() => first.focus(), 30);
  return api;
}
function confirmBox({ title = 'Xác nhận', message, okText = 'Đồng ý', danger = false, input = null, onOk }) {
  modal({
    title, size: 'sm',
    body: `<p style="margin-top:0">${message}</p>${input ? `<div class="field"><label>${input.label}${input.required ? ' <span class="req">*</span>' : ''}</label><textarea class="textarea" id="cfInput" placeholder="${esc(input.placeholder || '')}"></textarea><div class="err" id="cfErr"></div></div>` : ''}`,
    foot: `<button class="btn" data-close>Hủy</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfOk">${okText}</button>`,
    onMount: (m) => {
      m.$('#cfOk').onclick = () => {
        const v = input ? m.$('#cfInput').value.trim() : null;
        if (input?.required && !v) { m.$('#cfErr').textContent = 'Vui lòng nhập ' + input.label.toLowerCase() + '.'; m.$('#cfInput').classList.add('invalid'); return; }
        const r = onOk(v); if (r === false) return; m.close();
      };
    },
  });
}

/* ---------- Form helpers ---------- */
const Form = {
  values(root) { const o = {}; $$('[name]', root).forEach((el) => { if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'file') o[el.name] = el.files[0]?.name || el.dataset.current || ''; else o[el.name] = el.value.trim(); }); return o; },
  showErrors(root, errors) {
    $$('.err', root).forEach((e) => e.remove()); $$('.invalid', root).forEach((e) => e.classList.remove('invalid'));
    let first = null;
    Object.entries(errors || {}).forEach(([k, msg]) => {
      const el = $(`[name="${k}"]`, root);
      if (el) { el.classList.add('invalid'); const d = document.createElement('div'); d.className = 'err'; d.textContent = msg; el.closest('.field')?.appendChild(d); first = first || el; }
      else toast(msg, 'err');
    });
    first?.focus();
  },
  field(label, name, { type = 'text', value = '', req = false, opts = null, ph = '', full = false, hint = '', attrs = '' } = {}) {
    let input;
    if (opts) input = `<select class="select" name="${name}" ${attrs}>${opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    else if (type === 'textarea') input = `<textarea class="textarea" name="${name}" placeholder="${esc(ph)}" ${attrs}>${esc(value)}</textarea>`;
    else input = `<input class="input" type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(ph)}" ${attrs}>`;
    return `<div class="field ${full ? 'full' : ''}"><label>${label}${req ? ' <span class="req">*</span>' : ''}</label>${input}${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
  },
  opts(table, { blank = null, filter = null } = {}) { let rows = DB[table]; if (filter) rows = rows.filter(filter); return [...(blank !== null ? [['', blank]] : []), ...rows.map((r) => [r.id, r.ten])]; },
};

/* ---------- Badge trạng thái ---------- */
const STATUS_TONE = {
  'Mới tiếp nhận': 'sky', 'Đang thực hiện': 'blue', 'Hoàn thành': 'green', 'Đã đóng': '', 'Đã hủy': 'red',
  'Mới apply': 'sky', 'Đề cử': 'violet', 'Phỏng vấn': 'amber', 'Thử việc': 'green', 'Bị loại': 'red', 'Chờ gán': 'amber',
  'Hoạt động': 'green', 'Đang thử việc': 'blue', 'Lưu trữ': '',
  'Chờ duyệt': 'amber', 'Cần chỉnh sửa': 'red', 'Đã duyệt': 'green', 'Đã gửi khách hàng': 'blue', 'Đã gỡ': '',
  'Đã lên lịch': 'blue', 'Đã phỏng vấn': 'green', 'Đạt': 'green', 'Không đạt': 'red', 'Cần phỏng vấn thêm': 'amber',
  'Chấp nhận offer': 'green', 'Từ chối offer': 'red', 'Đồng ý phỏng vấn': 'green', 'Từ chối ứng viên': 'red', 'Cần đề cử đợt tiếp theo': 'amber',
  'Đang làm việc': 'green', 'Đã nghỉ việc': '', 'Đang hợp tác': 'green', 'Ngừng hợp tác': '', 'Đang phụ trách': 'blue', 'Đã chuyển': '',
  'Đang đăng': 'green', 'Đã gỡ tin': '', 'Ngừng hoạt động': '',
};
const badge = (s, extra = '') => `<span class="badge ${STATUS_TONE[s] ?? ''} ${extra}"><span class="dot"></span>${esc(s)}</span>`;
const progressBar = (pct, tone = '') => `<div class="progress ${tone}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
const emptyState = (msg, ic = 'inbox') => `<div class="empty">${icon(ic)}<div>${msg}</div></div>`;

/* ---------- Biểu đồ SVG (không phụ thuộc thư viện) ---------- */
const PALETTE = ['#0a6cff', '#22b4e6', '#7c3aed', '#12a150', '#d97706', '#e5383b', '#283583', '#db2777'];
const Charts = {
  line({ labels, series, h = 220 }) {
    const W = 640, H = h, P = { l: 34, r: 12, t: 12, b: 26 };
    const max = Math.max(4, ...series.flatMap((s) => s.data)); const top = Math.ceil(max / 4) * 4;
    const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, labels.length - 1);
    const y = (v) => H - P.b - (v / top) * (H - P.t - P.b);
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = (top / 4) * k; g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e6eaf1" stroke-dasharray="4 4"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
    const step = Math.ceil(labels.length / 8);
    labels.forEach((l, i) => { if (i % step === 0 || i === labels.length - 1) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((s, si) => {
      const c = s.color || PALETTE[si]; const pts = s.data.map((v, i) => [x(i), y(v)]);
      let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
      g += `<path d="${d} L${pts.at(-1)[0]},${H - P.b} L${pts[0][0]},${H - P.b}Z" fill="${c}" opacity=".07"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.4"/>`;
      pts.forEach(([a, b], i) => (g += `<circle cx="${a}" cy="${b}" r="3" fill="#fff" stroke="${c}" stroke-width="2"><title>${esc(labels[i])}: ${s.data[i]} ${esc(s.name)}</title></circle>`));
    });
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg><div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || PALETTE[i]}"></i>${esc(s.name)}</span>`).join('')}</div></div>`;
  },
  /** Thanh ngang HTML — chữ luôn rõ ở mọi độ rộng */
  bars({ data, color }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return `<div class="hbars">${data.map((d, i) => `<div class="hbar" title="${esc(d.label)}: ${d.value}"><span class="lb">${esc(d.label)}</span><span class="tr"><i style="width:${Math.max(2, (d.value / max) * 100)}%;background:${d.color || color || PALETTE[i % PALETTE.length]}"></i></span><b>${d.value}</b></div>`).join('')}</div>`;
  },
  donut({ data, size = 200, center = '' }) {
    const total = sum(data.map((d) => d.value)) || 1; const R = 80, r = 54, C = 100; let a0 = -Math.PI / 2; let g = '';
    data.forEach((d, i) => {
      if (!d.value) return; const a1 = a0 + (d.value / total) * Math.PI * 2 - (data.filter((x) => x.value).length > 1 ? 0.03 : 0);
      const big = a1 - a0 > Math.PI ? 1 : 0; const p = (a, rad) => [C + rad * Math.cos(a), C + rad * Math.sin(a)];
      const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
      g += `<path d="M${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${big} 0 ${x3},${y3}Z" fill="${d.color || PALETTE[i % PALETTE.length]}"><title>${esc(d.label)}: ${d.value}</title></path>`;
      a0 = a0 + (d.value / total) * Math.PI * 2;
    });
    g += `<text x="100" y="98" text-anchor="middle" style="font-size:26px;font-weight:800;fill:#0f172a">${total === 1 && !data.some((d) => d.value) ? 0 : sum(data.map((d) => d.value))}</text><text x="100" y="118" text-anchor="middle">${esc(center)}</text>`;
    return `<div class="chart" style="max-width:${size}px;margin:0 auto"><svg viewBox="0 0 200 200">${g}</svg></div><div class="legend">${data.map((d, i) => `<span><i style="background:${d.color || PALETTE[i % PALETTE.length]}"></i>${esc(d.label)} (${d.value})</span>`).join('')}</div>`;
  },
  funnel(steps) {
    const max = Math.max(1, steps[0]?.value || 1);
    return steps.map((s, i) => `<div class="funnel-row"><div class="strong">${esc(s.label)}</div><div><div class="bar" style="width:${Math.max(6, (s.value / max) * 100)}%;background:${s.color || PALETTE[i]}">${s.value}</div></div><div class="rate">${i ? (steps[i - 1].value ? Math.round((s.value / steps[i - 1].value) * 100) + '%' : '—') : '100%'}</div></div>`).join('');
  },
};

/* ---------- Xuất Excel (.xls) / PDF (in) ---------- */
const Export = {
  excel(filename, title, headers, rows) {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>
      <h3>${esc(title)}</h3><p>Xuất lúc ${fmtDT(new Date())} — Người xuất: ${esc(Auth.user?.ho_ten)}</p>
      <table border="1"><thead><tr>${headers.map((h) => `<th style="background:#283583;color:#fff">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename + '.xls'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Đã xuất tệp Excel: ' + esc(filename) + '.xls');
  },
  pdf() { toast('Chọn “Lưu dưới dạng PDF” trong hộp thoại in để xuất PDF.', 'info'); setTimeout(() => window.print(), 300); },
};

/* ---------- Phân trang ---------- */
function paginate(rows, page, per = 10) { const pages = Math.max(1, Math.ceil(rows.length / per)); page = Math.min(Math.max(1, page), pages); return { rows: rows.slice((page - 1) * per, page * per), page, pages, total: rows.length, from: rows.length ? (page - 1) * per + 1 : 0, to: Math.min(page * per, rows.length) }; }
function pagerHtml(p, unit = 'bản ghi') {
  if (p.total <= 0) return '';
  let btns = ''; for (let i = 1; i <= p.pages; i++) if (p.pages <= 7 || i === 1 || i === p.pages || Math.abs(i - p.page) <= 1) btns += `<button data-page="${i}" class="${i === p.page ? 'active' : ''}">${i}</button>`; else if (!btns.endsWith('…')) btns += '…';
  return `<div class="pager"><span class="muted small">Hiển thị ${p.from} - ${p.to} trên tổng số ${p.total} ${unit}</span><div class="pages">${btns}</div></div>`;
}
