# Navigos Talent Suite

Ứng dụng web quản lý dự án tuyển dụng tại Công ty Cổ phần Navigos Group Việt Nam (Khóa luận tốt nghiệp — Dương Kim Chi).

**Công nghệ:** Node.js 18+ (máy chủ HTTP/API, không framework) · **MySQL 8.0** (driver `mysql2`) · HTML/CSS/JavaScript (giao diện responsive).

## Chạy

Nhấp đúp **`start.cmd`** → trình duyệt mở http://localhost:8080. Dừng bằng **`stop.cmd`**.

Hoặc dùng lệnh:

```bash
npm install
npm run setup
npm start
```

`npm run setup` (chỉ cần lần đầu) sẽ: tạo `.env` với mật khẩu CSDL ngẫu nhiên → khởi tạo một **instance MySQL 8 riêng của dự án** (dữ liệu trong `database/mysql-data`, cổng **3307**, dùng bản MySQL Server 8.0 đã cài trên máy, không đụng tới dịch vụ MySQL80 cổng 3306) → tạo CSDL `navigos_talent`, tài khoản ứng dụng `navigos_app` (chỉ quyền SELECT/INSERT/UPDATE/DELETE) và nạp `database/schema.sql`.
Lần khởi động đầu, máy chủ tự sinh dữ liệu mẫu bằng chính quy trình nghiệp vụ và ghi vào MySQL.

**Tài khoản demo** (mật khẩu `123456`): `admin` · `giamdoc` · `quanly` · `nhanvien` · `thuha` · `hoangphuc` · `thanhtam` · `giabao`.

### Dùng máy chủ MySQL có sẵn thay cho instance riêng

Trong `.env` đặt `MYSQL_MANAGED=false`, `DB_PORT=3306`, `DB_USER` / `DB_PASSWORD` của bạn; tạo CSDL rồi chạy `database/schema.sql`:

```bash
mysql -u root -p -e "CREATE DATABASE navigos_talent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

```bash
mysql -u root -p navigos_talent < database/schema.sql
```

## Deploy (GitHub + Render)

Deploy lên Render bằng Docker: MySQL 8 và Node.js chạy chung một dịch vụ (`Dockerfile`, `docker/start.sh`, `render.yaml`) — không cần dịch vụ CSDL bên ngoài. Lần khởi động đầu máy chủ tự tạo bảng và nạp dữ liệu mẫu. Xem hướng dẫn từng bước: [docs/DEPLOY.md](docs/DEPLOY.md).

## Lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy máy chủ web (tự bật MySQL của dự án nếu chưa chạy) |
| `npm run setup` | Khởi tạo MySQL + CSDL (lần đầu) |
| `npm run db:start` / `db:stop` / `db:status` | Bật / tắt / kiểm tra MySQL của dự án |
| `npm run db:reset` | Xóa & tạo lại CSDL — dữ liệu mẫu được nạp lại khi `npm start` |
| `npm test` | Kiểm thử API + đối chiếu MySQL (máy chủ phải đang chạy). Thêm `-- --scenario` để chạy kịch bản demo |

## Cấu trúc

```
LDCoffe/
├─ start.cmd / stop.cmd      Chạy / dừng một chạm (Windows)
├─ package.json  .env  .env.example  .gitignore
├─ server/
│  ├─ server.js              Máy chủ HTTP + API (phiên đăng nhập, phân quyền, tệp tĩnh)
│  ├─ engine.js              Nạp tầng nghiệp vụ dùng chung để thực thi trên máy chủ
│  ├─ repository.js          Ánh xạ 19 bảng MySQL, ghi thay đổi theo giao dịch
│  └─ env.js                 Đọc cấu hình .env
├─ public/                   Giao diện (index.html, css/, js/, assets/)
│  └─ js/services.js         TẦNG NGHIỆP VỤ — toàn bộ quy tắc BR (chạy trên máy chủ)
├─ database/
│  ├─ schema.sql             Lược đồ MySQL: 19 bảng + nhật ký đồng bộ + 4 VIEW báo cáo
│  └─ mysql-data/            Dữ liệu MySQL của dự án (tự tạo)
├─ scripts/
│  ├─ mysql.js               Quản lý instance MySQL (setup/start/stop/status/reset)
│  └─ smoke-test.js          Kiểm thử API + MySQL
├─ docs/NGHIEP_VU.md         Nghiệp vụ, vòng đời ứng viên, kịch bản demo
└─ docs/FIX_DEMO_LAN1.md     Phân tích nhận xét khách hàng (Fix Demo lần 1) và cách xử lý
```

## Kiến trúc

Trình duyệt → `POST /api/rpc` → máy chủ Node.js thực thi hàm nghiệp vụ (`services.js`) với người dùng của phiên → ghi mọi thay đổi xuống MySQL **trong một transaction** (lỗi thì rollback và nạp lại từ CSDL) → trả kết quả + dữ liệu mới cho giao diện. Mật khẩu chỉ lưu dạng mã hóa trong MySQL và không bao giờ gửi xuống trình duyệt; phiên đăng nhập dùng cookie HttpOnly; Quản trị viên / nghiệp vụ được kiểm tra quyền ở máy chủ.

Mã nguồn quy tắc nghiệp vụ là **một bộ duy nhất** dùng chung cho máy chủ và giao diện, nên mọi quy tắc trong Chương 3 và góp ý của giảng viên được bảo đảm ở phía máy chủ.
