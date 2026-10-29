# Phân tích Chương 3 (bản cập nhật) — luồng nghiệp vụ & đối chiếu website

Nguồn: `KLTN_Chuong3_Chi (2).docx` — 1.540 đoạn văn, 26 hình. Gồm 5 sơ đồ quy trình, BFD, 9 sơ đồ use case, 12 đặc tả UC, 9 sơ đồ tuần tự, ERD 19 bảng, sơ đồ lớp và thiết kế bảng.

## 1. Bản cập nhật thay đổi gì so với bản trước

| # | Thay đổi | Vị trí trong tài liệu | Website đã cập nhật |
|---|---|---|---|
| 1 | Vai trò **"Trưởng nhóm" → "Quản lý"** (37 chỗ trong văn bản, các sơ đồ, lớp `TruongNhom` → `QuanLy`, cột `vai_tro`) | Toàn chương; Hình 3.1, 3.2, 3.5, 3.7, 3.10, 3.11, 3.15, 3.19, 3.25, 3.27 | Vai trò, menu, thông báo, CHECK trong MySQL; tài khoản demo `quanly`; **migration tự động** cho CSDL đang có dữ liệu |
| 2 | **Viết lại luồng lên lịch phỏng vấn**: lịch do khách hàng chốt; nhân viên phỏng vấn mặc định là người phụ trách dự án; trùng lịch là lỗi và phải chọn nhân viên khác; 5 loại cảnh báo cần xác nhận | 3.2.1.3 (Hình 3.3), Hình 3.14, UC_10 (3a, 4b, 4c), BR10-2, BR10-5, BR10-6, 3.2.5.8 (Hình 3.23) | Hộp thoại lên lịch mới, kiểm tra ngay khi nhập, gợi ý nhân viên rảnh, xác nhận cảnh báo |
| 3 | Màn hình mới **"Quy tắc xếp lịch phỏng vấn"** (BR10-6) | BR10-6 | Trang `Quy tắc xếp lịch PV` + bảng `QUY_TAC_XEP_LICH` |
| 4 | Bỏ sơ đồ tuần tự 3.20 "Tiếp nhận hồ sơ apply từ kênh đăng tuyển" | 3.2.5.5 | Giữ nguyên chức năng (BR8-4 vẫn yêu cầu không nhập tay) |

## 2. Danh sách luồng

### 2.1. Luồng quy trình nghiệp vụ (sơ đồ swimlane)

**Q1. Tạo dự án và phân công (Hình 3.1)**
- Các bước: Nhân viên nhận yêu cầu → nhập vị trí → hệ thống kiểm tra *(sai thì nhập lại)* → lưu "Mới tiếp nhận" → Quản lý chọn nhân viên phụ trách → chuyển "Đang thực hiện".
- Trên website: *Dự án tuyển dụng → Tiếp nhận yêu cầu*, tab *Chờ phân công*, gợi ý nhân viên cùng khu vực.

**Q2. Lọc và đề cử (Hình 3.2)**
- Các bước: lọc nâng cao, chỉ ứng viên "Hoạt động" → tick chọn *(chưa phù hợp thì lọc lại)* → tạo hồ sơ ứng tuyển nếu chưa apply → đề cử "Chờ duyệt" → Quản lý **duyệt** hoặc **yêu cầu sửa kèm lý do**.
- Trên website: *Kho ứng viên → Lọc nâng cao*, độ phù hợp %, nhãn "Chưa apply", *Đề cử ứng viên*.

**Q3. Lên lịch & ghi nhận kết quả phỏng vấn (Hình 3.3) — mới**
- Các bước:
  1. Nhập lịch khách hàng đã chốt.
  2. Phân công nhân viên phỏng vấn (mặc định người phụ trách dự án) và kiểm tra trùng.
  3. **Trùng** → báo trùng → chọn nhân viên khác → kiểm tra lại.
  4. **Không trùng** → lưu, hồ sơ chuyển "Phỏng vấn".
  5. Tổ chức phỏng vấn → nhập kết quả và feedback.
  6. Rẽ nhánh theo kết quả: **Đạt** → chờ kết quả tuyển dụng; **Không đạt** → "Bị loại"; **Cần phỏng vấn thêm** → quay lại bước 1.
- Trên website: hộp thoại *Lên lịch phỏng vấn* (mục 4), *Ghi nhận kết quả PV*.

**Q4. Kết quả tuyển dụng (Hình 3.4)**
- Các bước: khách hàng báo kết quả → kiểm tra dữ liệu → rẽ nhánh:
  - **Từ chối offer** → "Bị loại", dự án tiếp tục.
  - **Chấp nhận offer** → hồ sơ "Thử việc", ứng viên "Đang thử việc", tính lại tiến độ; đủ chỉ tiêu thì dự án "Hoàn thành".
- Trên website: *Ghi nhận kết quả tuyển dụng*. Website còn tự loại ứng viên khỏi các danh sách đề cử khác (theo nhận xét của thầy).

**Q5. Báo cáo (Hình 3.5)**
- Các bước: chọn loại báo cáo và bộ lọc → kiểm tra quyền → *có dữ liệu?* (không thì chọn lại) → hiển thị bảng và biểu đồ → *xuất?* → Excel/PDF.
- Trên website: *Báo cáo – Thống kê*, 6 loại báo cáo.

### 2.2. Luồng use case (chính / thay thế / ngoại lệ)

| UC | Luồng chính | Luồng thay thế | Ngoại lệ & quy tắc |
|---|---|---|---|
| UC_01 Đăng nhập | Nhập → tra tài khoản → kiểm tra mật khẩu & trạng thái → vào trang theo vai trò | 3a: chưa đăng nhập → đăng nhập xong quay lại chức năng đã chọn | 5a: sai thông tin, không nêu trường nào sai; 5b: "Đã nghỉ việc" không được vào |
| UC_02 Tài khoản | Thêm → kiểm tra trùng tên đăng nhập/email → sinh mật khẩu, mã hóa | 1a tìm kiếm, 1b sửa, 1c đặt lại mật khẩu, 1d phân quyền (4 vai trò, có **Quản lý**) | 4a sai định dạng, 4b trùng; BR2-4 không xóa tài khoản đã có dữ liệu |
| UC_03 Khách hàng | Thêm (chọn lĩnh vực) → kiểm tra trùng → "Đang hợp tác" | 1a tìm, 1b sửa, 1c chi tiết + lịch sử dự án | 4a, 4b trùng; BR3-3 "Ngừng hợp tác" thay cho xóa |
| UC_04 Dự án | Tạo dự án tuyển dụng → tạo vị trí → kiểm tra → "Mới tiếp nhận" | 1a dùng dự án có sẵn; 6a gắn mã tin; 6b sửa; 6c tiến độ + cảnh báo hạn; 6d đóng/hủy; **6e lọc 7 tiêu chí** | 4a số lượng ≤ 0 hoặc hạn đã qua; 6f thiếu lý do; BR4-4 sắp hạn ≤ 3 ngày; BR4-5 công thức tiến độ; BR4-6 phạm vi xem |
| UC_05 Phân công | Quản lý chọn nhân viên → "Đang phụ trách" → dự án "Đang thực hiện" | 3a nhiều người; 3b chuyển người (cũ → "Đã chuyển") | 3c chưa chọn; BR5-2 chỉ người đang làm việc |
| UC_06 Đề cử | Lọc → tick → nhập đợt/lương/notice → kiểm tra hồ sơ → "Chờ duyệt" → Quản lý duyệt | 4a không có kết quả; 6a tạo hồ sơ cho ứng viên chưa apply; 8a yêu cầu sửa; 8b xem theo cột; 8c đổi trạng thái; 8d gỡ | 5a chưa chọn; 6b trùng đợt; BR6-7 chỉ ứng viên "Hoạt động" |
| UC_07 Gửi khách hàng | Gửi (chỉ khi "Đã duyệt") → nhập phản hồi → xử lý theo phản hồi | 1a gửi nhiều; 6a từ chối + lý do; 6b cần đợt tiếp theo | 1b chưa duyệt; 4a chưa gửi; 4b chưa chọn phản hồi |
| UC_08 Ứng viên | Chuẩn hóa & gắn thẻ hồ sơ thu thập tự động → kiểm tra trùng → "Hoạt động" | 3a đính kèm CV; 1a cập nhật; 1b lọc; 1c chi tiết; 1d lưu trữ | 4a, 4b trùng email/SĐT; 3b CV sai định dạng/quá dung lượng; BR8-4 không nhập tay |
| UC_09 Kết quả tuyển dụng | Nhập kết quả + email xác nhận → chấp nhận: "Thử việc", "Đang thử việc", tiến độ | 6a từ chối offer; 1a đổi trạng thái; 1b tra cứu | 4a thiếu dữ liệu; 1c đã có kết quả |
| **UC_10 Lịch phỏng vấn** | Biểu mẫu với **người phụ trách dự án mặc định** → nhập lịch khách hàng chốt → kiểm tra trùng → lưu | 1a sửa (kể cả đổi nhân viên); 1b hủy; 1c tra cứu; **3a chủ động chọn nhân viên khác**; 6a vòng tiếp theo | 4a giờ sai; **4b trùng → không lưu, chọn người khác (giữ giờ)**; **4c cảnh báo → xác nhận**; 1d lịch đã phỏng vấn thì khóa |
| UC_11 Kết quả PV | Nhập kết quả, điểm, nhận xét, feedback → "Đã phỏng vấn" | 3a không đạt; 3b cần thêm; 1a feedback bổ sung | 1b điểm ngoài 0–10; 1c đã có kết quả |
| UC_12 Báo cáo | Chọn loại & bộ lọc → kiểm tra quyền → tổng hợp → bảng + biểu đồ | 6a xuất Excel/PDF | 4a không có quyền; 5a không có dữ liệu |

### 2.3. Luồng tuần tự (Server ↔ Database)

- 3.16 Đăng nhập.
- 3.17 Tạo tài khoản.
- 3.18 Tạo dự án.
- 3.19 Phân công.
- 3.21 Lọc & đề cử (nhánh tùy chọn: tạo hồ sơ nếu chưa có).
- 3.22 Gửi đề cử & phản hồi (3 nhánh).
- **3.23 Lên lịch phỏng vấn**: Server truy vấn lịch của nhân viên trong khung giờ → 2 nhánh "Không trùng / Trùng" → ghi kết quả (3 nhánh).
- 3.24 Kết quả tuyển dụng (3 nhánh).
- 3.25 Báo cáo (nhánh có/không dữ liệu, tùy chọn xuất tệp).

Trên website, tất cả các luồng này chạy ở máy chủ Node.js: `POST /api/rpc` → `services.js` → transaction MySQL.

### 2.4. Luồng tự động của hệ thống

- **Tiếp nhận hồ sơ apply** theo mã tin đăng (nhiều nơi trong văn bản vẫn tham chiếu Hình 3.20, dù sơ đồ đã bị bỏ).
- **Tính lại tiến độ** và tự chuyển "Hoàn thành" khi đủ chỉ tiêu (BR4-5, BR9-5).
- **Cảnh báo hạn** sắp đến / quá hạn (BR4-4).
- **Loại ứng viên đã nhận việc** khỏi các danh sách khác (BR9-6 và nhận xét của thầy).

## 3. Vòng đời trạng thái

```
Vị trí (CHI_TIET_DU_AN):  Mới tiếp nhận ─phân công→ Đang thực hiện ─đủ chỉ tiêu→ Hoàn thành
                                                   ├─(lý do)→ Đã đóng / Đã hủy
Hồ sơ ứng tuyển:          Mới apply → Đề cử → Phỏng vấn → Thử việc
                              └──────────┴─────────┴──→ Bị loại
Ứng viên (kho):           Hoạt động ⇄ Đang thử việc (nhận offer / thử việc không đạt) ; Lưu trữ
Đề cử:                    Chờ duyệt → (Cần chỉnh sửa → Chờ duyệt) → Đã duyệt → Đã gửi KH (+ phản hồi) ; Đã gỡ
Lịch phỏng vấn:           Đã lên lịch → Đã phỏng vấn | Đã hủy
```

## 4. Phân tích chi tiết luồng lên lịch phỏng vấn mới (UC_10)

| Tình huống | Loại | Hệ thống xử lý |
|---|---|---|
| Dự án chưa có người phụ trách | Tiền điều kiện | Không cho lên lịch, yêu cầu Quản lý phân công |
| Nhân viên phỏng vấn trùng khung giờ (BR10-2) | **Lỗi** | Không lưu. Chỉ rõ buổi bị trùng, gợi ý nhân viên rảnh (ưu tiên cùng khu vực). **Giữ nguyên giờ** vì giờ do khách hàng quyết định (BR10-5) |
| Khoảng nghỉ giữa hai buổi < X phút | Cảnh báo | Xác nhận thì vẫn lưu |
| Hai buổi trực tiếp ở hai khu vực khác nhau, cách nhau < thời gian di chuyển | Cảnh báo | Xác nhận thì vẫn lưu |
| Ngoài giờ làm việc / cuối tuần | Cảnh báo | Xác nhận thì vẫn lưu |
| Vượt số buổi tối đa trong ngày | Cảnh báo | Xác nhận thì vẫn lưu |
| Nhân viên được chọn đã nghỉ việc | Lỗi | Chỉ chọn người đang làm việc |

Các mức thời gian (mặc định nghỉ 30′, di chuyển 90′, 08:00–18:00, cảnh báo cuối tuần, tối đa 4 buổi/ngày) do Quản trị viên hoặc Ban Giám đốc / Quản lý chỉnh ở màn hình **Quy tắc xếp lịch phỏng vấn**. Màn hình này còn liệt kê các lịch sắp tới đang vi phạm quy tắc hiện hành.

## 5. Điểm chưa nhất quán trong tài liệu — nên sửa trước khi nộp

1. **Hình 3.20 đã bị bỏ** nhưng vẫn được tham chiếu ở danh sách tác nhân ("Kênh đăng tuyển… xem Hình 3.20") và ở **BR8-4**. Đánh số hình sau đó nhảy từ 3.19 sang 3.21. Nên giữ lại sơ đồ, hoặc sửa các tham chiếu và đánh số lại.
2. **UC_09 luồng 1a và BR9-3** vẫn ghi lịch sử gồm "trạng thái cũ, trạng thái mới, người thực hiện". Điều này mâu thuẫn với bảng `LICH_SU_TRANG_THAI` 4 trường mà thầy đã yêu cầu. Nên sửa thành "thời điểm thay đổi, trạng thái mới, ghi chú".
3. **BR10-6 có màn hình "Quy tắc xếp lịch phỏng vấn" nhưng không có bảng lưu cấu hình** (ERD vẫn 19 bảng). Website bổ sung bảng `QUY_TAC_XEP_LICH`; nên thêm bảng này vào 3.3.1 và 3.3.3.
4. **BR4-6 "dự án do mình tạo"** nhưng `CHI_TIET_DU_AN` không có cột người tạo. Website bổ sung `ma_nguoi_tao`.
5. **"Phạm vi quản lý" của Ban Giám đốc / Quản lý** (BR4-6, BR12-1) chưa được định nghĩa (theo khu vực hay nhóm?). Website hiện cho xem toàn bộ.
6. **Thứ tự luồng UC_10**: luồng ngoại lệ "1d" đứng sau "4c". Nên sắp lại theo số bước.

## 6. Đối chiếu website

- Tất cả 12 UC, 5 quy trình và 9 luồng tuần tự đều có màn hình và quy tắc tương ứng.
- **Bổ sung trong lần này:**
  - Vai trò "Quản lý" và migration CSDL.
  - UC_10 mới (3a, 4b, 4c, BR10-5, BR10-6).
  - Màn hình "Quy tắc xếp lịch phỏng vấn".
  - Bộ lọc UC_04 6e theo **dự án tuyển dụng** và **hạn hoàn thành**.
  - Máy chủ Render chạy múi giờ Việt Nam để giờ phỏng vấn và hạn hoàn thành đúng.
