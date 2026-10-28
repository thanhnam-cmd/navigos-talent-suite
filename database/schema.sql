-- =====================================================================
--  Navigos Talent Suite — Lược đồ CSDL MySQL 8 (InnoDB, utf8mb4)
--  19 bảng nghiệp vụ theo ERD Hình 3.26 (Chương 3) + 1 bảng nhật ký đồng bộ.
--  Đã chuẩn hóa theo góp ý GVHD:
--   * "Dự án tuyển dụng" tách khỏi "Chi tiết dự án" (vị trí)
--   * Bảng PHAN_CONG + KHU_VUC (nhân sự cùng khu vực đi phỏng vấn)
--   * LICH_SU_TRANG_THAI chỉ 4 trường: mã hồ sơ, thời điểm, trạng thái mới, ghi chú
--   * Không có bảng hợp đồng / doanh thu (do bộ phận khác phụ trách)
--  Mọi DATETIME lưu theo giờ UTC, độ chính xác mili-giây (DATETIME(3)).
-- =====================================================================
SET NAMES utf8mb4;

-- ---------- Danh mục ----------
CREATE TABLE KHU_VUC (
  ma_khu_vuc   INT AUTO_INCREMENT PRIMARY KEY,
  ten_khu_vuc  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE LINH_VUC (
  ma_linh_vuc  INT AUTO_INCREMENT PRIMARY KEY,
  ten_linh_vuc VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE CAP_BAC (
  ma_cap_bac   INT AUTO_INCREMENT PRIMARY KEY,
  ten_cap_bac  VARCHAR(100) NOT NULL,
  thu_tu       INT NOT NULL DEFAULT 0 COMMENT 'Thứ bậc — dùng tính độ phù hợp cấp bậc liền kề'
) ENGINE=InnoDB;

CREATE TABLE CHUYEN_MON (
  ma_chuyen_mon  INT AUTO_INCREMENT PRIMARY KEY,
  ten_chuyen_mon VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ---------- Người dùng ----------
CREATE TABLE NHAN_SU (
  ma_nhan_su          INT AUTO_INCREMENT PRIMARY KEY,
  ma_khu_vuc          INT NOT NULL,
  ten_dang_nhap       VARCHAR(50)  NOT NULL UNIQUE,
  mat_khau            VARCHAR(255) NOT NULL COMMENT 'Đã mã hóa SHA-256 — BR1-1',
  ho_ten              VARCHAR(100) NOT NULL,
  email               VARCHAR(100) NOT NULL UNIQUE,
  so_dien_thoai       VARCHAR(20),
  chuc_vu             VARCHAR(100) NOT NULL,
  vai_tro             VARCHAR(20)  NOT NULL,
  trang_thai_lam_viec VARCHAR(20)  NOT NULL DEFAULT 'Đang làm việc',
  CONSTRAINT fk_ns_kv FOREIGN KEY (ma_khu_vuc) REFERENCES KHU_VUC(ma_khu_vuc),
  CONSTRAINT ck_ns_vaitro CHECK (vai_tro IN ('Quản trị viên','Ban Giám đốc','Trưởng nhóm','Nhân viên')),
  CONSTRAINT ck_ns_tt CHECK (trang_thai_lam_viec IN ('Đang làm việc','Đã nghỉ việc'))
) ENGINE=InnoDB;

-- ---------- Khách hàng & dự án tuyển dụng ----------
CREATE TABLE KHACH_HANG (
  ma_khach_hang      INT AUTO_INCREMENT PRIMARY KEY,
  ma_linh_vuc        INT NOT NULL,
  ten_cong_ty        VARCHAR(150) NOT NULL,
  nguoi_lien_he      VARCHAR(100) NOT NULL,
  email              VARCHAR(100) NOT NULL,
  so_dien_thoai      VARCHAR(20)  NOT NULL,
  dia_chi            VARCHAR(255),
  trang_thai_hop_tac VARCHAR(20)  NOT NULL DEFAULT 'Đang hợp tác',
  ngay_tao           DATETIME(3)  NULL,
  CONSTRAINT fk_kh_lv FOREIGN KEY (ma_linh_vuc) REFERENCES LINH_VUC(ma_linh_vuc),
  CONSTRAINT ck_kh_tt CHECK (trang_thai_hop_tac IN ('Đang hợp tác','Ngừng hợp tác'))
) ENGINE=InnoDB;

CREATE TABLE DU_AN_TUYEN_DUNG (
  ma_du_an      INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  ten_du_an     VARCHAR(150) NOT NULL,
  ngay_bat_dau  DATE NOT NULL,
  ngay_ket_thuc DATE,
  tien_do       INT NOT NULL DEFAULT 0 COMMENT 'BR4-5: % = Σ hồ sơ Thử việc / Σ số lượng cần tuyển',
  trang_thai    VARCHAR(20) NOT NULL DEFAULT 'Đang thực hiện',
  ghi_chu       TEXT,
  ngay_tao      DATETIME(3) NOT NULL,
  ngay_cap_nhat DATETIME(3) NULL,
  CONSTRAINT fk_da_kh FOREIGN KEY (ma_khach_hang) REFERENCES KHACH_HANG(ma_khach_hang),
  CONSTRAINT ck_da_td CHECK (tien_do BETWEEN 0 AND 100),
  CONSTRAINT ck_da_tt CHECK (trang_thai IN ('Đang thực hiện','Hoàn thành'))
) ENGINE=InnoDB;

CREATE TABLE CHI_TIET_DU_AN (
  ma_chi_tiet_du_an INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID dự án dùng khi lọc & đề cử',
  ma_du_an          INT NOT NULL,
  ma_cap_bac        INT NOT NULL,
  ma_chuyen_mon     INT NOT NULL,
  ma_khu_vuc        INT NOT NULL,
  vi_tri            VARCHAR(150) NOT NULL,
  mo_ta_cong_viec   TEXT,
  so_luong          INT NOT NULL,
  hinh_thuc         VARCHAR(20) NOT NULL,
  muc_luong_toi_da  DECIMAL(15,0),
  han_hoan_thanh    DATE NOT NULL,
  trang_thai        VARCHAR(20) NOT NULL DEFAULT 'Mới tiếp nhận',
  ly_do_dong_huy    VARCHAR(500),
  ma_nguoi_tao      INT NULL COMMENT 'Bổ sung: phục vụ BR4-6 (nhân viên xem dự án do mình tạo)',
  ngay_tao          DATETIME(3) NOT NULL,
  CONSTRAINT fk_ct_da FOREIGN KEY (ma_du_an) REFERENCES DU_AN_TUYEN_DUNG(ma_du_an),
  CONSTRAINT fk_ct_cb FOREIGN KEY (ma_cap_bac) REFERENCES CAP_BAC(ma_cap_bac),
  CONSTRAINT fk_ct_cm FOREIGN KEY (ma_chuyen_mon) REFERENCES CHUYEN_MON(ma_chuyen_mon),
  CONSTRAINT fk_ct_kv FOREIGN KEY (ma_khu_vuc) REFERENCES KHU_VUC(ma_khu_vuc),
  CONSTRAINT fk_ct_ns FOREIGN KEY (ma_nguoi_tao) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT ck_ct_sl CHECK (so_luong > 0),
  CONSTRAINT ck_ct_tt CHECK (trang_thai IN ('Mới tiếp nhận','Đang thực hiện','Hoàn thành','Đã đóng','Đã hủy')),
  CONSTRAINT ck_ct_lydo CHECK (trang_thai NOT IN ('Đã đóng','Đã hủy') OR ly_do_dong_huy IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE PHAN_CONG (
  ma_phan_cong      INT AUTO_INCREMENT PRIMARY KEY,
  ma_chi_tiet_du_an INT NOT NULL,
  ma_nhan_su        INT NOT NULL,
  ngay_phan_cong    DATETIME(3) NOT NULL,
  trang_thai        VARCHAR(20) NOT NULL DEFAULT 'Đang phụ trách',
  CONSTRAINT fk_pc_ct FOREIGN KEY (ma_chi_tiet_du_an) REFERENCES CHI_TIET_DU_AN(ma_chi_tiet_du_an),
  CONSTRAINT fk_pc_ns FOREIGN KEY (ma_nhan_su) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT ck_pc_tt CHECK (trang_thai IN ('Đang phụ trách','Đã chuyển'))
) ENGINE=InnoDB;

-- ---------- Kênh đăng tuyển ----------
CREATE TABLE KENH_DANG_TUYEN (
  ma_kenh    INT AUTO_INCREMENT PRIMARY KEY,
  ten_kenh   VARCHAR(100) NOT NULL,
  ten_mien   VARCHAR(100) COMMENT 'Tên miền — nhận diện kênh khi thu thập từ URL',
  tien_to    VARCHAR(10)  COMMENT 'Tiền tố mã tin, VD: VNW',
  loai       VARCHAR(20)  NOT NULL DEFAULT 'ngoai' COMMENT 'ngoai | noi_bo (kho dữ liệu sẵn có)',
  mo_ta      VARCHAR(255),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'Hoạt động'
) ENGINE=InnoDB;

CREATE TABLE TIN_DANG (
  ma_tin_dang       INT AUTO_INCREMENT PRIMARY KEY,
  ma_chi_tiet_du_an INT NOT NULL,
  ma_kenh           INT NOT NULL,
  ma_tin_kenh       VARCHAR(50) NOT NULL COMMENT 'Mã tin trên kênh — đối chiếu hồ sơ apply (BR4-3)',
  ngay_dang         DATETIME(3) NOT NULL,
  trang_thai        VARCHAR(20) NOT NULL DEFAULT 'Đang đăng',
  UNIQUE KEY uq_tin_kenh (ma_kenh, ma_tin_kenh),
  CONSTRAINT fk_td_ct FOREIGN KEY (ma_chi_tiet_du_an) REFERENCES CHI_TIET_DU_AN(ma_chi_tiet_du_an),
  CONSTRAINT fk_td_k FOREIGN KEY (ma_kenh) REFERENCES KENH_DANG_TUYEN(ma_kenh)
) ENGINE=InnoDB;

-- ---------- Ứng viên & hồ sơ ----------
CREATE TABLE UNG_VIEN (
  ma_ung_vien        INT AUTO_INCREMENT PRIMARY KEY,
  ma_linh_vuc        INT NULL,
  ma_cap_bac         INT NULL,
  ma_chuyen_mon      INT NULL,
  ma_khu_vuc         INT NULL,
  ma_nhan_su         INT NULL COMMENT 'Nhân viên chuẩn hóa hồ sơ; NULL = chưa chuẩn hóa',
  ho_ten             VARCHAR(100) NOT NULL,
  gioi_tinh          VARCHAR(10),
  nam_sinh           INT,
  email              VARCHAR(100) NOT NULL,
  so_dien_thoai      VARCHAR(20)  NOT NULL,
  dia_chi            VARCHAR(255),
  trinh_do_hoc_van   VARCHAR(255),
  so_nam_kinh_nghiem DECIMAL(3,1),
  ky_nang            VARCHAR(500),
  nguon              VARCHAR(100) COMMENT 'Nguồn tuyển (kênh / kho nội bộ)',
  cv_dinh_kem        VARCHAR(255),
  ghi_chu            TEXT,
  trang_thai         VARCHAR(20) NOT NULL DEFAULT 'Hoạt động',
  ngay_tao           DATETIME(3) NOT NULL,
  INDEX ix_uv_email (email),          -- BR8-1: kiểm tra trùng ở tầng ứng dụng
  INDEX ix_uv_phone (so_dien_thoai),
  INDEX ix_uv_tt (trang_thai),
  CONSTRAINT fk_uv_lv FOREIGN KEY (ma_linh_vuc) REFERENCES LINH_VUC(ma_linh_vuc),
  CONSTRAINT fk_uv_cb FOREIGN KEY (ma_cap_bac) REFERENCES CAP_BAC(ma_cap_bac),
  CONSTRAINT fk_uv_cm FOREIGN KEY (ma_chuyen_mon) REFERENCES CHUYEN_MON(ma_chuyen_mon),
  CONSTRAINT fk_uv_kv FOREIGN KEY (ma_khu_vuc) REFERENCES KHU_VUC(ma_khu_vuc),
  CONSTRAINT fk_uv_ns FOREIGN KEY (ma_nhan_su) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT ck_uv_tt CHECK (trang_thai IN ('Hoạt động','Đang thử việc','Lưu trữ'))
) ENGINE=InnoDB;

CREATE TABLE HO_SO_UNG_TUYEN (
  ma_ho_so_ung_vien INT AUTO_INCREMENT PRIMARY KEY,
  ma_chi_tiet_du_an INT NULL COMMENT 'NULL = danh sách chờ gán',
  ma_ung_vien       INT NOT NULL,
  ma_tin_kenh       VARCHAR(50) NULL COMMENT 'Trống khi nhân viên chủ động tạo lúc đề cử (chưa apply)',
  ngay_apply        DATETIME(3) NOT NULL,
  trang_thai        VARCHAR(30) NOT NULL DEFAULT 'Mới apply',
  ghi_chu           TEXT,
  INDEX ix_hs_uv_ct (ma_ung_vien, ma_chi_tiet_du_an),  -- BR6-2 kiểm tra ở tầng ứng dụng
  CONSTRAINT fk_hs_ct FOREIGN KEY (ma_chi_tiet_du_an) REFERENCES CHI_TIET_DU_AN(ma_chi_tiet_du_an),
  CONSTRAINT fk_hs_uv FOREIGN KEY (ma_ung_vien) REFERENCES UNG_VIEN(ma_ung_vien),
  CONSTRAINT ck_hs_tt CHECK (trang_thai IN ('Mới apply','Đề cử','Phỏng vấn','Thử việc','Bị loại'))
) ENGINE=InnoDB;

-- Chuẩn hóa theo góp ý: chỉ 4 trường, KHÔNG lưu người thực hiện, thời điểm bắt đầu/kết thúc, trạng thái cũ.
CREATE TABLE LICH_SU_TRANG_THAI (
  ma_ho_so_ung_vien  INT NOT NULL,
  thoi_diem_thay_doi DATETIME(3) NOT NULL,
  trang_thai_moi     VARCHAR(30) NOT NULL,
  ghi_chu            TEXT,
  PRIMARY KEY (ma_ho_so_ung_vien, thoi_diem_thay_doi),
  CONSTRAINT fk_ls_hs FOREIGN KEY (ma_ho_so_ung_vien) REFERENCES HO_SO_UNG_TUYEN(ma_ho_so_ung_vien)
) ENGINE=InnoDB;

-- ---------- Đề cử, phỏng vấn, kết quả ----------
CREATE TABLE DE_CU (
  ma_de_cu            INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho_so_ung_vien   INT NOT NULL,
  ma_nguoi_tao        INT NOT NULL,
  ma_nguoi_duyet      INT NULL,
  dot_de_cu           VARCHAR(50) NOT NULL,
  trang_thai          VARCHAR(30) NOT NULL DEFAULT 'Chờ duyệt',
  so_nam_kinh_nghiem  DECIMAL(3,1),
  muc_luong_mong_muon DECIMAL(15,0),
  notice_period       VARCHAR(50),
  ngay_tao            DATETIME(3) NOT NULL,
  ngay_duyet          DATETIME(3) NULL,
  ngay_gui_khach_hang DATETIME(3) NULL,
  phan_hoi_khach_hang VARCHAR(30),
  ngay_phan_hoi       DATETIME(3) NULL,
  ly_do_loai          VARCHAR(500),
  ghi_chu             TEXT COMMENT 'Gồm lý do khi Trưởng nhóm yêu cầu chỉnh sửa',
  INDEX ix_dc_dot (ma_ho_so_ung_vien, dot_de_cu),  -- BR6-1 kiểm tra ở tầng ứng dụng (đề cử "Đã gỡ" được tạo lại)
  CONSTRAINT fk_dc_hs FOREIGN KEY (ma_ho_so_ung_vien) REFERENCES HO_SO_UNG_TUYEN(ma_ho_so_ung_vien),
  CONSTRAINT fk_dc_tao FOREIGN KEY (ma_nguoi_tao) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT fk_dc_duyet FOREIGN KEY (ma_nguoi_duyet) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT ck_dc_tt CHECK (trang_thai IN ('Chờ duyệt','Cần chỉnh sửa','Đã duyệt','Đã gửi khách hàng','Đã gỡ')),
  CONSTRAINT ck_dc_ph CHECK (phan_hoi_khach_hang IS NULL OR phan_hoi_khach_hang IN ('Đồng ý phỏng vấn','Từ chối ứng viên','Cần đề cử đợt tiếp theo'))
) ENGINE=InnoDB;

CREATE TABLE LICH_PHONG_VAN (
  ma_lich            INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho_so_ung_vien  INT NOT NULL,
  ma_nhan_su         INT NOT NULL,
  thoi_gian_bat_dau  DATETIME(3) NOT NULL,
  thoi_gian_ket_thuc DATETIME(3) NOT NULL,
  hinh_thuc          VARCHAR(20) NOT NULL,
  dia_diem_link      VARCHAR(500),
  nguoi_tham_gia     TEXT,
  trang_thai         VARCHAR(30) NOT NULL DEFAULT 'Đã lên lịch',
  vong               INT NOT NULL DEFAULT 1 COMMENT 'Vòng phỏng vấn (BR10-1)',
  INDEX ix_lich_ns_time (ma_nhan_su, thoi_gian_bat_dau),  -- kiểm tra trùng lịch BR10-2
  CONSTRAINT fk_l_hs FOREIGN KEY (ma_ho_so_ung_vien) REFERENCES HO_SO_UNG_TUYEN(ma_ho_so_ung_vien),
  CONSTRAINT fk_l_ns FOREIGN KEY (ma_nhan_su) REFERENCES NHAN_SU(ma_nhan_su),
  CONSTRAINT ck_l_time CHECK (thoi_gian_ket_thuc > thoi_gian_bat_dau),
  CONSTRAINT ck_l_ht CHECK (hinh_thuc IN ('Trực tiếp','Trực tuyến')),
  CONSTRAINT ck_l_tt CHECK (trang_thai IN ('Đã lên lịch','Đã phỏng vấn','Đã hủy'))
) ENGINE=InnoDB;

CREATE TABLE KET_QUA_PHONG_VAN (
  ma_ket_qua    INT AUTO_INCREMENT PRIMARY KEY,
  ma_lich       INT NOT NULL UNIQUE,  -- BR11-1: tối đa 1 kết quả / lịch
  ket_qua       VARCHAR(20) NOT NULL,
  diem_danh_gia DECIMAL(3,1),
  nhan_xet      TEXT,
  ngay_ghi_nhan DATETIME(3) NOT NULL,
  CONSTRAINT fk_kqpv_l FOREIGN KEY (ma_lich) REFERENCES LICH_PHONG_VAN(ma_lich),
  CONSTRAINT ck_kqpv CHECK (ket_qua IN ('Đạt','Không đạt','Cần phỏng vấn thêm')),
  CONSTRAINT ck_kqpv_diem CHECK (diem_danh_gia IS NULL OR diem_danh_gia BETWEEN 0 AND 10)
) ENGINE=InnoDB;

CREATE TABLE FEEDBACK (
  ma_feedback    INT AUTO_INCREMENT PRIMARY KEY,
  ma_lich        INT NOT NULL,
  nguon_feedback VARCHAR(30) NOT NULL,
  noi_dung       TEXT NOT NULL,
  ngay_gui       DATETIME(3) NOT NULL,
  CONSTRAINT fk_fb_l FOREIGN KEY (ma_lich) REFERENCES LICH_PHONG_VAN(ma_lich)
) ENGINE=InnoDB;

CREATE TABLE KET_QUA_TUYEN_DUNG (
  ma_ket_qua_td       INT AUTO_INCREMENT PRIMARY KEY,
  ma_ho_so_ung_vien   INT NOT NULL UNIQUE,  -- BR9-1
  ket_qua             VARCHAR(20) NOT NULL,
  ngay_nhan_viec      DATE,
  ly_do_tu_choi       VARCHAR(500),
  email_xac_nhan      VARCHAR(255),
  ngay_khach_hang_bao DATE,
  ghi_chu             TEXT,
  ngay_ghi_nhan       DATETIME(3) NOT NULL,
  CONSTRAINT fk_kqtd_hs FOREIGN KEY (ma_ho_so_ung_vien) REFERENCES HO_SO_UNG_TUYEN(ma_ho_so_ung_vien),
  CONSTRAINT ck_kqtd CHECK (ket_qua IN ('Chấp nhận offer','Từ chối offer')),
  CONSTRAINT ck_kqtd_ngay CHECK (ket_qua <> 'Chấp nhận offer' OR ngay_nhan_viec IS NOT NULL)
) ENGINE=InnoDB;

-- ---------- Nhật ký đồng bộ hồ sơ từ kênh đăng tuyển (phụ trợ) ----------
CREATE TABLE NHAT_KY_DONG_BO (
  ma_nhat_ky INT AUTO_INCREMENT PRIMARY KEY,
  thoi_diem  DATETIME(3) NOT NULL,
  nguoi      VARCHAR(100),
  kenh       VARCHAR(255),
  url        VARCHAR(1000),
  tong INT NOT NULL DEFAULT 0, moi INT NOT NULL DEFAULT 0, trung INT NOT NULL DEFAULT 0,
  gan  INT NOT NULL DEFAULT 0, cho_gan INT NOT NULL DEFAULT 0, bo_qua INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- =====================================================================
--  VIEW hỗ trợ báo cáo
-- =====================================================================
-- Thời gian hồ sơ nằm ở từng trạng thái — suy ra từ timeline (thay cho cột bắt đầu/kết thúc đã loại bỏ)
CREATE OR REPLACE VIEW V_THOI_GIAN_TRANG_THAI AS
SELECT ma_ho_so_ung_vien, trang_thai_moi, thoi_diem_thay_doi AS tu_luc,
       LEAD(thoi_diem_thay_doi) OVER w AS den_luc,
       TIMESTAMPDIFF(HOUR, thoi_diem_thay_doi, COALESCE(LEAD(thoi_diem_thay_doi) OVER w, UTC_TIMESTAMP(3))) AS so_gio
FROM LICH_SU_TRANG_THAI
WINDOW w AS (PARTITION BY ma_ho_so_ung_vien ORDER BY thoi_diem_thay_doi);

-- Ứng viên được phép lọc/đề cử (BR6-7) — loại người đã nhận việc / lưu trữ
CREATE OR REPLACE VIEW V_UNG_VIEN_DE_CU AS
SELECT * FROM UNG_VIEN WHERE trang_thai = 'Hoạt động';

-- Tỷ lệ chuyển đổi theo mốc trạng thái đã đạt (BR12-2)
CREATE OR REPLACE VIEW V_CHUYEN_DOI AS
SELECT h.ma_chi_tiet_du_an,
       COUNT(DISTINCT h.ma_ho_so_ung_vien) AS so_ho_so,
       COUNT(DISTINCT CASE WHEN l.trang_thai_moi = 'Đề cử'     THEN h.ma_ho_so_ung_vien END) AS dat_de_cu,
       COUNT(DISTINCT CASE WHEN l.trang_thai_moi = 'Phỏng vấn' THEN h.ma_ho_so_ung_vien END) AS dat_phong_van,
       COUNT(DISTINCT CASE WHEN l.trang_thai_moi = 'Thử việc'  THEN h.ma_ho_so_ung_vien END) AS dat_thu_viec
FROM HO_SO_UNG_TUYEN h LEFT JOIN LICH_SU_TRANG_THAI l ON l.ma_ho_so_ung_vien = h.ma_ho_so_ung_vien
GROUP BY h.ma_chi_tiet_du_an;

-- Tiến độ theo vị trí (BR4-5)
CREATE OR REPLACE VIEW V_TIEN_DO_VI_TRI AS
SELECT c.ma_chi_tiet_du_an, c.vi_tri, c.so_luong, c.han_hoan_thanh, c.trang_thai,
       SUM(h.trang_thai = 'Thử việc') AS da_nhan_viec,
       LEAST(100, ROUND(100 * SUM(h.trang_thai = 'Thử việc') / c.so_luong)) AS tien_do
FROM CHI_TIET_DU_AN c LEFT JOIN HO_SO_UNG_TUYEN h ON h.ma_chi_tiet_du_an = c.ma_chi_tiet_du_an
GROUP BY c.ma_chi_tiet_du_an;
