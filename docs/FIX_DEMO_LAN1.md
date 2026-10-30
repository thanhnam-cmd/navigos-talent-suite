# Fix Demo lần 1 — Phân tích nhận xét khách hàng & cách xử lý

Nguồn: `Fix Demo_Lần 1.docx` (phần chữ + 37 ảnh chụp màn hình/ảnh mẫu).
Vai trò: **QTV** (Quản trị viên) · **NV** (Nhân viên) · **QL** (Quản lý) · **BGĐ** (Ban Giám đốc).

## 1. Ma trận phân quyền (ảnh 1) — áp dụng ở cả giao diện và API

| Chức năng | QTV | NV | QL | BGĐ | Cách thực thi |
|---|---|---|---|---|---|
| Đăng nhập, hồ sơ cá nhân, đổi mật khẩu | ✔ | ✔ | ✔ | ✔ | `Svc.changePassword` (trang Cài đặt) |
| Tài khoản, phân quyền, đặt lại MK, danh mục | ✔ | – | – | – | `ADMIN_FNS` ở `server/server.js` |
| Khách hàng | – | ✔ | Xem | Xem | Nút thêm/sửa/tạo dự án chỉ hiện cho NV; API mặc định `canOperate()` |
| Xem dự án | – | Tự tạo / được phân công | Tất cả | Tất cả | `Q.visibleCts()` |
| Tạo dự án / tiếp nhận yêu cầu | – | ✔ | – | – | Nút chỉ hiện cho NV |
| Sửa, gắn mã tin, đóng/hủy dự án | – | Chỉ dự án do mình tạo | – | – | `Q.isCreator(ct)` trong `savePosition/closePosition/attachPosting/removePosting` |
| Phân công | – | – | ✔ | – | `QL_FNS: assign` |
| Hồ sơ ứng viên, trạng thái | – | ✔ | Xem | Xem | Nút chuẩn hóa / gắn thẻ / lưu trữ chỉ cho NV |
| Tạo / gỡ đề cử | – | ✔ | Xem | Xem | |
| Duyệt / yêu cầu sửa đề cử | – | – | ✔ | – | `QL_FNS: approveRecommendation, requestEdit` |
| Góp ý đề cử đã xử lý | – | – | Nhận góp ý | Xem & góp ý | Bảng mới `GOP_Y_DE_CU`; `BGD_FNS: addRecommendationComment`; `QL_FNS: markCommentsSeen` |
| Gửi KH, ghi nhận phản hồi | – | ✔ | Xem | Xem | |
| Lịch PV, chọn/đổi NV phỏng vấn | – | ✔ (bất kỳ NV) | Xem | Xem | QL/BGĐ: "Xem chi tiết phỏng vấn" |
| Kết quả PV, feedback, kết quả TD | – | ✔ | Xem | Xem | |
| Báo cáo | – | – | ✔ | ✔ | Route `/bao-cao` chỉ QL/BGĐ |

## 2. Yêu cầu chung cho tất cả màn hình

| # | Yêu cầu | Đã xử lý |
|---|---|---|
| C1 | Thanh menu xanh đậm như ảnh mẫu | Sidebar nền navy, logo trắng `assets/logo-white.png` |
| C2 | Kênh đăng tuyển: bỏ TopCV, thay bằng "Khác" | Dữ liệu mẫu + migration tự đổi `KENH_DANG_TUYEN` và `UNG_VIEN.nguon` |
| C3 | Đổi tên menu | Khách hàng → **Danh sách khách hàng**; Đề cử ứng viên → **Danh sách đề cử**; Kho ứng viên → **Danh sách ứng viên** |
| C4 | Thu thập hồ sơ: Quản lý chỉ xem | QL thấy trang ở chế độ "Chỉ xem", ẩn đồng bộ/thu thập/gán; BGĐ không có menu này |
| C5 | Bỏ dòng mô tả dưới tiêu đề trang | Ẩn toàn bộ `.page-head p` (trừ dòng thông tin mã/ID) |
| C6 | Thêm cột STT | Mọi bảng danh sách: dự án, ứng viên, đề cử, kết quả, khách hàng, nhân sự, tài khoản, báo cáo |
| C7 | "ID dự án" → "ID vị trí" | Thay ở mọi màn hình, bộ lọc, thông báo lỗi |

## 3. Ban Giám đốc

| # | Nhận xét | Đã xử lý |
|---|---|---|
| G1 | Bỏ Thu thập hồ sơ | Ẩn menu, route chặn |
| G2 | Chi tiết dự án chỉ xem (bỏ Phân công, Gắn mã tin, Thao tác) | Phân công chỉ QL; Gắn mã tin / Thao tác chỉ NV tạo vị trí |
| G3 | Đề cử: hiện danh sách vị trí trước (tên, vị trí, thời hạn, nhân sự phụ trách, đợt, tổng đề cử) | Trang "Danh sách đề cử" cho QL/BGĐ là bảng vị trí; bấm **Xem** để mở danh sách ứng viên |
| G4 | Danh sách đề cử đã xử lý theo ảnh 17 | KPI Tổng đã xử lý / Đã duyệt / Từ chối / Có góp ý; tab Tất cả / Đã duyệt / Từ chối / Có góp ý; cột NV đề cử, QL xử lý, Kết quả, Ngày xử lý, Góp ý BGĐ; thao tác Xem / Góp ý; nút **Thông tin vị trí** |
| G5 | BGĐ chỉ xem; có ý kiến thì gửi góp ý (popup "Góp ý về đề cử" → "Gửi cho Quản lý") | Popup góp ý; góp ý lưu vào `GOP_Y_DE_CU`, QL nhận thông báo và số đếm trên menu |
| G6 | Danh sách ứng viên: chỉ xem + Xuất Excel | Ẩn Lọc ứng viên, Thu thập, chuẩn hóa, đề cử, lưu trữ |
| G7 | Phỏng vấn: chỉ xem | Ẩn Thêm lịch / Sửa / Hủy; thay bằng **Xem chi tiết phỏng vấn** |
| G8 | Kết quả "Chờ ghi nhận": bỏ nút Ghi nhận kết quả, thêm cột Feedback (PV); "Đạt lúc là gì?" | Nút chỉ dành cho NV; thêm cột **Feedback (phỏng vấn)**; "Đạt lúc" đổi thành **Ngày đạt PV** (ngày ghi nhận ứng viên đạt phỏng vấn + vòng) |
| G9 | Khách hàng: chỉ xem, không thêm | Ẩn Thêm / Cập nhật / Tạo dự án |
| G10 | Thêm tab "Kết quả phỏng vấn" (ảnh 28) | Tab đầu tiên trang Kết quả: STT, Ứng viên, Vị trí, Ngày PV + vòng, NV PV, KQ PV, Điểm, Feedback KH, Xem chi tiết; tìm kiếm, lọc nhân viên, chip kết quả |
| G11 | Thiết kế lại báo cáo theo mẫu (ảnh 10) | Cả 6 loại báo cáo theo mẫu: tên công ty, **mã báo cáo BC-XXX-YYYYMMDD-01**, kỳ báo cáo, Đơn vị / Phạm vi / Người lập / Đối tượng, **I. Tổng quan** (ô KPI), **II. Chi tiết** (STT + dòng Tổng cộng), Ghi chú, ngày ký, **Người lập / Người phê duyệt**. Xuất PDF chỉ in phần báo cáo; Excel có cột STT |

## 4. Quản lý

| # | Nhận xét | Đã xử lý |
|---|---|---|
| Q1 | Đề cử: danh sách vị trí trước, sau đó danh sách + popup thông tin vị trí | Như G3; trong vị trí có tab theo trạng thái và nút Thông tin vị trí |
| Q2 | Chi tiết dự án: bỏ "Gắn mã tin đăng" | Chỉ NV tạo vị trí thấy |
| Q3 | Phỏng vấn "Chọn hồ sơ": đổi thành ô gõ tên | Ô gõ tên có gợi ý (typeahead) |
| Q4 | Chờ duyệt: bỏ cột Phản hồi và nút Gửi KH | Cột Phản hồi chỉ ở tab "Đã có phản hồi" / "Tất cả"; Gửi KH chỉ NV, chỉ tab "Chờ gửi" |
| Q5 | "Lọc & tạo đề cử" → "Lọc ứng viên", ẩn với QL/BGĐ | Đã đổi tên, chỉ NV thấy |
| Q6 | "Vị trí / Khách hàng" → "Vị trí" | Đã đổi |
| Q7 | Cần chỉnh sửa: bỏ nút duyệt/gửi; cột Phản hồi → Ghi chú (lý do) | Cột **Ghi chú** hiển thị lý do yêu cầu sửa |
| Q8 | "Đã duyệt - chờ gửi" → **Chờ gửi**; "Đã gửi - chờ phản hồi" → **Chờ phản hồi**; bỏ nút và cột Phản hồi | Đã đổi tên tab và bỏ |
| Q9 | Đã có phản hồi: bỏ khu nút/In, bỏ cột Trạng thái, thêm Ghi chú sau Phản hồi | Đã xử lý |
| Q10 | Đã gỡ / Tất cả: bỏ duyệt/gửi | Đã xử lý |
| Q11 | Phỏng vấn: QL không Sửa/Hủy, thay bằng "Xem chi tiết phỏng vấn" | Popup chỉ xem |
| Q12 | "Người tham gia" tách 2 ô: Phía khách hàng / Phía công ty | Thêm 2 cột `nguoi_tham_gia_cong_ty`, `nguoi_tham_gia_khach_hang` (migration tách dữ liệu cũ) |
| Q13 | Kết quả và các màn khác như BGĐ | Như G7–G10 |

## 5. Nhân viên

| # | Nhận xét | Đã xử lý |
|---|---|---|
| N1 | Hồ sơ ứng viên → "Đề cử vào dự án": nút "Tiếp tục" phải là "Lưu"; lưu xong không thấy trong Danh sách đề cử | **Lỗi gốc:** "Tiếp tục" chỉ chuyển sang trang lọc mà chưa tạo đề cử. Nay popup **Đề cử vào vị trí** (gõ tên vị trí được phân công, đợt, kinh nghiệm, lương, thời gian báo trước, ghi chú) → **Lưu** tạo đề cử ngay và mở tab "Chờ duyệt" |
| N2 | Đề cử: chỉ tab "Chờ gửi" có Gửi KH; bấm Gửi KH hiện popup thông tin KH để xác nhận | Popup xác nhận gồm công ty, người liên hệ, email, điện thoại, địa chỉ và danh sách ứng viên gửi (nhóm theo KH) |
| N3 | Chờ duyệt, Chờ gửi: thêm thao tác sau "Mở hồ sơ" | Gỡ (Chờ duyệt); Gửi KH, Gỡ (Chờ gửi); Sửa & gửi lại (Cần chỉnh sửa); Ghi nhận phản hồi (Chờ phản hồi) |
| N4 | Người tham gia tách 2 ô | Như Q12; đổi NV phỏng vấn tự cập nhật ô phía công ty |
| N5 | "Đạt lúc là gì?" | Như G8 |
| N6 | Thêm tab "Kết quả phỏng vấn" có thao tác (ảnh 26) | Ghi nhận / Sửa / Tạo lịch vòng N / Mở hồ sơ; popup "Ghi nhận kết quả phỏng vấn": Đạt / Không đạt / Cần PV thêm, Điểm, Nhận xét NV, Feedback KH + thêm feedback. Sửa kết quả bị khóa khi đã có kết quả tuyển dụng hoặc đã có vòng sau |
| N7 | "Nhận định chung về danh sách" khó hiểu | Đổi thành **Ghi chú gửi Quản lý** kèm gợi ý cách ghi |
| N8 | Chọn dự án: gõ tên, chỉ những vị trí được phân công | Typeahead chỉ liệt kê vị trí "Đang thực hiện" mà NV được phân công |
| N9 | Cài đặt: "Dữ liệu demo này là gì?" | Cài đặt nay là **Hồ sơ cá nhân + Đổi mật khẩu**; phần sao lưu/khôi phục dữ liệu mẫu chỉ hiện cho Quản trị viên, kèm giải thích rõ |
| N10 | Đặng Hữu Vinh đề cử 2 vị trí nhưng chỉ thấy 1 | **Nguyên nhân:** danh sách cũ tách theo tab trạng thái nên hai đề cử ở hai trạng thái khác nhau nằm ở hai tab. Nay tab **Tất cả** hiển thị đủ, cột Vị trí ghi rõ từng vị trí; QL/BGĐ xem theo từng vị trí |

## 6. Thay đổi kỹ thuật

- **CSDL:** bảng `GOP_Y_DE_CU`; `LICH_PHONG_VAN` thêm `nguoi_tham_gia_cong_ty`, `nguoi_tham_gia_khach_hang`, `ly_do_huy`. Migration tự chạy khi khởi động (`server/repository.js`), không mất dữ liệu cũ.
- **API:** phân quyền theo nhóm hàm `ADMIN_FNS / QL_FNS / BGD_FNS / ANY_FNS`; mặc định chỉ Nhân viên thao tác nghiệp vụ.
- **Nghiệp vụ mới:** `addRecommendationComment`, `markCommentsSeen`, `updateInterviewResult`, `changePassword`; `cancelInterview` bắt buộc lý do.
- **Kiểm thử:** kịch bản nghiệp vụ Fix Demo (16/16), lịch phỏng vấn UC10 (17/17), phân quyền qua API (10/10), smoke test (9/9); đã duyệt giao diện theo từng vai trò trên desktop và mobile.
