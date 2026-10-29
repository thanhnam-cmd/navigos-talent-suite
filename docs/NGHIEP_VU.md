# Nghiệp vụ & logic hệ thống — Navigos Talent Suite

Tài liệu này mô tả các quy tắc nghiệp vụ đã được hiện thực trong website, đối chiếu với **Chương 3 (UC_01–UC_12, BR)** và **nhận xét của giảng viên (Notes.pdf)**. Mã nguồn quy tắc nằm trong `js/services.js`.

## 1. Phạm vi & thuật ngữ (Notes §1)

| Quyết định | Cách thể hiện trên website |
|---|---|
| Mô hình **dịch vụ giới thiệu/săn ứng viên**, không thu phí ứng viên | Không có chức năng thu phí, không có thông tin tài chính của ứng viên |
| **Không quản lý hợp đồng kinh tế / doanh thu** | Không có bảng, màn hình hay báo cáo tiền nong; ghi chú ngay trong form tạo dự án |
| Thuật ngữ thống nhất **"Dự án tuyển dụng"** | Menu, tiêu đề, báo cáo đều dùng "Dự án tuyển dụng". Mỗi dự án gồm nhiều **vị trí** (chi tiết dự án) có **ID dự án** dạng `VT###` |

## 2. Thu thập hồ sơ — KHÔNG nhập tay (Notes §3, BR8-4, Hình 3.20)

Đã **bỏ nút "Thêm ứng viên mới"**. Hồ sơ vào kho theo 3 cách, tất cả đều tự động:

1. **Đồng bộ kênh đăng tuyển** (VietnamWorks, TopCV, LinkedIn, Facebook Jobs, Website Navigos Search) — trang *Thu thập hồ sơ* → "Đồng bộ".
2. **Thu thập từ URL tin tuyển dụng** — dán URL, hệ thống nhận diện kênh theo tên miền và mã tin trong URL.
3. **Kho dữ liệu nội bộ** sẵn có (có gắn nguồn tuyển).

Luồng xử lý mỗi hồ sơ apply:
- Kiểm tra trùng theo **email / số điện thoại** → trùng thì **dùng lại hồ sơ có sẵn** (BR8-1).
- Đối chiếu **mã tin đăng** với vị trí → khớp: tạo hồ sơ ứng tuyển "Mới apply"; không khớp: vào **danh sách chờ gán** (không mất hồ sơ).
- Không tạo hồ sơ trùng cho cùng ứng viên ở cùng vị trí.
- Gắn mã tin cho vị trí sẽ **tự động gán** các hồ sơ chờ gán có cùng mã.

Nhân viên chỉ **đọc CV, chuẩn hóa và gắn thẻ** (lĩnh vực, chuyên môn, cấp bậc, khu vực, kỹ năng, ghi chú phân loại). Nếu chuẩn hóa phát hiện trùng → đề nghị **gộp hồ sơ**.

## 3. Quy trình nghiệp vụ tuyển dụng (Notes §2)

```
Tiếp nhận yêu cầu ─► Vị trí "Mới tiếp nhận" ─► Quản lý phân công ─► "Đang thực hiện"
   ─► Lọc nâng cao (chỉ UV Hoạt động) ─► Tạo đề cử "Chờ duyệt"
   ─► Quản lý DUYỆT  ── hoặc ── YÊU CẦU CHỈNH SỬA (bắt buộc lý do → NV sửa → gửi duyệt lại)
   ─► Gửi khách hàng ─► Phản hồi: Đồng ý PV | Từ chối (lý do) | Cần đợt tiếp theo
   ─► Lịch phỏng vấn do KH chốt: NV phỏng vấn mặc định = người phụ trách dự án; trùng lịch → chọn NV khác (giữ giờ);
      cảnh báo (nghỉ ngắn, di chuyển, ngoài giờ, cuối tuần, số buổi/ngày) → xác nhận ─► Kết quả: Đạt | Không đạt | Cần PV thêm
   ─► Kết quả tuyển dụng do KH báo: Chấp nhận offer (ngày nhận việc + email xác nhận) | Từ chối offer
   ─► Đủ chỉ tiêu ⇒ vị trí tự chuyển "Hoàn thành"; chưa đủ ⇒ tiếp tục tìm kiếm bổ sung
```

- **Phân công**: gợi ý nhân viên **cùng khu vực** với vị trí trước (thuận tiện đi cùng khách hàng phỏng vấn trực tiếp), sau đó ít việc trước. Đổi người phụ trách → phân công cũ giữ "Đã chuyển".
- **Ứng viên chưa apply**: khi đề cử, hệ thống tự tạo hồ sơ ứng tuyển (mã tin trống) và gắn nhãn **"Chưa apply — chủ động liên hệ"** để công ty khảo sát nguyện vọng.
- **Gỡ đề cử** (chưa gửi KH): hồ sơ trở về trạng thái trước đó, ghi lịch sử.
- **Đóng/Hủy vị trí**: bắt buộc lý do; hồ sơ đang xử lý được giải phóng, lịch PV sắp tới bị hủy, tin đăng bị gỡ.

## 4. Vòng đời ứng viên — phần thầy sẽ soi kỹ khi demo (Notes §3)

**Trạng thái ứng viên (kho):** `Hoạt động` → `Đang thử việc` → (`Hoạt động` nếu thử việc không đạt) ; `Lưu trữ` khi đã có việc ở nơi khác / hết nhu cầu.

**Trạng thái hồ sơ ứng tuyển:** `Mới apply` → `Đề cử` → `Phỏng vấn` → `Thử việc` ; nhánh `Bị loại`.

| Sự kiện | Hệ thống tự động làm gì |
|---|---|
| Ứng viên **chấp nhận offer** | Hồ sơ → Thử việc; ứng viên → **Đang thử việc**; **tự loại khỏi MỌI danh sách đề cử/phỏng vấn đang mở ở dự án khác** (đề cử chưa gửi → "Đã gỡ", lịch PV → "Đã hủy", hồ sơ → "Bị loại" kèm ghi chú); không còn xuất hiện trong kết quả lọc |
| **Thử việc không đạt** | Hồ sơ → Bị loại (ghi chú); ứng viên **quay lại "Hoạt động"** trong bể hồ sơ; tiến độ tính lại; vị trí đã Hoàn thành sẽ mở lại "Đang thực hiện" |
| Ứng viên **đã có việc nơi khác / không muốn liên hệ** | "Lưu trữ" (bắt buộc lý do) → rút khỏi mọi danh sách đang mở, không bị gọi mời tuyển nữa (tránh tình huống "gara Ford gọi 3 năm") |
| Ứng viên lưu trữ **chủ động apply lại** | Tự kích hoạt lại "Hoạt động" |

**Kịch bản demo có sẵn trong dữ liệu mẫu:** ứng viên **Nguyễn Hoàng Long** đang *Đạt phỏng vấn* ở VT001 (FinNext) và *đã được duyệt đề cử* ở VT009 (Ánh Dương AI).
1. Đăng nhập `nhanvien` → Dự án VT001 → thẻ "Nguyễn Hoàng Long" → *Ghi nhận kết quả tuyển dụng* → Chấp nhận offer. Form cảnh báo trước "ứng viên có 1 hồ sơ khác đang xử lý".
2. Sau khi lưu: VT001 đủ chỉ tiêu → **Hoàn thành**; mở VT009 → Long nằm ở cột **Từ chối / không phù hợp** với ghi chú "Tự động loại: ứng viên đã nhận việc…"; vào Kho ứng viên → Lọc nâng cao: Long **không còn xuất hiện**.
3. Ở tab *Kết quả tuyển dụng → Đang thử việc* → "Thử việc không đạt" → Long quay lại kho, VT001 mở lại "Đang thực hiện".

## 5. Lịch sử trạng thái — chuẩn hóa theo góp ý (Notes §4)

Bảng `LICH_SU_TRANG_THAI` **chỉ 4 trường**: `ma_ho_so_ung_vien`, `thoi_diem_thay_doi`, `trang_thai_moi`, `ghi_chu` (đã bỏ người thực hiện, thời điểm bắt đầu/kết thúc, trạng thái cũ). Thời gian ở mỗi trạng thái được **suy ra từ timeline** — hiển thị trực tiếp trong ngăn hồ sơ ("đang ở 3 ngày", "Đề cử · 4 ngày"…) và có VIEW `V_THOI_GIAN_TRANG_THAI` trong `database/schema.sql`.

## 6. Báo cáo cụ thể (Notes §3, UC_12)

1. **Tiến độ dự án** — cần/đã nhận việc, %, đề cử, PV, cảnh báo hạn.
2. **Dự án trễ hạn** — quá hạn mà chưa Hoàn thành/Đóng/Hủy (BR12-3).
3. **Dự án theo khách hàng** — số dự án, vị trí, đang mở, hoàn thành, trễ hạn, tỷ lệ nhận việc.
4. **Kết quả tuyển dụng** — chấp nhận/từ chối offer, tỷ lệ nhận offer.
5. **Tỷ lệ chuyển đổi hồ sơ** — phễu Mới apply → Đề cử → Phỏng vấn → Thử việc (BR12-2), theo từng vị trí.
6. **Hiệu suất đề cử nhân viên** — số đề cử, tỷ lệ được duyệt, bị yêu cầu sửa, KH đồng ý PV, nhận việc; **In danh sách đề cử** của từng nhân viên để đánh giá hiệu suất lọc CV.

Bộ lọc: thời gian, khách hàng, vị trí, nhân viên. Xuất **Excel (.xls)** và **PDF** (in). Chỉ Ban Giám đốc / Quản lý xem được.

## 7. Phân quyền (UC_01, UC_02, BR4-6)

| Vai trò | Quyền chính | Phạm vi dữ liệu |
|---|---|---|
| Quản trị viên | Tài khoản, phân quyền, đặt lại mật khẩu, danh mục | Không xem nghiệp vụ tuyển dụng |
| Ban Giám đốc / Quản lý | Phân công, duyệt đề cử, báo cáo + toàn bộ thao tác nghiệp vụ | Toàn bộ dự án |
| Nhân viên | Khách hàng, dự án, chuẩn hóa hồ sơ, đề cử, phỏng vấn, kết quả | Chỉ vị trí **được phân công hoặc tự tạo** |

- Mật khẩu lưu trong MySQL dạng **SHA-256**, không bao giờ gửi xuống trình duyệt; phiên đăng nhập bằng cookie HttpOnly. Đăng nhập sai không nêu trường sai. Tài khoản "Đã nghỉ việc" không đăng nhập được, không bị xóa (BR2-4).

## 8. Đề xuất bổ sung so với thiết kế CSDL Chương 3

- `CHI_TIET_DU_AN.ma_nguoi_tao` — cần để thực hiện BR4-6 ("nhân viên xem dự án do mình tạo").
- Ràng buộc UNIQUE `(ma_ung_vien, ma_chi_tiet_du_an)` trên `HO_SO_UNG_TUYEN` và `(ma_ho_so_ung_vien, dot_de_cu)` trên `DE_CU` để bảo đảm BR6-1, BR6-2 ở tầng CSDL.
- Trường `TIN_DANG` có UNIQUE `(ma_kenh, ma_tin_kenh)` để đối chiếu mã tin không nhập nhằng.


## 9. Cập nhật theo Chương 3 bản (2)

Xem phân tích đầy đủ các luồng, thay đổi và điểm cần sửa trong tài liệu: [PHAN_TICH_CHUONG3.md](PHAN_TICH_CHUONG3.md).
