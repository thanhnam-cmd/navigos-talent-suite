# Triển khai lên VPS aaPanel — https://navigosproject.vnc360.com

| Thành phần | Giá trị |
|---|---|
| Máy chủ | 14.225.220.49 (Ubuntu 24.04, aaPanel) |
| Thư mục dự án | `/www/wwwroot/navigosproject` |
| Ứng dụng | Node.js, chạy bằng PM2 tên `navigos-talent`, nghe `127.0.0.1:3080`; PM2 tự chạy lại khi máy chủ khởi động lại (`pm2-root`) |
| CSDL | MariaDB của aaPanel: CSDL `navigos_talent`, tài khoản `navigos_app` (chỉ có quyền trên CSDL này, chỉ kết nối nội bộ) |
| Cấu hình | `/www/wwwroot/navigosproject/.env` (chỉ root đọc được): cổng, `HOST=127.0.0.1`, thông tin CSDL, `NTS_ACCOUNTS` và `NTS_RECOVERY` |
| Nginx | `/www/server/panel/vhost/nginx/navigosproject.vnc360.com.conf`: chuyển http sang https, reverse proxy tới `127.0.0.1:3080` |
| HTTPS | Let's Encrypt (certbot, webroot `/www/wwwroot/navigosproject/acme`), tự gia hạn |
| Nhật ký | `pm2 logs navigos-talent`, `/www/wwwlogs/navigosproject.vnc360.com.log` |

## Cập nhật phiên bản mới

1. Chép mã nguồn mới đè lên `/www/wwwroot/navigosproject`, **giữ nguyên `.env`**.
2. Chạy `bash /www/wwwroot/navigosproject/deploy/setup-server.sh`. Script cài thư viện và khởi động lại ứng dụng; dữ liệu giữ nguyên, migration tự chạy khi khởi động.

## Lần cài đầu tiên

Lần đầu, khi CSDL còn trống, `deploy/setup-server.sh` làm thêm hai việc:
- tạo bảng từ `database/schema.sql`;
- nạp dữ liệu từ `deploy/navigos_talent.sql`, là dữ liệu xuất từ MySQL trên máy phát triển.

Bản dữ liệu này đã được chỉnh cho MariaDB: tên bảng viết hoa, collation `utf8mb4_unicode_ci`. Tệp `.sql` và `.env` không được đưa lên Git.

## Lệnh hay dùng

```bash
pm2 status navigos-talent
pm2 restart navigos-talent --update-env
pm2 logs navigos-talent --lines 50
```
