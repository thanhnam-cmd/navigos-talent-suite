# Fix demo 3 (2): phân tích nhận xét và cách xử lý

Nguồn: tệp `Fix demo 3 (2).pdf` (9 trang, ảnh chụp màn hình có khoanh đỏ và ghi chú), kèm yêu cầu bỏ đăng nhập nhanh bằng tài khoản demo.

## Danh sách yêu cầu

| # | Trang | Nhận xét của khách hàng | Phân tích | Cách xử lý |
|---|---|---|---|---|
| 1 | 1 | Phân công nhân sự: khoanh hai khung giải thích Phụ trách / Hỗ trợ | Thông tin thừa trong hộp thoại thao tác | Bỏ hai khung giải thích. Ô chọn vai trò từng người giữ nguyên. |
| 2 | 1 | Danh sách ứng viên: khoanh khung "Chế độ đề cử…" | Chú thích dài, đẩy bảng xuống | Bỏ khung. Nhãn "Chưa apply" trong bảng vẫn giữ. |
| 3 | 2 | "Xóa những chỗ nà": dòng "Đề cử chuyển 'Đã gửi khách hàng'…" và khung chú thích ở form Tạo đề cử | Chú thích thừa | Bỏ cả hai. |
| 4 | 3 | "Độ phù hợp này công thức tính ntn?" | Cách tính điểm đang ẩn trong code; điểm kỹ năng chỉ có hoặc không | Thêm nút ⓘ cạnh tiêu đề cột để xem công thức. Bấm vào % của một ứng viên để xem điểm từng tiêu chí: Chuyên môn 30 · Cấp bậc 25 (lệch 1 bậc: 12) · Khu vực 20 · Lĩnh vực 15 · Kỹ năng 10 (khớp ≥ 2: 10, khớp 1: 5). |
| 5 | 3 | "Đổi kiểu set time, ntn khó thao tác" | Ô giờ của trình duyệt dùng SA/CH, phải bấm từng cột | Đổi thành danh sách giờ 24h, bước 15 phút (07:00–21:00), chọn một lần bấm. Đổi giờ bắt đầu thì giờ kết thúc tự dời theo, giữ nguyên thời lượng. |
| 6 | 4–5 | "Chỉnh danh sách in sang demo như ảnh dưới" | Bản in cũ đơn giản, có ngày giờ/URL `about:blank` của trình duyệt | In theo mẫu khách hàng (xem bên dưới). Chân trang: "Navigos Talent Suite · Danh sách đề cử ứng viên" và "Trang x/y". Trình duyệt không chèn ngày giờ, URL. |
| 7 | 5 | Phan Minh Ngân có lịch 12:00–12:45, vẫn lưu được lịch 12:25–13:10 ở vị trí khác. "Set đk buổi trước phải cách buổi sau 1h" | Hệ thống chỉ kiểm tra trùng lịch **nhân viên phỏng vấn**, chưa kiểm tra lịch của **ứng viên** trên mọi vị trí | Thêm kiểm tra lịch ứng viên trên mọi hồ sơ, mọi vị trí. Giờ kết thúc buổi trước phải cách giờ bắt đầu buổi sau **ít nhất 60 phút**; không đạt thì không lưu, kiểm tra cả trên form lẫn máy chủ. Khoảng nghỉ tối thiểu giữa hai buổi của nhân viên phỏng vấn cũng nâng lên 60 phút (cảnh báo). |
| 8 | 6 | Form Xác nhận gửi đề cử cho khách hàng: "Sửa form này thành ntn" | Form cũ chỉ liệt kê tên ứng viên trong một dòng | Làm lại theo mẫu (xem bên dưới). |
| 9 | 7 | Menu tài khoản: "Đổi thành Cài đặt" | Mục "Cài đặt & dữ liệu demo" và danh sách chuyển nhanh tài khoản demo | Menu chỉ còn **Cài đặt** và **Đăng xuất**. Bỏ chức năng chuyển nhanh tài khoản (gỡ cả API `/api/switch` trên máy chủ). |
| 10 | 7 | Báo cáo: "Bộ lọc time này tính mốc ntn? Đổi timeline không thấy thay đổi gì" | Báo cáo tiến độ, trễ hạn, theo khách hàng **không dùng** Từ ngày / Đến ngày | Áp dụng kỳ báo cáo cho mọi loại báo cáo. Dưới bộ lọc có một dòng ghi rõ cách tính (xem bên dưới). |
| 11 | 8 | Báo cáo: ô Khách hàng mở ra toàn dòng trống ("Lỗi hiển thị") | Hàm tạo danh sách lấy trường `ten`; bảng khách hàng dùng `ten_cong_ty` | Sửa hàm dùng chung. Lỗi giống vậy ở bộ lọc Dự án tuyển dụng cũng được sửa. |
| 12 | 8 | "Tên báo cáo là tiến độ dự án nhưng danh sách chỉ có vị trí, cả với báo cáo dự án trễ hạn" | Bảng liệt kê theo vị trí | Hai báo cáo này tổng hợp **theo dự án**. Bấm vào dòng dự án để mở các vị trí bên trong, như ảnh mẫu. Thêm ô KPI "Số dự án". Bản in và Excel có cả dòng dự án và dòng vị trí. |
| 13 | 9 | Trịnh Minh Đạt có lịch 6/11 chưa diễn ra mà vẫn được chọn để lên lịch | Bản trước cho thêm buổi khi còn buổi đang chờ | Chỉ khi buổi trước **đã kết thúc và đã ghi nhận kết quả** mới được chọn để lên lịch tiếp: "Cần phỏng vấn thêm" là vòng sau; "Đạt" là buổi bổ sung, bắt buộc ghi yêu cầu khách hàng. Máy chủ cũng chặn. |
| 14 | 9 | Nhân viên phỏng vấn ở TP.HCM, địa điểm ở Hà Nội vẫn lưu được | Không có thông tin khu vực của địa điểm phỏng vấn | Xem phần "Khu vực địa điểm phỏng vấn" bên dưới. |
| 15 | — | Bỏ đăng nhập nhanh, dùng mật khẩu thật | Trang đăng nhập có nút tài khoản demo và mật khẩu chung `123456` | Bỏ các nút và dòng "MẬT KHẨU 123456". Mỗi tài khoản có mật khẩu riêng (xem phần "Đăng nhập" bên dưới). |

### Mẫu in danh sách đề cử (yêu cầu 6)

- Đầu trang: "NAVIGOS GROUP VIỆT NAM / Talent Suite — Nghiệp vụ tuyển dụng"; ngày in và người in.
- Tiêu đề căn giữa, dòng **Vị trí | Khách hàng**.
- Bảng có hàng tiêu đề màu xanh đậm.
- Dòng tổng hợp, ngày lập, chữ ký "Người lập danh sách" và "Quản lý xác nhận".
- In danh sách gồm nhiều vị trí (từ báo cáo hiệu suất): có thêm cột Vị trí / Khách hàng.

### Form gửi đề cử cho khách hàng (yêu cầu 8)

- **Thẻ khách hàng:** tên công ty, nhãn vị trí kèm ID, người liên hệ, email, địa chỉ, điện thoại.
- **Ứng viên gửi:** mỗi ứng viên một dòng, kèm tệp CV trong hồ sơ và nút **Xem**.
- **Tệp đính kèm** (chọn ít nhất một loại):
  - *CV của từng ứng viên*;
  - *File danh sách đề cử*, chọn **Excel (.xlsx)** hoặc **Google Sheet** (tệp .csv nhập thẳng vào Google Sheets). Có tên tệp và nút **Xem trước**.
- **Lời nhắn gửi khách hàng:** tùy chọn.
- **Khi xác nhận:** đề cử chuyển "Đã gửi khách hàng". Lần gửi được lưu vào bảng mới `GUI_KHACH_HANG`, gồm tệp đính kèm, lời nhắn và các đề cử. Tệp danh sách được tạo ngay để nhân viên đính kèm khi gửi email.
- **Xuất Excel trên toàn hệ thống** nay ra tệp **.xlsx** thật thay cho .xls dạng HTML, nên Excel không còn báo lỗi định dạng khi mở.

### Kỳ báo cáo (yêu cầu 10)

| Báo cáo | Cách áp dụng Từ ngày – Đến ngày |
|---|---|
| Tiến độ dự án | Lấy vị trí có thời gian tuyển dụng (ngày tiếp nhận → hạn hoàn thành) nằm trong kỳ. Nhận việc và tiến độ tính lũy kế đến ngày cuối kỳ. Đề cử, phỏng vấn tính số phát sinh trong kỳ. |
| Dự án trễ hạn | Tính đến ngày cuối kỳ (không quá hôm nay): vị trí đã qua hạn mà chưa tuyển đủ, không gồm vị trí Đã đóng / Đã hủy. |
| Dự án theo khách hàng | Lấy vị trí có thời gian tuyển dụng nằm trong kỳ. |
| Kết quả tuyển dụng | Theo ngày khách hàng báo kết quả. |
| Tỷ lệ chuyển đổi | Theo ngày hồ sơ apply. |
| Hiệu suất đề cử | Đề cử theo ngày tạo, phỏng vấn theo ngày diễn ra. |

### Khu vực địa điểm phỏng vấn (yêu cầu 14)

- **Trường mới:** form lịch có trường **Khu vực địa điểm phỏng vấn**, lưu ở cột mới `LICH_PHONG_VAN.ma_khu_vuc`.
  - Giá trị mặc định là khu vực trong địa chỉ khách hàng.
  - Khi gõ địa chỉ có tên tỉnh/thành ("… — Hà Nội", "Quận 7, TP. HCM"), hệ thống tự chọn khu vực tương ứng.
  - Trường này chỉ áp dụng cho phỏng vấn trực tiếp; phỏng vấn trực tuyến không bị ràng buộc.
- **Ràng buộc với nhân viên phỏng vấn:** phỏng vấn trực tiếp chỉ được chọn nhân viên **cùng khu vực** với địa điểm. Chọn người khác khu vực thì form báo lỗi đỏ.
  - Form gợi ý người của vị trí cùng khu vực đang rảnh.
  - Không có ai thì có nút "Báo Quản lý phân công thêm người hỗ trợ".
- **Khu vực ghi trong địa chỉ khác khu vực đã chọn:** không lưu được.

### Đăng nhập (yêu cầu 15)

- Mỗi tài khoản có mật khẩu ngẫu nhiên riêng, 12 ký tự. Mã băm SHA-256 lưu ở `server/accounts.js`.
- **CSDL đang chạy:** migration thay mật khẩu `123456` cũ bằng mật khẩu mới. Tài khoản nào người dùng đã tự đổi mật khẩu thì giữ nguyên.
- **Dữ liệu mẫu khởi tạo lại:** dùng đúng các mật khẩu này.
- **Sai 5 lần liên tiếp:** tạm khóa đăng nhập 5 phút.
- **Khôi phục dữ liệu mẫu:** chỉ Quản trị viên được làm.
- **Danh sách mật khẩu:** nằm ở tệp `TAI_KHOAN_DANG_NHAP.md` trên máy chủ dự án, đã đưa vào `.gitignore`.

## Thay đổi kỹ thuật

- **`database/schema.sql`, `server/repository.js`** (migration 8, tự chạy khi khởi động, giữ dữ liệu cũ):
  - cột `LICH_PHONG_VAN.ma_khu_vuc`;
  - bảng `GUI_KHACH_HANG`;
  - khoảng nghỉ mặc định 60 phút;
  - thay mật khẩu demo.
- **`public/js/services.js`:**
  - `Q.pendingIv`, `Q.candidateCheck`, `Q.regionInText`, `Q.regionMismatch`, `Q.fitDetail`;
  - `saveInterview` thêm 3 kiểm tra mới: buổi đang chờ, lịch ứng viên, khu vực;
  - `sendToClient` lưu tệp đính kèm;
  - `Reports.progress` / `overdue` / `byProject` theo kỳ và theo dự án;
  - menu tài khoản.
- **`public/js/dialogs.js`:**
  - form lịch phỏng vấn (giờ 24h, khu vực);
  - form gửi khách hàng;
  - xem CV, xem trước danh sách;
  - mẫu in danh sách đề cử;
  - bỏ khung giải thích ở Phân công.
- **`public/js/pages-manage.js`:** báo cáo theo dự án có dòng mở rộng, dòng cách tính kỳ báo cáo, bản in khổ A4 gọn hơn.
- **`public/js/pages-candidates.js`:** cách tính độ phù hợp, bỏ các khung chú thích.
- **`public/js/pages-core.js`:** trang đăng nhập không còn tài khoản demo, có nút hiện/ẩn mật khẩu.
- **`public/js/core.js`:**
  - `Xlsx` (tạo tệp .xlsx không cần thư viện);
  - `Export.csv`;
  - sửa `Form.opts`;
  - bỏ `Auth.switchTo`.
- **`server/server.js`:** bỏ `/api/switch`, khóa đăng nhập sau 5 lần sai, khôi phục dữ liệu chỉ dành cho Quản trị viên, gán mật khẩu khi sinh dữ liệu mẫu.
- **`public/index.html`:** tài nguyên `?v=14`.

## Kiểm thử

| Bộ kiểm thử | Kết quả |
|---|---|
| Fix demo 3 (2) — engine: lịch ứng viên 60′, chỉ lên lịch khi buổi trước có kết quả, khu vực, độ phù hợp, gửi khách hàng, báo cáo theo kỳ / theo dự án | 25/25 |
| Fix demo 3 — vai trò Phụ trách / Hỗ trợ (đã chỉnh theo luật mới) | 27/27 |
| Fix Demo lần 1 — engine | 16/16 |
| API phân quyền | 10/10 |
| Kiểm tra nhanh toàn hệ thống (`npm test`) | 9/9 |
| Tệp .xlsx tạo ra mở được bằng thư viện đọc Excel (openpyxl) | Đạt |
| In PDF thật bằng Chrome (danh sách đề cử, báo cáo tiến độ): không còn ngày giờ, URL; số trang đúng | Đạt |

## Bổ sung: mật khẩu dễ nhớ, quên mật khẩu, liên hệ Quản trị viên

| Yêu cầu | Cách xử lý |
|---|---|
| Mật khẩu dễ nhớ, dễ dùng | Mỗi tài khoản có mật khẩu dạng **Tên@4 số**: tên người dùng không dấu, viết hoa chữ đầu, cộng 4 chữ số riêng. Mật khẩu do Quản trị viên đặt lại cũng dễ nhớ: một từ tiếng Việt không dấu + @ + 4 số, ví dụ `Hoasen@4827`. Migration 9 chỉ thay mật khẩu của tài khoản chưa tự đổi. |
| Nút **Quên mật khẩu?** bấm được | Trang đăng nhập có nút thay cho dòng chữ. Người dùng nhập tên đăng nhập hoặc email, số liên hệ và ghi chú; yêu cầu được lưu vào bảng mới `YEU_CAU_MAT_KHAU`. Thông báo trả về luôn giống nhau, không cho biết tài khoản có tồn tại hay không. Mỗi địa chỉ IP gửi tối đa 5 yêu cầu trong 5 phút. |
| Nút **Liên hệ Quản trị viên** bấm được | Hiện danh sách Quản trị viên với email (`mailto:`) và số điện thoại (`tel:`) bấm được, kèm nút gửi yêu cầu cấp lại mật khẩu. |
| Quản trị viên xử lý | Yêu cầu hiện ở 4 nơi: chuông thông báo, số đếm trên menu **Tài khoản & phân quyền**, Trang chủ và đầu trang **Tài khoản**. Bấm **Đặt lại MK** thì mật khẩu mới hiện một lần và yêu cầu tự chuyển "Đã cấp lại". Bấm **Đóng** để bỏ yêu cầu không hợp lệ. Chỉ trình duyệt của Quản trị viên nhận được bảng yêu cầu. |
| Quản trị viên quên mật khẩu | Vào **Quên mật khẩu? → Tôi là Quản trị viên**, nhập tên đăng nhập, **mã khôi phục** và mật khẩu mới. Mã khôi phục giao riêng cho chủ dự án; máy chủ chỉ lưu mã băm. Nhập sai mã 5 lần thì bị khóa 5 phút. Mã không dùng được cho tài khoản không phải Quản trị viên. |

Kiểm thử: API mật khẩu (mật khẩu dễ nhớ, quên mật khẩu, liên hệ, đặt lại, khôi phục Quản trị viên, phân quyền) đạt 24/24; `npm test` đạt 9/9.

## Fix demo 3 (4)

| # | Nhận xét | Cách xử lý |
|---|---|---|
| 1 | Sau khi bấm gửi khách hàng không được tự tải tệp xuống; form chỉ để gửi | Bỏ việc tạo và tải tệp danh sách khi bấm **Xác nhận gửi**. Bấm gửi chỉ chuyển đề cử sang "Đã gửi khách hàng", lưu lần gửi (tệp đính kèm đã chọn, lời nhắn) rồi đóng form. Trong form vẫn có **Xem** CV và **Xem trước** danh sách. |
| 2 | Các nút thao tác (kể cả ở màn khác) đổi hết thành icon, di chuột vào hiện tooltip | Thêm hàm dùng chung `act()` tạo nút icon và một tooltip chung: nền tối, tên thao tác in đậm kèm dòng mô tả, ví dụ "Gửi khách hàng / Gửi đề cử này cho Bà Nguyễn Thu Trang". Tooltip đặt ở `<body>` nên không bị bảng cuộn che. Đã đổi **43 nút** ở các màn: danh sách đề cử, hồ sơ ứng tuyển, quản lý phỏng vấn, kết quả tuyển dụng, thu thập hồ sơ, tài khoản, danh mục, báo cáo, hộp thoại gắn mã tin. Màu nút theo loại thao tác: xanh dương là thao tác chính, xanh lá là duyệt / ghi nhận, viền đỏ là gỡ / hủy, còn lại là xem / sửa. |
| 3 | Chỗ "Độ phù hợp" lúc bị bôi vàng lúc không | Vệt vàng là đánh dấu của trình duyệt khi tìm hoặc chọn chữ trên trang. Nhãn cột nay hiển thị bằng CSS và tiêu đề bảng không bôi chọn được, nên không còn bị đánh dấu. Sửa thêm lỗi lệch cột: tiêu đề "STT" đang nằm trên cột ô chọn. |

Sửa thêm trong lúc rà soát: tab **Kết quả phỏng vấn** của trang Kết quả tuyển dụng bị lỗi tràn ngăn xếp, do một hàm cục bộ trùng tên `act`. Đã đổi tên hàm. Đã rà 121 màn hình và tab với 5 tài khoản (Nhân viên phụ trách, Nhân viên hỗ trợ, Quản lý, Ban Giám đốc, Quản trị viên): không còn lỗi hiển thị.
