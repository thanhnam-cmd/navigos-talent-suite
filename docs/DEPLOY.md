# Deploy lên Render (MySQL 8 chạy trong cùng dịch vụ)

Render không có MySQL được quản lý, nên dự án đóng gói **MySQL 8.0 + Node.js trong một container Docker** (`Dockerfile`, `docker/start.sh`). Không cần đăng ký dịch vụ CSDL nào khác.

Khi container khởi động: khởi tạo MySQL (chỉ nghe `127.0.0.1` bên trong container) → tạo CSDL `navigos_talent` và tài khoản ứng dụng → máy chủ Node.js tự tạo bảng từ `database/schema.sql` và nạp dữ liệu mẫu → mở web ở cổng Render cấp.

## Các bước

1. Đăng nhập https://dashboard.render.com bằng GitHub.
2. **New → Blueprint** → chọn repository `navigos-talent-suite` (lần đầu: cho phép Render truy cập repo).
3. Render đọc `render.yaml` → **Apply**. Mật khẩu MySQL (`DB_PASSWORD`, `DB_ROOT_PASSWORD`) được Render tự sinh.
4. Chờ build (lần đầu ~5–10 phút) → mở `https://navigos-talent-suite.onrender.com`.

Mỗi lần `git push` lên `main`, Render tự build & deploy lại.

## Lưu trữ dữ liệu

| Gói Render | Dữ liệu MySQL |
|---|---|
| **Free** (mặc định) | Không có ổ đĩa: dữ liệu được khởi tạo lại kèm dữ liệu mẫu mỗi khi dịch vụ khởi động (sau khi ngủ ~15 phút không truy cập, hoặc sau mỗi lần deploy). Phù hợp demo/bảo vệ. |
| **Starter + Disk** (trả phí) | Trong `render.yaml` đổi `plan: starter` và bỏ comment khối `disk` (gắn vào `/var/lib/mysql`) → dữ liệu giữ vĩnh viễn. |

## Dùng MySQL bên ngoài (tùy chọn)

Đặt biến `DATABASE_URL=mysql://USER:PASS@HOST:PORT/DB?ssl-mode=REQUIRED` (và `DB_SSL_CA` nếu có) — máy chủ sẽ dùng CSDL đó thay cho MySQL trong container.

## Kiểm tra bản đã deploy

```bash
SMOKE_URL=https://navigos-talent-suite.onrender.com npm test
```

(Bước đối chiếu trực tiếp trong MySQL chỉ chạy được khi máy bạn truy cập được CSDL.)
