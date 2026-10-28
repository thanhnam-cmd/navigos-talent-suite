/* ==========================================================
   Kiểm thử nhanh API + MySQL (máy chủ phải đang chạy).
   node scripts/smoke-test.js            — chỉ kiểm tra đọc & phân quyền
   node scripts/smoke-test.js --scenario — chạy kịch bản demo "ứng viên nhận việc"
                                           (có ghi dữ liệu; sau đó tự khôi phục dữ liệu mẫu)
   ========================================================== */
const { loadEnv, sslOptions } = require('../server/env');
const cfg = loadEnv();
const BASE = process.env.SMOKE_URL || `http://localhost:${cfg.APP_PORT}`;
// Bản deploy: MySQL nằm trong container, máy kiểm thử không truy cập trực tiếp → bỏ qua bước đối chiếu SQL
const REMOTE = !/\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE + '/');
let cookie = '';
let pass = 0, failN = 0;
const ok = (cond, msg) => { cond ? pass++ : failN++; console.log(`${cond ? '✔' : '✖'} ${msg}`); };

async function call(method, url, body) {
  const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return { status: r.status, data: await r.json() };
}
const login = (u, p = '123456') => call('POST', '/api/login', { username: u, password: p });
const rpc = async (fn, ...args) => { const d = (await call('POST', '/api/rpc', { fn, args })).data; return d.ok ? d.result : d; };

async function sqlCount(sql, params) {
  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({ host: cfg.DB_HOST, port: cfg.DB_PORT, user: cfg.DB_USER, password: cfg.DB_PASSWORD, database: cfg.DB_NAME, ssl: sslOptions(cfg) });
  const [r] = await c.query(sql, params); await c.end(); return r;
}

(async () => {
  const h = await call('GET', '/api/health');
  ok(h.data.ok && h.data.mysql.startsWith('8.'), `Máy chủ & MySQL ${h.data.mysql} / ${h.data.database}`);

  ok((await login('admin', 'sai-mat-khau')).status === 401, 'Sai mật khẩu bị từ chối (BR1-1)');
  ok((await login('vankhai')).status === 401, 'Tài khoản "Đã nghỉ việc" không đăng nhập được (BR1-2)');
  ok((await call('POST', '/api/rpc', { fn: 'saveCustomer', args: [{}] })).status === 401, 'Chưa đăng nhập không gọi được nghiệp vụ');

  let r = await login('nhanvien');
  ok(r.status === 200 && r.data.user.vai_tro === 'Nhân viên', 'Đăng nhập Nhân viên');
  ok(!JSON.stringify(r.data.db).includes('mat_khau'), 'Dữ liệu trả về không chứa mật khẩu');
  ok((await rpc('approveRecommendation', 1)).ok === false, 'Nhân viên không được duyệt đề cử (BR6-4)');
  ok((await call('POST', '/api/rpc', { fn: 'saveAccount', args: [{}] })).status === 403, 'Nhân viên không được quản lý tài khoản (BR2-3)');

  if (REMOTE) ok(r.data.db.ung_vien.length > 0 && r.data.db.ho_so_ung_tuyen.length > 0, `Dữ liệu đọc từ MySQL trên máy chủ: ${r.data.db.ung_vien.length} ứng viên, ${r.data.db.ho_so_ung_tuyen.length} hồ sơ`);
  else { const [{ n: nUv }] = await sqlCount('SELECT COUNT(*) n FROM UNG_VIEN'); ok(nUv === r.data.db.ung_vien.length, `Số ứng viên khớp giữa API và MySQL (${nUv})`); }

  if (process.argv.includes('--scenario') && !REMOTE) {
    console.log('\n— Kịch bản demo: ứng viên chấp nhận offer —');
    const db = r.data.db;
    const long = db.ung_vien.find((u) => u.ho_ten === 'Nguyễn Hoàng Long');
    const hsPv = db.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === long.id && h.trang_thai === 'Phỏng vấn');
    const today = new Date().toISOString().slice(0, 10);
    const res = await rpc('hiringResult', hsPv.id, { ket_qua: 'Chấp nhận offer', ngay_nhan_viec: today, ngay_khach_hang_bao: today, email_xac_nhan: 'xac_nhan.eml' });
    ok(res.ok && res.withdrawn === 1, `Ghi nhận chấp nhận offer → tự loại khỏi ${res.withdrawn} danh sách khác`);
    const [uv] = await sqlCount('SELECT trang_thai FROM UNG_VIEN WHERE ma_ung_vien = ?', [long.id]);
    ok(uv.trang_thai === 'Đang thử việc', 'MySQL: ứng viên → Đang thử việc');
    const hsRows = await sqlCount('SELECT ma_chi_tiet_du_an ct, trang_thai FROM HO_SO_UNG_TUYEN WHERE ma_ung_vien = ?', [long.id]);
    ok(hsRows.some((x) => x.trang_thai === 'Thử việc') && hsRows.some((x) => x.trang_thai === 'Bị loại'), 'MySQL: hồ sơ còn lại tự động "Bị loại"');
    const [ct] = await sqlCount('SELECT trang_thai FROM CHI_TIET_DU_AN WHERE ma_chi_tiet_du_an = ?', [hsPv.ma_chi_tiet_du_an]);
    ok(ct.trang_thai === 'Hoàn thành', 'MySQL: vị trí đủ chỉ tiêu → Hoàn thành');
    const hist = await sqlCount('SELECT trang_thai_moi, ghi_chu FROM LICH_SU_TRANG_THAI WHERE ma_ho_so_ung_vien = ? ORDER BY thoi_diem_thay_doi', [hsPv.id]);
    ok(hist.at(-1).trang_thai_moi === 'Thử việc', `MySQL: lịch sử trạng thái ghi đủ ${hist.length} mốc`);
    const p = await rpc('probationFailed', hsPv.id, 'Kiểm thử: thử việc không đạt');
    const [uv2] = await sqlCount('SELECT trang_thai FROM UNG_VIEN WHERE ma_ung_vien = ?', [long.id]);
    ok(p.ok && uv2.trang_thai === 'Hoạt động', 'Thử việc không đạt → ứng viên quay lại kho (MySQL)');
    const rs = await call('POST', '/api/reset');
    ok(rs.data.ok, 'Khôi phục dữ liệu mẫu');
  }
  console.log(`\nKết quả: ${pass} đạt, ${failN} lỗi`);
  process.exit(failN ? 1 : 0);
})().catch((e) => { console.error('✖', e.message); process.exit(1); });
