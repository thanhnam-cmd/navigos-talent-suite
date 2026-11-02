# Fix demo 3: phân tích nhận xét cuối cùng của khách hàng

Nguồn: file `Fix demo 3.pdf` gồm 6 trang, ảnh chụp màn hình có khoanh đỏ và ghi chú.

## Danh sách yêu cầu

| # | Màn hình | Nhận xét | Phân tích | Cách xử lý |
|---|---|---|---|---|
| 1 | Dự án tuyển dụng | "Xóa BR4-5" ở cột "Tiến độ (BR4-5)" | Mã quy tắc nghiệp vụ (BRx-y) là ký hiệu nội bộ của tài liệu đặc tả, không nên hiện cho người dùng. | Bỏ **mọi** mã BR và ký hiệu bước kiểu "(3a)" khỏi tiêu đề cột, gợi ý, thông báo và lỗi trên toàn hệ thống. Mã BR chỉ còn trong chú thích mã nguồn. |
| 2 | Xuất PDF báo cáo | "XÓA những chỗ này trong xuất PDF" | Bản in có 4 phần thừa:<br>- dòng ghi chú "Số liệu được tổng hợp tự động… (BR12-5)";<br>- thông báo nổi "Chọn Lưu dưới dạng PDF…" bị in đè vào ô chữ ký;<br>- dòng chân trang "Navigos Group Việt Nam · Báo cáo … · BC-…";<br>- ngày giờ, tiêu đề, URL và số trang do trình duyệt tự in.<br>Ngoài ra khối chữ ký bị tách sang trang mới. | - Bỏ dòng ghi chú BR12-5.<br>- Bỏ thông báo nổi: nút Xuất PDF mở hộp thoại in ngay, và mọi thông báo, menu, hộp thoại đều bị ẩn khi in.<br>- Bỏ dòng chân trang.<br>- Trang in dùng khổ A4 không lề (`@page rp { margin: 0 }`) nên trình duyệt không chèn ngày giờ, URL, số trang. Lề trên/dưới vẫn lặp lại ở mọi trang nhờ khung bảng `.rp-frame`.<br>- Khối ngày tháng + chữ ký không bị tách trang; dưới tên người lập chỉ còn họ tên. |
| 3 | Báo cáo - Thống kê (màn hình) | "Xóa trong báo cáo thống kê" (mã báo cáo BC-… và dòng chú thích dưới bảng) | Thông tin thừa trên màn hình. | Bỏ mã báo cáo và dòng chú thích dưới bảng. Bỏ nhãn "Biểu đồ minh họa (không in)". Mã báo cáo vẫn có trong bản PDF. |
| 4 | Danh sách đề cử (Nhân viên) | "Làm giống của QL: hiện danh sách vị trí phân công rồi mới hiện ds đề cử" | Nhân viên đang thấy ngay toàn bộ đề cử của mọi vị trí trộn lẫn. | Nhân viên vào **danh sách vị trí mình phụ trách**: STT, vị trí, dự án, thời hạn, phụ trách, đợt, tổng đề cử, *Cần chỉnh sửa*, *Chờ gửi KH*. Vị trí có việc cần làm được xếp lên đầu. Bấm **Xem** để mở danh sách đề cử của vị trí với các tab trạng thái như cũ, kèm nút **Lọc ứng viên** cho đúng vị trí đó. |
| 5 | Lịch phỏng vấn: chọn nhân viên phỏng vấn | "Đang được chọn nhân sự toàn công ty → chỉ được chọn những người phụ trách dự án; không có lựa chọn khác thì báo quản lý để phân công thêm người hỗ trợ. Bảng phân công thêm trường vai trò: phụ trách, hỗ trợ" + bảng quyền **Làm được / Không làm được** của người hỗ trợ | Danh sách chọn người phỏng vấn lấy toàn bộ nhân viên, sai phạm vi. Cần thêm vai trò trong phân công và giới hạn quyền của người hỗ trợ. | Xem phần **Vai trò Phụ trách / Hỗ trợ** bên dưới. |
| 6 | Kết quả tuyển dụng | "Thêm tab để ghi nhận kết quả phỏng vấn, đổi tab Đã ghi nhận lên trước tab Đang thử việc" | Buổi đã diễn ra chưa có kết quả đang lẫn trong tab "Kết quả phỏng vấn". | Thêm tab đầu tiên **Chưa có kết quả PV**: STT, ứng viên, vị trí + khách hàng, ngày giờ phỏng vấn, vòng, nhân viên phỏng vấn, trạng thái "Chưa có kết quả", nút **Ghi nhận** / **Mở hồ sơ**.<br>Tab "Kết quả phỏng vấn" chỉ còn buổi đã có kết quả.<br>Thứ tự tab: Chưa có kết quả PV → Kết quả phỏng vấn → Chờ ghi nhận → **Đã ghi nhận → Đang thử việc** → Theo vị trí.<br>Việc cần làm "buổi phỏng vấn chưa ghi nhận kết quả" ở Trang chủ trỏ thẳng vào tab mới. |
| 7 | Quản lý phỏng vấn (lỗi) | "Tạo lịch cho Đạt 03/11 09:30–10:30, form báo Không trùng lịch dù Trâm đã có lịch của Bùi Đức Hải 09:00–10:00. Sau khi lưu, lịch vòng 2 của Hải tự chuyển Đã hủy dù mình không hủy" | Xem phần **Lỗi trùng lịch và lịch tự hủy** bên dưới. | - Không còn hủy lịch ngầm.<br>- Lịch bị hủy luôn có lý do và hiện lý do trên thẻ lịch.<br>- Đã có kiểm thử cho đúng kịch bản 09:00 / 09:30 của khách hàng. |
| 8 | Hộp thoại lên lịch phỏng vấn | "Thêm tên vị trí, tên KH như này" | Tiêu đề chỉ có tên ứng viên. | Dưới tiêu đề có 3 thẻ: **Vị trí**, **ID vị trí**, **Khách hàng**, đúng như mẫu khách hàng gửi. Bỏ dòng "Quy tắc đang áp dụng…" ở cuối form. |

## Vai trò Phụ trách / Hỗ trợ (yêu cầu 5)

**CSDL:**
- `PHAN_CONG.vai_tro`: `'Phụ trách' | 'Hỗ trợ'`, mặc định `'Phụ trách'`, có ràng buộc CHECK.
- Bảng mới `YEU_CAU_HO_TRO` lưu đề nghị bổ sung người hỗ trợ: vị trí, người gửi, nội dung, ngày gửi, trạng thái, người xử lý, ngày xử lý.
- Migration số 7 tự chạy khi máy chủ khởi động. Phân công cũ giữ nguyên với vai trò "Phụ trách", không mất dữ liệu.

**Phân công (Quản lý):** hộp thoại "Phân công nhân sự" có ô chọn vai trò cho từng nhân viên: *Không chọn / Phụ trách / Hỗ trợ*.
- Vị trí bắt buộc có ít nhất một người Phụ trách.
- Đổi vai trò được cập nhật tại chỗ.
- Bỏ chọn thì phân công chuyển "Đã chuyển", vẫn giữ lịch sử.
- Tab "Lịch sử phân công" có thêm cột **Vai trò**.

**Quyền của người Hỗ trợ** (kiểm tra cả trên giao diện và máy chủ):

| Làm được | Không làm được |
|---|---|
| Được chọn làm người phỏng vấn của vị trí. Hệ thống kiểm tra trùng lịch cho họ như mọi người. | Tạo đề cử, gỡ ứng viên, gửi đề cử cho khách hàng, ghi nhận phản hồi khách hàng |
| Xem lịch phỏng vấn của chính mình | Tạo, sửa, hủy lịch (do người phụ trách làm) |
| Xem thông tin vị trí và hồ sơ ứng viên mình phỏng vấn (chỉ đọc) | Sửa vị trí, gắn mã tin đăng, đóng hoặc hủy vị trí |
| Ghi nhận và sửa kết quả phỏng vấn cùng feedback của buổi mình tham gia | Ghi nhận offer ở màn Kết quả tuyển dụng |

**Chọn nhân viên phỏng vấn:**
- Danh sách chỉ gồm nhân sự Phụ trách / Hỗ trợ của vị trí, có ghi rõ vai trò. Máy chủ cũng chặn nếu chọn người ngoài vị trí.
- Khi trùng lịch, hệ thống gợi ý người khác **của vị trí** đang rảnh.
- Nếu không còn ai, form hiện nút **Báo Quản lý phân công thêm người hỗ trợ**. Ngoài ra luôn có liên kết "Cần thêm người? Báo Quản lý" dưới ô chọn.
- Quản lý nhận đề nghị ở chuông thông báo, ở Trang chủ, ở số đếm menu "Dự án tuyển dụng" và ở trang vị trí. Tại đó có hai nút **Phân công người hỗ trợ** và **Không cần bổ sung**.
- Đề nghị tự đóng khi Quản lý phân công người hỗ trợ.

**Dữ liệu mẫu:** Phạm Thu Hà hỗ trợ *Senior Java Backend Engineer* và *Data Scientist*. Võ Thanh Tâm hỗ trợ *Regional Sales Manager*. Lê Hoàng Phúc hỗ trợ *Brand Manager*. Buổi phỏng vấn Võ Đức Đạt ngày 04/11 do Phạm Thu Hà (Hỗ trợ) phỏng vấn.

## Lỗi trùng lịch và lịch tự hủy (yêu cầu 7)

Tái hiện đúng kịch bản trên tầng nghiệp vụ: Trâm có lịch 09:00–10:00, sau đó tạo lịch 09:30–10:30. Kết quả là hệ thống **có** báo trùng lịch và lịch 09:00 vẫn "Đã lên lịch".

Vì vậy, nguyên nhân là lịch vòng 2 của Hải **đã bị hệ thống tự hủy từ trước**, nên khi xếp lịch cho Đạt thì không còn gì trùng. Bản trước có các luồng tự hủy lịch mà **không ghi lý do** và **không hỏi người dùng**:
- ghi "Không đạt" một vòng trước (tự hủy vòng bổ sung đang chờ);
- đóng hoặc hủy vị trí;
- chuyển hồ sơ "Bị loại" thủ công;
- ứng viên nhận việc ở vị trí khác hoặc bị lưu trữ.

Thẻ lịch lại không hiện lý do hủy, nên người dùng thấy lịch "tự chuyển Đã hủy".

**Đã sửa:**
1. Ghi hoặc sửa kết quả **Không đạt** khi hồ sơ còn buổi khác đang chờ: hệ thống **dừng lại và hỏi xác nhận**, liệt kê từng buổi sẽ bị hủy. Chỉ khi bấm "Lưu & hủy các buổi này" mới lưu. Lý do hủy ghi rõ người xác nhận.
2. Mọi luồng hủy tự động (đóng/hủy vị trí, Bị loại, nhận việc ở nơi khác, lưu trữ) đều lưu **lý do hủy**.
3. Thẻ lịch đã hủy hiện dòng **"Lý do hủy: …"**. Thẻ lịch bổ sung hiện **yêu cầu của khách hàng**.

## Sửa thêm trong quá trình kiểm tra

- Trang chủ của Nhân viên: liên kết "đề cử đã duyệt — sẵn sàng gửi khách hàng" và "đang chờ khách hàng phản hồi" trỏ nhầm tab, nay đã trỏ đúng *Chờ gửi* / *Chờ phản hồi*.
- Bản in danh sách đề cử còn chữ "Navigos Search", nay đổi thành "Talent Suite".
- Chức vụ Ban Giám đốc mẫu đổi thành "Giám đốc Navigos Group Việt Nam" (migration cập nhật luôn dữ liệu cũ).

## Kiểm thử

| Bộ kiểm thử | Kết quả |
|---|---|
| Fix demo 3 (engine): vai trò, quyền hỗ trợ, NV phỏng vấn theo vị trí, trùng lịch 09:00/09:30, xác nhận trước khi hủy, đề nghị hỗ trợ, lý do hủy | 26/26 |
| Test demo lần 2 (engine, cập nhật cho bước xác nhận) | 12/12 |
| Quy tắc lên lịch (engine) | 15/15 |
| Fix Demo lần 1 (engine) | 16/16 |
| API Fix demo 3 | 7/7 |
| API phân quyền Fix Demo lần 1 | 10/10 |
| Kiểm tra nhanh toàn hệ thống (smoke test) | 9/9 |

Đã xem trên trình duyệt:
- Danh sách đề cử của Nhân viên: danh sách vị trí, rồi danh sách đề cử của từng vị trí.
- Form lên lịch: có thẻ vị trí / khách hàng, danh sách người phỏng vấn chỉ có Phụ trách / Hỗ trợ, báo trùng lịch và gợi ý người hỗ trợ.
- Màn hình của người Hỗ trợ.
- Đề nghị hỗ trợ: nhân viên gửi, Quản lý nhận và xử lý.
- Hộp thoại phân công có vai trò.
- Báo cáo: bản màn hình và bản in.
