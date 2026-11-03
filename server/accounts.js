/* ==========================================================
   accounts.js — Mật khẩu ban đầu của các tài khoản (chỉ lưu mã băm
   SHA-256, không lưu mật khẩu gốc). Dùng khi sinh dữ liệu mẫu và để
   thay mật khẩu demo cũ (123456) của CSDL đang chạy. Người dùng đổi
   mật khẩu tại Cài đặt; Quản trị viên đặt lại tại Tài khoản.
   ========================================================== */
module.exports = {
  admin: '194fc1b4f8109e57ae9fff636e645138a2a529ba1131375ceadec18b0f53d7ae', // Quản trị viên
  giamdoc: '2171bd4c169f3894cb10ba120c4f73c06bce51606579654d64283a50d193db2f', // Ban Giám đốc
  quanly: '8ac4aa110d484b4a0e98495157a2988bad7e8e3e1088edae9ec188bceaa6ddac', // Quản lý (Hà Nội)
  nhanvien: '9f262b35a5f42146cde7275f32ec1785056ea9421526c5ea0137d17c14a4ee3b', // Nhân viên
  thuha: '660eb471e8d7ed6cd4619e35babc880e2c3ec9489e5c5e09f5b4c7203365ba13', // Nhân viên
  hoangphuc: 'fb4c6e7422c52b55ed595da9ed7429f6991ecf90d84b64a72581356d274cd073', // Nhân viên (HCM)
  thanhtam: '047e3de65bfde159dd5ab2e42fe04c1135e4e540e81868d7d5ee4868e8414a7a', // Nhân viên (HCM)
  giabao: '337ed10c49eafd8fbd710eb9e7183b67b59846e7a718db5d152acf3645565abd', // Nhân viên (Đà Nẵng)
  vankhai: '115b896e42d33cdaee8b6726385270f43cfc72a8285fb3376b981f2722f9ebfa', // Đã nghỉ việc — không đăng nhập được
  thanhnga: '003bdbc5a352b41ea73cdb992a24fd941d0a08813181cacfeacf4108632aeb80', // Quản lý (HCM)
};
