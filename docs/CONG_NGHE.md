# Công nghệ sử dụng — Navigos Talent Suite

Ứng dụng web nhiều người dùng: trình duyệt (giao diện) ↔ máy chủ Node.js (API + nghiệp vụ) ↔ CSDL MySQL 8.

## Ngôn ngữ

| Ngôn ngữ | Dùng ở đâu |
|---|---|
| **JavaScript (ES2020+)** | Toàn bộ ứng dụng: giao diện chạy trên trình duyệt (`public/js`) và máy chủ Node.js (`server`, `scripts`, `docker/init-db.js`) |
| **SQL (MySQL 8)** | Lược đồ CSDL `database/schema.sql` (24 bảng, khóa ngoại, ràng buộc CHECK), migration trong `server/repository.js` |
| **HTML5** | Trang khung `public/index.html`; giao diện từng màn hình sinh bằng JavaScript (template string) |
| **CSS3** | `public/css/app.css`: biến màu, Grid/Flexbox, responsive cho điện thoại, bản in `@page` (A4, chân trang, số trang) |
| **Shell (bash)** | `docker/start.sh`: khởi động MySQL + Node trong container |

## Máy chủ (back-end)

- **Node.js** (≥ 18; bản deploy dùng Node 20): máy chủ HTTP viết bằng mô-đun `http` có sẵn, **không dùng framework** (không Express).
  - API JSON: `/api/login`, `/api/logout`, `/api/me`, `/api/rpc`, `/api/reset`, `/api/health`.
  - Phiên đăng nhập bằng cookie `HttpOnly`, `SameSite=Lax`, `Secure` khi chạy HTTPS; tự hết hạn sau 8 giờ.
  - Phân quyền theo vai trò ngay tại máy chủ (Quản trị viên / Ban Giám đốc / Quản lý / Nhân viên; Phụ trách / Hỗ trợ theo vị trí).
  - Mật khẩu băm **SHA-256** (mô-đun `crypto`); khóa đăng nhập 5 phút sau 5 lần sai.
  - Mọi thao tác ghi chạy tuần tự và ghi xuống MySQL trong **một giao dịch** (lỗi thì hoàn tác).
- **Tầng nghiệp vụ dùng chung** (`public/js/core.js`, `services.js`, `seed.js`): cùng một mã nguồn chạy trên máy chủ (nạp vào sandbox `vm` của Node — `server/engine.js`) và trên trình duyệt (để kiểm tra dữ liệu ngay khi nhập). Máy chủ là nơi quyết định cuối cùng.
- **Thư viện npm duy nhất: `mysql2`** (kết nối MySQL, pool, truy vấn tham số hóa chống SQL injection).

## Cơ sở dữ liệu

- **MySQL 8.0**, mã hóa `utf8mb4` (tiếng Việt đầy đủ), InnoDB, thời gian lưu `DATETIME(3)` theo UTC.
- 24 bảng (kể cả bảng phụ nhật ký đồng bộ): khu vực, lĩnh vực, cấp bậc, chuyên môn, nhân sự, khách hàng, dự án, chi tiết dự án (vị trí), phân công, kênh đăng tuyển, tin đăng, ứng viên, hồ sơ ứng tuyển, lịch sử trạng thái, đề cử, góp ý đề cử, lịch phỏng vấn, kết quả phỏng vấn, feedback, kết quả tuyển dụng, yêu cầu hỗ trợ, lần gửi khách hàng, quy tắc xếp lịch.
- Trên máy: instance MySQL riêng của dự án (cổng 3307) do `scripts/mysql.js` quản lý. Tài khoản ứng dụng chỉ có quyền SELECT/INSERT/UPDATE/DELETE.

## Giao diện (front-end)

- **JavaScript thuần (Vanilla JS)** — không React/Vue/Angular, không bước build. Ứng dụng một trang (SPA) với bộ định tuyến theo `#/đường-dẫn`.
- Tự viết các thành phần: hộp thoại, ngăn kéo, bảng có phân trang, ô gợi ý (typeahead), thông báo, biểu đồ cột / phễu bằng **SVG**, bộ biểu tượng SVG nội tuyến.
- Font **Inter** (Google Fonts). Logo Navigos Group dạng PNG.
- Xuất **Excel .xlsx** bằng bộ tạo tệp Office Open XML tự viết (nén ZIP, CRC-32) — không cần thư viện; xuất **CSV** cho Google Sheets; xuất **PDF** qua chức năng in của trình duyệt với mẫu in riêng.

## Triển khai & công cụ

- **Docker**: một container gồm MySQL 8.0 (ảnh chính thức) + Node.js 20 (`Dockerfile`, `docker/start.sh`, `docker/init-db.js`), múi giờ `Asia/Ho_Chi_Minh`.
- **Render** (render.com) — Blueprint `render.yaml`, tự deploy khi đẩy mã lên nhánh `main` của GitHub. Địa chỉ: https://navigos-talent-suite.onrender.com
- **Git / GitHub** — quản lý mã nguồn.
- **Kiểm thử**: `npm test` (kiểm tra nhanh API + MySQL) và các kịch bản kiểm thử nghiệp vụ chạy trực tiếp tầng nghiệp vụ trên Node.
