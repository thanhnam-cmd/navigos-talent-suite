# Test demo lần 2: phân tích nhận xét và cách xử lý

Nguồn: file `Test demo_l2.pdf` gồm 4 trang, 7 ảnh chụp màn hình có khoanh đỏ và ghi chú.

## Danh sách yêu cầu

| # | Màn hình | Nhận xét của khách hàng | Phân tích | Cách xử lý |
|---|---|---|---|---|
| 1 | Dự án tuyển dụng (BGĐ) | "Thêm Tổng dự án chỗ nì, thêm STT dự án" | Hàng ô số liệu chỉ có *Tổng vị trí*, nên không thấy được số **dự án** (một dự án gồm nhiều vị trí). Bảng tab "Dự án tuyển dụng" chưa có cột STT. | Thêm ô **Tổng dự án** ở đầu hàng (5 ô). Bấm vào ô này sẽ mở tab Dự án tuyển dụng. Bảng dự án có cột **STT**. Bỏ dấu "·" thừa khi dự án không có ghi chú. |
| 2 | Báo cáo - Thống kê | "Sai logo công ty, chỗ màn hình hiển thị này vẫn là cột bảng, lúc xuất pdf mới ra bản báo cáo như này" | Bản trước hiển thị luôn mẫu báo cáo chính thức trên màn hình, và dùng chữ "N" thay cho logo. Khách hàng muốn màn hình vẫn là ô số liệu và bảng như các trang khác, mẫu chính thức chỉ có khi xuất PDF. | Màn hình: ô KPI và bảng dữ liệu (STT, dòng Tổng cộng, trạng thái dạng nhãn màu), kèm biểu đồ. **Xuất PDF**: in bản theo mẫu (tiêu đề công ty, mã báo cáo, kỳ, phần I và II, ghi chú, chữ ký) với **logo Navigos Group thật**. Bản này ẩn trên màn hình và chỉ xuất hiện khi in. |
| 3 | Quy tắc xếp lịch PV | "Bỏ quy tắc xếp lịch này ở Quản lý với QTV" | Màn hình cấu hình quy tắc không cần cho người dùng. | Bỏ menu, đường dẫn `#/quy-tac-lich` và hàm `saveScheduleRules` (API cũng không gọi được nữa). Hệ thống vẫn dùng các mức đã lưu (nghỉ 30′, di chuyển 90′, 08:00–18:00, cảnh báo cuối tuần, tối đa 4 buổi/ngày) để kiểm tra trùng lịch và cảnh báo khi lên lịch. |
| 4 | Chi tiết ứng viên | "BỎ dòng nì" (khung xanh "Ứng viên đã nhận việc…") | Thông tin thừa, vì trạng thái "Đang thử việc" đã có nhãn ngay dưới tên. | Bỏ khung thông báo. |
| 5 | Hộp thoại lịch phỏng vấn | "Bỏ chỗ này" (khung xanh hướng dẫn đầu form) | Hướng dẫn dài làm rối form. | Bỏ khung hướng dẫn. Thông tin vị trí đã có ở tiêu đề hộp thoại. |
| 6 | Thêm lịch phỏng vấn | "Đang chỉ cho lên lịch với những người chưa có lịch pv và trạng thái là KH đồng ý pv, nhưng nếu KH yêu cầu thêm 1 buổi phỏng vấn với những người đã [có lịch / đã phỏng vấn] thì sao?" | Quy tắc cũ chặn hồ sơ đang có lịch chưa diễn ra và hồ sơ đã **Đạt**. Thực tế khách hàng có thể muốn gặp ứng viên thêm (ví dụ để lãnh đạo phỏng vấn) trước khi gửi offer. | Xem phần **Phỏng vấn bổ sung** bên dưới. |
| 7 | Đăng nhập | "Design lại chỗ này, Navigos Group chứ ko phải Search" | Bên trái chỉ thấy biểu tượng, chữ NAVIGOS bị chìm trên nền tối. Nội dung ghi "Navigos Search", và các nhãn quy trình nằm rời rạc. | Thiết kế lại: **logo Navigos Group bản trắng**, dòng "Navigos Group Việt Nam · Talent Suite", tiêu đề ngắn, đoạn giới thiệu nói về Navigos Group, và 4 bước quy trình xếp thành lưới có số thứ tự và biểu tượng. Chân trang đổi thành "(Navigos Group)". Mô tả tài khoản demo Ban Giám đốc sửa đúng quyền: "Xem, góp ý đề cử, báo cáo". |

## Phỏng vấn bổ sung theo yêu cầu khách hàng (yêu cầu 6)

**Hồ sơ hiện trong "Thêm lịch mới":**
- Hồ sơ **Đề cử** mà khách hàng đã đồng ý phỏng vấn (vòng 1).
- Hồ sơ **Phỏng vấn** chưa có kết quả tuyển dụng, gồm cả:
  - ứng viên **đã có lịch** chưa diễn ra hoặc chưa ghi kết quả;
  - ứng viên **đã Đạt** đang chờ khách hàng quyết định.
- Mỗi hồ sơ có nhãn tình trạng: "KH đồng ý phỏng vấn", "Cần phỏng vấn thêm" hoặc "Phỏng vấn bổ sung · đã Đạt vòng 1".

**Khi là buổi bổ sung:**
- Hộp thoại báo đây là vòng thứ mấy.
- Bắt buộc nhập **"Yêu cầu phỏng vấn bổ sung của khách hàng"**, lưu ở cột mới `LICH_PHONG_VAN.ghi_chu`.
- Lịch sử hồ sơ ghi "Lên lịch phỏng vấn bổ sung vòng N theo yêu cầu khách hàng".

**Quy tắc vẫn giữ:**
- Không trùng lịch nhân viên phỏng vấn.
- Cảnh báo về khoảng nghỉ, thời gian di chuyển, ngoài giờ, cuối tuần và số buổi tối đa.
- Không lên lịch cho hồ sơ đã có kết quả tuyển dụng.

**Nhất quán dữ liệu:** nếu một vòng trước được ghi **Không đạt**, hồ sơ chuyển "Bị loại". Các buổi bổ sung còn chờ của hồ sơ đó **tự hủy**, kèm lý do.

## Thay đổi kỹ thuật

- `public/js/pages-core.js`:
  - ô Tổng dự án và hàm `visibleDas()`;
  - STT cho bảng dự án;
  - màn hình đăng nhập mới.
- `public/js/pages-manage.js`:
  - báo cáo tách bản hiển thị màn hình và bản in (`print-only`);
  - bỏ trang Quy tắc xếp lịch;
  - danh sách lên lịch dùng `Q.canSchedule`.
- `public/js/services.js`:
  - thêm `Q.canSchedule`, `Q.extraRoundReason`, `Q.scheduleLabel`;
  - `saveInterview` cho phép buổi bổ sung và lưu `ghi_chu`;
  - ghi "Không đạt" thì tự hủy các buổi còn chờ;
  - bỏ `saveScheduleRules`.
- `public/js/dialogs.js`: bỏ khung hướng dẫn, thêm ô yêu cầu của khách hàng cho buổi bổ sung.
- `public/js/pages-candidates.js`: bỏ khung "đã nhận việc".
- `public/js/app.js`, `public/js/core.js`: bỏ đường dẫn và menu Quy tắc xếp lịch.
- `server/server.js`: bỏ quyền `saveScheduleRules`.
- `server/repository.js`, `database/schema.sql`: migration thêm cột `LICH_PHONG_VAN.ghi_chu`. Migration tự chạy khi máy chủ khởi động và không mất dữ liệu cũ.
- `public/css/app.css`:
  - lưới `.g-5`;
  - giao diện phần giới thiệu ở trang đăng nhập;
  - logo ảnh trong báo cáo;
  - dòng Tổng cộng trên màn hình.
- `public/index.html`: đổi phiên bản tài nguyên lên `?v=12` để trình duyệt tải bản mới.

## Kiểm thử

| Bộ kiểm thử | Kết quả |
|---|---|
| Phỏng vấn bổ sung (engine) | 12/12 |
| Quy tắc lên lịch BR10 (engine) | 15/15 |
| Fix Demo lần 1 (engine) | 16/16 |
| API phân quyền Fix Demo lần 1 | 10/10 |
| API Test demo lần 2 (quy tắc bị chặn với mọi vai trò, cột `ghi_chu`, bản v=12, trang đăng nhập) | 7/7 |
| Kiểm tra nhanh toàn hệ thống (smoke test) | 9/9 |

Đã xem trên trình duyệt:
- Trang đăng nhập.
- Dự án tuyển dụng với tài khoản BGĐ.
- Báo cáo: bản màn hình và bản in giả lập.
- Hồ sơ ứng viên và menu với tài khoản Quản lý.
- Thêm lịch phỏng vấn bổ sung với tài khoản Nhân viên.
