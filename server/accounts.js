/* ==========================================================
   accounts.js — Mật khẩu ban đầu của các tài khoản và mã khôi phục
   của Quản trị viên. Kho mã để công khai nên mã băm mật khẩu KHÔNG
   nằm trong mã nguồn mà đọc từ biến môi trường (Render: Environment;
   máy cục bộ: tệp .env):
     NTS_ACCOUNTS = ten_dang_nhap:ma_bam_sha256,ten_dang_nhap:ma_bam_sha256,…
     NTS_RECOVERY = ma_bam_sha256 của mã khôi phục Quản trị viên
   Chưa cấu hình thì dùng mật khẩu ngẫu nhiên dài của bản trước (fallback)
   và tắt khôi phục bằng mã.
   ========================================================== */
const crypto = require('crypto');
const H = (p) => crypto.createHash('sha256').update('navigos::' + p).digest('hex');

// Mật khẩu ngẫu nhiên 12 ký tự của bản trước — không đoán được dù mã băm công khai
const fallback = {
  admin: '194fc1b4f8109e57ae9fff636e645138a2a529ba1131375ceadec18b0f53d7ae',
  giamdoc: '2171bd4c169f3894cb10ba120c4f73c06bce51606579654d64283a50d193db2f',
  quanly: '8ac4aa110d484b4a0e98495157a2988bad7e8e3e1088edae9ec188bceaa6ddac',
  nhanvien: '9f262b35a5f42146cde7275f32ec1785056ea9421526c5ea0137d17c14a4ee3b',
  thuha: '660eb471e8d7ed6cd4619e35babc880e2c3ec9489e5c5e09f5b4c7203365ba13',
  hoangphuc: 'fb4c6e7422c52b55ed595da9ed7429f6991ecf90d84b64a72581356d274cd073',
  thanhtam: '047e3de65bfde159dd5ab2e42fe04c1135e4e540e81868d7d5ee4868e8414a7a',
  giabao: '337ed10c49eafd8fbd710eb9e7183b67b59846e7a718db5d152acf3645565abd',
  vankhai: '115b896e42d33cdaee8b6726385270f43cfc72a8285fb3376b981f2722f9ebfa',
  thanhnga: '003bdbc5a352b41ea73cdb992a24fd941d0a08813181cacfeacf4108632aeb80',
};
const parse = (s) => Object.fromEntries(String(s || '').split(',').map((x) => x.trim().split(':')).filter(([u, h]) => u && /^[0-9a-f]{64}$/.test(h || '')));
const fromEnv = parse(process.env.NTS_ACCOUNTS);
const current = Object.keys(fromEnv).length ? fromEnv : fallback;
// Thay mật khẩu ban đầu cũ (123456, bản trước) bằng mật khẩu hiện tại nếu tài khoản chưa tự đổi
const previous = Object.fromEntries(Object.keys(current).map((u) => [u, [H('123456'), fallback[u]].filter((h) => h && h !== current[u])]));
const recovery = /^[0-9a-f]{64}$/.test(process.env.NTS_RECOVERY || '') ? process.env.NTS_RECOVERY : null;

module.exports = { current, previous, recovery, configured: Object.keys(fromEnv).length > 0 };
