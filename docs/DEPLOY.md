# Deploy lên Render + MySQL cloud

Render chạy web Node.js; **Render không cung cấp MySQL được quản lý**, nên CSDL MySQL 8 đặt ở một dịch vụ cloud. Hướng dẫn dưới đây dùng **Aiven for MySQL** (gói Free, MySQL 8 thật, bắt buộc SSL). Bất kỳ MySQL 8 nào truy cập được từ Internet cũng dùng được qua `DATABASE_URL`.

## 1. Tạo MySQL trên Aiven

1. Đăng ký tại https://console.aiven.io → **Create service** → **MySQL** → gói **Free**, vùng gần Singapore.
2. Khi dịch vụ ở trạng thái *Running*, mở tab **Overview** → **Connection information**, sao chép **Service URI** dạng:
   `mysql://avnadmin:MẬT_KHẨU@mysql-xxxx.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED`
3. (Tùy chọn, an toàn hơn) Tải **CA certificate** — dán nội dung vào biến `DB_SSL_CA` ở bước 2.

Không cần chạy SQL thủ công: lần khởi động đầu, máy chủ tự tạo bảng từ `database/schema.sql` và nạp dữ liệu mẫu.

## 2. Tạo dịch vụ trên Render

1. Đăng nhập https://dashboard.render.com bằng GitHub.
2. **New → Blueprint** → chọn repository này → Render đọc `render.yaml`.
3. Nhập biến **`DATABASE_URL`** = Service URI ở bước 1 (và `DB_SSL_CA` nếu có) → **Apply**.
4. Chờ build xong, mở địa chỉ `https://navigos-talent-suite.onrender.com` (tên có thể khác).

Mỗi lần `git push` lên nhánh chính, Render tự deploy lại (`autoDeploy: true`).

## Ghi chú

- Gói Free của Render **ngủ sau ~15 phút không truy cập**; lần mở đầu tiên mất 30–60 giây để khởi động.
- Phiên đăng nhập lưu trong bộ nhớ máy chủ → sau khi dịch vụ ngủ/khởi động lại cần đăng nhập lại. Dữ liệu vẫn nằm an toàn trong MySQL.
- `DEMO_MODE=true` bật nút chuyển nhanh tài khoản & khôi phục dữ liệu mẫu. Khi dùng thật, đặt `DEMO_MODE=false` và đổi mật khẩu các tài khoản demo.
- Kiểm tra bản đã deploy từ máy:

```bash
SMOKE_URL=https://navigos-talent-suite.onrender.com npm test
```
