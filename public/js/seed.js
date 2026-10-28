/* ==========================================================
   seed.js — Dữ liệu mẫu. Mọi hồ sơ được "chạy" qua chính các
   hàm nghiệp vụ (Svc) với đồng hồ lùi ngày → dữ liệu nhất quán,
   lịch sử trạng thái đầy đủ như vận hành thật.
   ========================================================== */
const Seed = (() => {
  let s = 20261028;
  const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Trịnh'];
  const DEM_NAM = ['Văn', 'Minh', 'Quốc', 'Đức', 'Hoàng', 'Thành', 'Gia', 'Hữu', 'Tuấn', 'Anh'];
  const DEM_NU = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Phương', 'Minh', 'Bảo', 'Khánh', 'Mai', 'Hồng'];
  const TEN_NAM = ['Long', 'Nam', 'Huy', 'Khoa', 'Phúc', 'Dũng', 'Tùng', 'Sơn', 'Hải', 'Trung', 'Quân', 'Bình', 'Kiên', 'Tài', 'Đạt', 'Vinh'];
  const TEN_NU = ['Linh', 'Trang', 'Hà', 'Ngân', 'Vy', 'Hương', 'Lan', 'Nhung', 'Thảo', 'Yến', 'Chi', 'My', 'Quỳnh', 'Hạnh', 'Giang', 'Trâm'];
  const SKILLS = {
    1: ['Java', 'Spring Boot', 'ReactJS', 'NodeJS', 'SQL', 'Docker', 'AWS', 'Microservices', 'TypeScript', 'Kubernetes', 'Python'],
    2: ['Kế toán quản trị', 'IFRS', 'Báo cáo tài chính', 'Phân tích tín dụng', 'Excel nâng cao', 'SAP FI', 'Thuế', 'Kiểm toán'],
    3: ['B2B Sales', 'Quản lý kênh', 'Đàm phán', 'Phát triển thị trường', 'CRM', 'Key Account', 'Bán lẻ', 'Quản lý cửa hàng'],
    4: ['Digital Marketing', 'SEO', 'Facebook Ads', 'Brand Management', 'Content', 'Google Analytics', 'Trade Marketing'],
    5: ['Tuyển dụng', 'C&B', 'Luật lao động', 'Đào tạo', 'HRBP'],
    6: ['QA/QC', 'ISO 9001', 'Lean', '6 Sigma', 'Kaizen', 'AutoCAD', 'Quản lý ca', 'Bảo trì', 'IATF 16949'],
    7: ['Python', 'Machine Learning', 'SQL', 'Power BI', 'TensorFlow', 'Data Pipeline', 'Thống kê'],
    8: ['Logistics', 'Quản lý kho', 'WMS', 'Điều phối vận tải', 'Xuất nhập khẩu', 'Supply Chain'],
  };
  const EDU = ['Cử nhân – ĐH Kinh tế Quốc dân', 'Kỹ sư – ĐH Bách khoa Hà Nội', 'Cử nhân – ĐH Ngoại thương', 'Kỹ sư – ĐH Bách khoa TP.HCM', 'Cử nhân – ĐH Kinh tế TP.HCM', 'Thạc sĩ – ĐH Quốc gia Hà Nội', 'Cử nhân – Học viện Tài chính', 'Kỹ sư – ĐH Đà Nẵng', 'Cao đẳng – CĐ Kinh tế Đối ngoại'];
  const strip = (x) => norm(x).replace(/[^a-z]/g, '');
  const person = () => {
    const nam = rand() < 0.55; const ten = pick(nam ? TEN_NAM : TEN_NU);
    return { ho_ten: `${pick(HO)} ${pick(nam ? DEM_NAM : DEM_NU)} ${ten}`, gioi_tinh: nam ? 'Nam' : 'Nữ' };
  };
  const contact = (p) => {
    const parts = p.ho_ten.split(' '); const base = strip(parts.at(-1)) + '.' + strip(parts[0]) + int(80, 999);
    return { email: base + pick(['@gmail.com', '@gmail.com', '@outlook.com', '@yahoo.com']), so_dien_thoai: '0' + pick(['9', '3', '8', '7']) + int(10000000, 99999999) };
  };
  const skillsFor = (cm, n = 3) => { const a = [...(SKILLS[cm] || SKILLS[1])]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out.join(', '); };

  function fakeApplicant(code, reuseExisting) {
    if (reuseExisting && Store.db?.ung_vien?.length) { const u = pick(Store.db.ung_vien); return { ho_ten: u.ho_ten, email: u.email, so_dien_thoai: u.so_dien_thoai, ma_tin_kenh: code, cv: 'CV_' + strip(u.ho_ten) + '_moi.pdf' }; }
    const p = person(); const c = contact(p); const cm = int(1, 8);
    const raw = rand() < 0.5 ? p.ho_ten.toUpperCase() : p.ho_ten.toLowerCase(); // dữ liệu cào về chưa chuẩn hóa
    return { ho_ten: raw, ...c, gioi_tinh: rand() < 0.6 ? p.gioi_tinh : null, nam_sinh: rand() < 0.7 ? int(1984, 2002) : null, so_nam_kinh_nghiem: rand() < 0.7 ? int(0, 14) : null,
      ky_nang: skillsFor(cm, int(2, 4)).toLowerCase(), ma_tin_kenh: code, cv: 'CV_' + strip(p.ho_ten) + '.pdf', tieu_de: pick(['Ứng tuyển vị trí', 'Hồ sơ ứng tuyển', 'Apply']) + ' ' + code };
  }
  const fakeJobCode = (k) => (k.tien_to || 'JOB') + '-' + int(10000, 99999);

  function build() {
    s = 20261028; // dữ liệu mẫu ổn định giữa các lần khôi phục
    const savedUser = Auth.user; Store.db = Store.empty(); App.seeding = true;
    const at = (daysAgo, h = 9, m = 0) => { const d = new Date(); d.setDate(d.getDate() - Math.floor(daysAgo)); d.setHours(h, m + Math.round((daysAgo % 1) * 600) % 60, 0, 0); App.clock = Math.min(d.getTime(), Date.now() - 5 * 60000); };
    const ins = (t, row) => Store.insert(t, row);

    /* --- Danh mục dùng chung --- */
    ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Bình Dương'].forEach((ten) => ins('khu_vuc', { ten }));
    ['Công nghệ thông tin', 'Tài chính - Ngân hàng', 'Bán lẻ', 'Sản xuất - Ô tô', 'Hàng tiêu dùng (FMCG)', 'Logistics', 'Dược phẩm - Y tế'].forEach((ten) => ins('linh_vuc', { ten }));
    ['Thực tập sinh', 'Nhân viên', 'Trưởng nhóm', 'Quản lý', 'Giám đốc'].forEach((ten, i) => ins('cap_bac', { ten, bac: i + 1 }));
    ['Công nghệ thông tin', 'Kế toán - Tài chính', 'Kinh doanh - Sales', 'Marketing', 'Nhân sự', 'Sản xuất - Kỹ thuật', 'Data - AI', 'Logistics - Chuỗi cung ứng'].forEach((ten) => ins('chuyen_mon', { ten }));

    /* --- Nhân sự (mật khẩu demo: 123456) --- */
    const pw = hashPw('123456');
    const NS = (ho_ten, ten_dang_nhap, vai_tro, chuc_vu, kv, email, tt = 'Đang làm việc') => ins('nhan_su', { ho_ten, ten_dang_nhap, mat_khau: pw, email, so_dien_thoai: '09' + int(10000000, 99999999), chuc_vu, vai_tro, ma_khu_vuc: kv, trang_thai_lam_viec: tt });
    const admin = NS('Nguyễn Quản Trị', 'admin', ROLES.ADMIN, 'Chuyên viên IT', 1, 'admin@navigosgroup.com');
    const gd = NS('Trần Minh Đức', 'giamdoc', ROLES.BGD, 'Giám đốc Navigos Search', 1, 'duc.tran@navigosgroup.com');
    const tn = NS('Dương Kim Chi', 'truongnhom', ROLES.TN, 'Trưởng nhóm tư vấn tuyển dụng', 1, 'chi.duong@navigosgroup.com');
    const tram = NS('Đào Bích Trâm', 'nhanvien', ROLES.NV, 'Senior Consultant', 1, 'tram.dao@navigosgroup.com');
    const ha = NS('Phạm Thu Hà', 'thuha', ROLES.NV, 'Consultant', 1, 'ha.pham@navigosgroup.com');
    const phuc = NS('Lê Hoàng Phúc', 'hoangphuc', ROLES.NV, 'Senior Consultant', 2, 'phuc.le@navigosgroup.com');
    const tam = NS('Võ Thanh Tâm', 'thanhtam', ROLES.NV, 'Consultant', 2, 'tam.vo@navigosgroup.com');
    const bao = NS('Ngô Gia Bảo', 'giabao', ROLES.NV, 'Consultant', 3, 'bao.ngo@navigosgroup.com');
    NS('Hồ Văn Khải', 'vankhai', ROLES.NV, 'Consultant', 2, 'khai.ho@navigosgroup.com', 'Đã nghỉ việc');
    NS('Lý Thanh Nga', 'thanhnga', ROLES.TN, 'Trưởng nhóm tư vấn (HCM)', 2, 'nga.ly@navigosgroup.com');

    /* --- Kênh đăng tuyển --- */
    const K = (ten_kenh, ten_mien, tien_to, mo_ta, loai = 'ngoai') => ins('kenh_dang_tuyen', { ten_kenh, ten_mien, tien_to, mo_ta, trang_thai: 'Hoạt động', loai });
    const vnw = K('VietnamWorks', 'vietnamworks.com', 'VNW', 'Cổng việc làm của Navigos Group — đồng bộ qua API nội bộ');
    const topcv = K('TopCV', 'topcv.vn', 'TCV', 'Thu thập hồ sơ apply qua trình thu thập (crawler) theo mã tin');
    const lkd = K('LinkedIn', 'linkedin.com', 'LKD', 'LinkedIn Jobs — nhận hồ sơ Easy Apply');
    const nvs = K('Navigos Search Website', 'navigossearch.com', 'NVS', 'Form ứng tuyển trên website Navigos Search');
    K('Facebook Jobs', 'facebook.com', 'FBJ', 'Nhóm tuyển dụng Facebook — thu thập bằng crawler');
    K('Kho dữ liệu nội bộ', '', 'INT', 'Kho ứng viên sẵn có của công ty (đã gắn ID nguồn tuyển)', 'noi_bo');

    /* --- Khách hàng --- */
    Auth.user = tram; at(120);
    const KH = (ten_cong_ty, lv, nguoi_lien_he, email, so_dien_thoai, dia_chi) => Svc.saveCustomer({ ten_cong_ty, ma_linh_vuc: lv, nguoi_lien_he, email, so_dien_thoai, dia_chi }).row;
    const finnext = KH('Công ty CP Phần mềm FinNext', 1, 'Bà Nguyễn Thu Trang (HR Manager)', 'hr@finnext.vn', '02438123456', 'Tòa Keangnam, Nam Từ Liêm, Hà Nội');
    const phuongnam = KH('Công ty CP Bán lẻ Phương Nam', 3, 'Ông Trần Quốc Việt (Talent Lead)', 'tuyendung@phuongnamretail.vn', '02838223344', 'Quận 7, TP. Hồ Chí Minh');
    const hungthinh = KH('Ngân hàng TMCP Hưng Thịnh', 2, 'Bà Lê Minh Châu (Giám đốc Nhân sự)', 'nhansu@hungthinhbank.vn', '02439998877', 'Hoàn Kiếm, Hà Nội');
    const saoviet = KH('Công ty CP Ô tô Sao Việt', 4, 'Ông Phạm Đức Anh (HR Director)', 'hr@saovietauto.vn', '02743556677', 'KCN VSIP, Bình Dương');
    const anhduong = KH('Công ty CP Công nghệ Ánh Dương AI', 1, 'Bà Đỗ Hải Yến (People Ops)', 'people@anhduong.ai', '02437776655', 'Cầu Giấy, Hà Nội');
    const dongduong = KH('Công ty TNHH Logistics Đông Dương', 6, 'Ông Võ Minh Tuấn (Operations)', 'hr@dongduonglogistics.vn', '02363889900', 'Liên Chiểu, Đà Nẵng');
    const megafood = KH('Công ty CP MegaFood Việt Nam', 5, 'Bà Hoàng Bảo Ngọc (TA Manager)', 'careers@megafood.vn', '02836667788', 'Quận 1, TP. Hồ Chí Minh');
    const ankhang = KH('Công ty CP Dược phẩm An Khang', 7, 'Ông Bùi Thế Vinh', 'hr@ankhangpharma.vn', '02437112233', 'Đống Đa, Hà Nội');
    ankhang.trang_thai_hop_tac = 'Ngừng hợp tác';

    /* --- Kho ứng viên sẵn có (đã chuẩn hóa, nguồn: kho nội bộ / các kênh) --- */
    const kvByCm = { 1: [1, 1, 2], 2: [1, 1, 2], 3: [2, 2, 1, 3], 4: [2, 1], 5: [1, 2], 6: [5, 2, 4], 7: [1, 1, 2], 8: [3, 3, 2, 4] };
    const lvByCm = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 2, 6: 4, 7: 1, 8: 6 };
    const pool = (n, cm, cbRange = [2, 4], expRange = [1, 12], days = [40, 220]) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        at(int(days[0], days[1]));
        const p = person(); const c = contact(p); const exp = int(expRange[0], expRange[1]);
        out.push(ins('ung_vien', { ma_linh_vuc: rand() < 0.75 ? lvByCm[cm] : int(1, 7), ma_cap_bac: int(cbRange[0], cbRange[1]), ma_chuyen_mon: cm, ma_khu_vuc: pick(kvByCm[cm]), ma_nhan_su: pick([tram.id, ha.id, phuc.id, tam.id, bao.id]),
          ...p, nam_sinh: now().getFullYear() - (22 + exp + int(0, 4)), ...c, dia_chi: '', trinh_do_hoc_van: pick(EDU), so_nam_kinh_nghiem: exp, ky_nang: skillsFor(cm, int(3, 5)),
          nguon: pick(['Kho dữ liệu nội bộ', 'VietnamWorks', 'LinkedIn', 'TopCV', 'Navigos Search Website']), cv_dinh_kem: 'CV_' + strip(p.ho_ten) + '.pdf', ghi_chu: '', trang_thai: ST.UV.HD, ngay_tao: nowISO() }));
      }
      return out;
    };
    const P = { 1: pool(16, 1), 2: pool(10, 2), 3: pool(12, 3), 4: pool(6, 4), 5: pool(3, 5), 6: pool(9, 6), 7: pool(6, 7), 8: pool(8, 8, [1, 3], [0, 8]) };
    P[2].push(...pool(2, 2, [5, 5], [15, 22])); P[3].push(...pool(2, 3, [4, 4], [8, 14]));
    // Nhân vật kịch bản demo
    at(90);
    const long = ins('ung_vien', { ma_linh_vuc: 1, ma_cap_bac: 3, ma_chuyen_mon: 1, ma_khu_vuc: 1, ma_nhan_su: tram.id, ho_ten: 'Nguyễn Hoàng Long', gioi_tinh: 'Nam', nam_sinh: now().getFullYear() - 31,
      email: 'long.nguyenhoang@gmail.com', so_dien_thoai: '0912345678', dia_chi: 'Cầu Giấy, Hà Nội', trinh_do_hoc_van: 'Kỹ sư – ĐH Bách khoa Hà Nội', so_nam_kinh_nghiem: 7, ky_nang: 'Java, Spring Boot, Python, SQL, Machine Learning, Microservices',
      nguon: 'LinkedIn', cv_dinh_kem: 'CV_NguyenHoangLong.pdf', ghi_chu: 'Ứng viên tiềm năng — quan tâm vị trí backend/data', trang_thai: ST.UV.HD, ngay_tao: nowISO() });
    // Ứng viên đã lưu trữ do hết nhu cầu (minh họa vòng đời)
    const old = P[3].pop(); old.trang_thai = ST.UV.LT; old.ghi_chu = 'Lưu trữ: ứng viên báo đã có việc ổn định, không muốn nhận liên hệ';

    /* --- Tạo dự án / vị trí / tin đăng / phân công --- */
    const project = (kh, ten, daysAgo, note = '') => { Auth.user = tram; at(daysAgo); return Svc.saveProject({ ma_khach_hang: kh.id, ten_du_an: ten, ngay_bat_dau: todayStr(), ghi_chu: note }).row; };
    const position = (da, o) => {
      Auth.user = o.creator || o.staff?.[0] || tn; at(o.ago);
      const dl = new Date(); dl.setDate(dl.getDate() + o.due);
      const r = Svc.savePosition({ ma_du_an: da.id, vi_tri: o.vi_tri, mo_ta_cong_viec: o.mo_ta, so_luong: o.sl, hinh_thuc: o.ht || 'Toàn thời gian', muc_luong_toi_da: o.luong, han_hoan_thanh: toDateStr(dl), ma_cap_bac: o.cb, ma_chuyen_mon: o.cm, ma_khu_vuc: o.kv });
      const ct = r.row;
      if (o.staff) { Auth.user = tn; at(o.ago - 1, 10); Svc.assign(ct.id, o.staff.map((x) => x.id)); }
      (o.kenh || []).forEach((k, i) => { Auth.user = o.staff?.[0] || tram; at(o.ago - 1, 14 + i); Svc.attachPosting(ct.id, { ma_kenh: k.id, ma_tin_kenh: fakeJobCode(k), ngay_dang: '' }); });
      return ct;
    };
    const applyTo = (ct, n, fromAgo, toAgo) => {
      const tins = DB.tin_dang.filter((t) => t.ma_chi_tiet_du_an === ct.id); if (!tins.length) return [];
      const out = [];
      for (let i = 0; i < n; i++) {
        at(fromAgo - (i * (fromAgo - toAgo)) / Math.max(1, n), int(8, 21));
        const t = pick(tins); const k = Store.get('kenh_dang_tuyen', t.ma_kenh);
        const r = Svc.ingest(fakeApplicant(t.ma_tin_kenh, false), k); if (r.hs) out.push(r.hs);
      }
      return out;
    };
    /** Chuẩn hóa nhanh hồ sơ cào về để dùng trong luồng đề cử */
    const tagLike = (uv, ct, staff) => {
      uv.ho_ten = uv.ho_ten.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
      Object.assign(uv, { ma_chuyen_mon: ct.ma_chuyen_mon, ma_cap_bac: ct.ma_cap_bac, ma_khu_vuc: ct.ma_khu_vuc, ma_linh_vuc: Q.khOfCt(ct).ma_linh_vuc, ma_nhan_su: staff.id,
        so_nam_kinh_nghiem: uv.so_nam_kinh_nghiem ?? int(2, 9), nam_sinh: uv.nam_sinh ?? now().getFullYear() - int(25, 38), trinh_do_hoc_van: uv.trinh_do_hoc_van || pick(EDU), ky_nang: skillsFor(ct.ma_chuyen_mon, 4), gioi_tinh: uv.gioi_tinh || pick(['Nam', 'Nữ']) });
    };
    let hourSlot = 8;
    /** Đưa một ứng viên đi qua quy trình tới trạng thái đích */
    const drive = (ct, uv, target, startAgo, dot = 'Đợt 1') => {
      const staff = Q.assignees(ct.id)[0] || tram; const steps = { decu_cho: 1, decu_sua: 2, decu_duyet: 2, decu_gui: 3, decu_dongy: 4, loai_kh: 4, pv_len: 5, pv_dat: 6, pv_khong: 6, pv_them: 6, tv: 7, tu_choi_offer: 7, tv_fail: 8 }[target];
      const gap = Math.max(0.35, (startAgo - 0.5) / (steps + 1)); let day = startAgo;
      const step = (who, h = 10) => { Auth.user = who; at(day, h); day -= gap; };
      step(staff, 9);
      const cb = Store.get('cap_bac', ct.ma_cap_bac).bac;
      const r = Svc.createRecommendations(ct.id, [uv.id], { dot_de_cu: dot, notice_period: pick(['15 ngày', '30 ngày', '30 ngày', '45 ngày', 'Có thể đi làm ngay']), per: { [uv.id]: { salary: (cb * 9 + int(2, 12)) * 1000000 } }, ghi_chu: pick(['Phù hợp yêu cầu JD', 'Kinh nghiệm đúng ngành', 'Ứng viên chủ động, giao tiếp tốt', '']) });
      if (!r.ok) return null; const dc = r.created[0]; const hs = Q.hs(dc.ma_ho_so_ung_vien);
      if (target === 'decu_cho') return hs;
      step(tn, 15);
      if (target === 'decu_sua') { Svc.requestEdit(dc.id, pick(['Bổ sung mức lương mong muốn và lý do nghỉ việc', 'Kinh nghiệm quản lý chưa rõ, cần làm rõ quy mô team'])); return hs; }
      Svc.approveRecommendation(dc.id); if (target === 'decu_duyet') return hs;
      step(staff, 9); Svc.sendToClient([dc.id]); if (target === 'decu_gui') return hs;
      step(staff, 16);
      if (target === 'loai_kh') { Svc.clientFeedback(dc.id, 'Từ chối ứng viên', pick(['Kỳ vọng lương vượt ngân sách', 'Chưa có kinh nghiệm quy mô tương đương', 'Khách hàng ưu tiên ứng viên khác'])); return hs; }
      Svc.clientFeedback(dc.id, 'Đồng ý phỏng vấn'); if (target === 'decu_dongy') return hs;
      // lên lịch phỏng vấn
      Auth.user = staff; at(day, 11);
      const future = target === 'pv_len'; const ivDay = new Date(); if (future) ivDay.setDate(ivDay.getDate() + int(0, 4)); else { ivDay.setTime(App.clock); ivDay.setDate(ivDay.getDate() + 1); }
      let ok = null;
      for (let k = 0; k < 8 && !ok?.ok; k++) { hourSlot = hourSlot >= 16 ? 8 : hourSlot + 1; const off = rand() < 0.5;
        ok = Svc.saveInterview(hs.id, { ngay: toDateStr(ivDay), gio_bd: `${pad(hourSlot)}:00`, gio_kt: `${pad(hourSlot)}:45`, hinh_thuc: off ? 'Trực tiếp' : 'Trực tuyến', dia_diem_link: off ? `Văn phòng ${Q.khOfCt(ct).ten_cong_ty.replace(/^Công ty (CP|TNHH) /, '')} — ${Store.name('khu_vuc', ct.ma_khu_vuc)}` : `https://meet.google.com/${strip(uv.ho_ten).slice(0, 3)}-${int(1000, 9999)}-nvg`, ma_nhan_su: staff.id, nguoi_tham_gia: `${staff.ho_ten} (Navigos), ${Q.khOfCt(ct).nguoi_lien_he}` }); }
      if (future) return hs;
      const lich = Q.lichOfHs(hs.id).at(-1); App.clock = new Date(lich.thoi_gian_ket_thuc).getTime() + 3600000; Auth.user = staff;
      const kq = { pv_khong: 'Không đạt', pv_them: 'Cần phỏng vấn thêm' }[target] || 'Đạt';
      Svc.interviewResult(lich.id, { ket_qua: kq, diem_danh_gia: kq === 'Đạt' ? (int(75, 95) / 10).toFixed(1) : (int(40, 62) / 10).toFixed(1), nhan_xet: kq === 'Đạt' ? 'Chuyên môn vững, phù hợp văn hóa' : 'Chưa đáp ứng kỳ vọng về chuyên môn',
        feedback: kq === 'Đạt' ? 'Khách hàng đánh giá cao, muốn đẩy nhanh offer' : 'Khách hàng chưa thấy phù hợp với team' });
      if (['pv_dat', 'pv_khong', 'pv_them'].includes(target)) return hs;
      day = Math.max(0.2, (new Date() - App.clock) / DAY - 1.5); step(staff, 14);
      const nv = new Date(App.clock); nv.setDate(nv.getDate() + 14);
      if (target === 'tu_choi_offer') { Svc.hiringResult(hs.id, { ket_qua: 'Từ chối offer', ly_do_tu_choi: 'Ứng viên nhận counter-offer từ công ty hiện tại', ngay_khach_hang_bao: todayStr(), email_xac_nhan: 'Email_KH_ketqua_' + Code.hs(hs.id) + '.eml' }); return hs; }
      Svc.hiringResult(hs.id, { ket_qua: 'Chấp nhận offer', ngay_nhan_viec: toDateStr(nv), ngay_khach_hang_bao: todayStr(), email_xac_nhan: 'Email_KH_xacnhan_' + Code.hs(hs.id) + '.eml' });
      if (target === 'tv_fail') { at(Math.max(0.3, day - 1), 17); Svc.probationFailed(hs.id, 'Khách hàng báo ứng viên không đạt thử việc sau 3 tuần — chưa thích nghi môi trường'); }
      return hs;
    };
    const fromPool = (cm, n, exclude = []) => { const c = P[cm].filter((u) => u.trang_thai === ST.UV.HD && !exclude.includes(u.id) && !DB.ho_so_ung_tuyen.some((h) => h.ma_ung_vien === u.id && HS_ACTIVE.concat(ST.HS.TV).includes(h.trang_thai))); return c.slice(0, n); };
    const run = (ct, plan, startAgo, applyN = 0, late = 0) => {
      const applied = applyTo(ct, applyN, startAgo, startAgo - 1.5).map((h) => Q.uv(h.ma_ung_vien));
      const staff = Q.assignees(ct.id)[0] || tram; let i = 0, idx = 0;
      Object.entries(plan).forEach(([target, n]) => { for (let k = 0; k < n; k++) {
        let uv = applied[i++]; if (uv) tagLike(uv, ct, staff); else uv = fromPool(ct.ma_chuyen_mon, 1)[0]; if (!uv) continue;
        drive(ct, uv, target, startAgo - 2 - idx++ * 0.6);
      } });
      if (late) applyTo(ct, late, Math.min(startAgo - 3, 12), 0.5); // hồ sơ apply rải rác gần đây (chưa xử lý)
    };

    // DA1 — FinNext (Hà Nội, CNTT)
    const da1 = project(finnext, 'Tuyển dụng khối Công nghệ 2026', 48, 'Ưu tiên ứng viên từng làm sản phẩm fintech');
    const ct1 = position(da1, { ago: 42, due: 12, vi_tri: 'Senior Java Backend Engineer', mo_ta: 'Phát triển hệ thống thanh toán, Java Spring Boot, microservices, SQL.', sl: 2, luong: 60000000, cb: 3, cm: 1, kv: 1, staff: [tram], kenh: [vnw, lkd] });
    const ct2 = position(da1, { ago: 36, due: 2, vi_tri: 'Frontend Developer (ReactJS)', mo_ta: 'Xây dựng giao diện web app với ReactJS, TypeScript.', sl: 3, luong: 35000000, cb: 2, cm: 1, kv: 1, staff: [tram, ha], kenh: [topcv, vnw] });
    // DA2 — Phương Nam (HCM, Bán lẻ)
    const da2 = project(phuongnam, 'Mở rộng mạng lưới bán lẻ miền Nam', 58);
    const ct3 = position(da2, { ago: 52, due: -3, vi_tri: 'Regional Sales Manager', mo_ta: 'Quản lý doanh số khu vực, phát triển kênh phân phối, đàm phán.', sl: 1, luong: 70000000, cb: 4, cm: 3, kv: 2, staff: [phuc], kenh: [vnw] });
    const ct4 = position(da2, { ago: 20, due: 20, vi_tri: 'Store Manager', mo_ta: 'Vận hành cửa hàng bán lẻ, quản lý đội ngũ bán hàng.', sl: 2, luong: 25000000, cb: 3, cm: 3, kv: 2, staff: [tam], kenh: [topcv, nvs] });
    // DA3 — Hưng Thịnh (HN, Ngân hàng)
    const da3 = project(hungthinh, 'Tuyển dụng nhân sự cấp cao & tín dụng 2026', 62, 'Yêu cầu bảo mật thông tin vị trí cấp cao');
    const ct5 = position(da3, { ago: 58, due: 10, vi_tri: 'Giám đốc Khối Tài chính (CFO)', mo_ta: 'Hoạch định tài chính, IFRS, quản trị rủi ro.', sl: 1, luong: 150000000, cb: 5, cm: 2, kv: 1, staff: [ha], kenh: [nvs, lkd] });
    const ct6 = position(da3, { ago: 28, due: 15, vi_tri: 'Chuyên viên Phân tích Tín dụng', mo_ta: 'Thẩm định khách hàng doanh nghiệp, phân tích báo cáo tài chính.', sl: 4, luong: 22000000, cb: 2, cm: 2, kv: 1, staff: [ha], kenh: [vnw, topcv] });
    // DA4 — Sao Việt (Bình Dương, Sản xuất) — mới tiếp nhận, chờ phân công
    const da4 = project(saoviet, 'Dự án nhà máy Bình Dương — giai đoạn 2', 7);
    position(da4, { ago: 6, due: 30, vi_tri: 'Kỹ sư Chất lượng (QA/QC)', mo_ta: 'Kiểm soát chất lượng linh kiện ô tô theo IATF 16949.', sl: 2, luong: 28000000, cb: 2, cm: 6, kv: 5 });
    position(da4, { ago: 3, due: 35, vi_tri: 'Trưởng ca sản xuất', mo_ta: 'Điều hành ca sản xuất, Lean, Kaizen.', sl: 3, luong: 24000000, cb: 3, cm: 6, kv: 5 });
    // DA5 — Ánh Dương AI (HN)
    const da5 = project(anhduong, 'AI & Data Team 2026', 18);
    const ct9 = position(da5, { ago: 16, due: 25, vi_tri: 'Data Scientist', mo_ta: 'Xây dựng mô hình Machine Learning, Python, SQL.', sl: 1, luong: 55000000, cb: 3, cm: 7, kv: 1, staff: [tram], kenh: [lkd] });
    // DA6 — Đông Dương (Đà Nẵng)
    const da6 = project(dongduong, 'Logistics Hub Đà Nẵng', 50);
    const ct10 = position(da6, { ago: 46, due: 5, vi_tri: 'Logistics Supervisor', mo_ta: 'Giám sát vận hành kho và vận tải.', sl: 2, luong: 20000000, cb: 3, cm: 8, kv: 3, staff: [bao], kenh: [topcv] });
    const ct11 = position(da6, { ago: 13, due: 1, vi_tri: 'Nhân viên Điều phối kho', mo_ta: 'Điều phối nhập xuất kho, WMS.', sl: 3, luong: 12000000, cb: 2, cm: 8, kv: 3, staff: [bao], kenh: [topcv, vnw] });
    // DA7 — MegaFood (HCM)
    const da7 = project(megafood, 'Marketing FMCG 2026', 40);
    const ct12 = position(da7, { ago: 38, due: 8, vi_tri: 'Brand Manager', mo_ta: 'Quản lý thương hiệu ngành hàng thực phẩm.', sl: 1, luong: 45000000, cb: 4, cm: 4, kv: 2, staff: [tam], kenh: [vnw, lkd] });
    const ct13 = position(da7, { ago: 11, due: 18, vi_tri: 'Digital Marketing Executive', mo_ta: 'Triển khai chiến dịch digital, Facebook Ads, SEO.', sl: 2, luong: 18000000, cb: 2, cm: 4, kv: 2, staff: [tam], kenh: [topcv] });

    /* --- Chạy quy trình cho từng vị trí --- */
    run(ct5, { tv: 1, loai_kh: 2 }, 55, 2);
    run(ct12, { tv: 1, pv_khong: 1 }, 35, 3);
    run(ct3, { tu_choi_offer: 1, loai_kh: 2, pv_dat: 1, decu_gui: 1 }, 48, 3, 2);
    run(ct1, { tv: 1, pv_len: 1, decu_gui: 1, loai_kh: 1, decu_cho: 1 }, 38, 6, 3);
    run(ct2, { tv: 2, pv_khong: 1, decu_dongy: 1, decu_sua: 1 }, 32, 5, 3);
    run(ct6, { tv_fail: 1, tv: 1, pv_dat: 1, decu_cho: 1 }, 26, 6, 3);
    run(ct9, { decu_cho: 1, pv_len: 1 }, 14, 2, 2);
    run(ct11, { decu_gui: 2, decu_duyet: 1 }, 11, 4, 3);
    run(ct13, { decu_dongy: 1, pv_them: 1 }, 9, 3, 3);
    run(ct4, { decu_cho: 2, decu_duyet: 1, pv_len: 1 }, 17, 3, 2);
    run(ct10, {}, 40, 3); Auth.user = bao; at(9, 16); Svc.closePosition(ct10.id, 'dong', 'Khách hàng tạm dừng tuyển do tái cấu trúc vận hành');
    // Kịch bản demo: Long đang ở 2 dự án — Đạt PV tại FinNext, đồng thời đã được duyệt đề cử tại Ánh Dương AI
    drive(ct1, long, 'pv_dat', 12); drive(ct9, long, 'decu_duyet', 6);

    /* --- Hồ sơ cào về gần đây: vài hồ sơ chờ gán (mã tin không khớp), vài hồ sơ chưa chuẩn hóa --- */
    Auth.user = null; at(1, 7);
    [vnw, topcv].forEach((k) => { for (let i = 0; i < 2; i++) Svc.ingest(fakeApplicant(fakeJobCode(k), false), k); });
    at(0.2, 7, 30); App.clock = Math.min(App.clock, Date.now() - 600000);
    Svc.runSync(null, { count: 2 });
    DB._sync_log[0].nguoi = 'Hệ thống (lịch tự động 07:30)';

    recalcAll();
    App.clock = null; App.seeding = false; Auth.user = savedUser;
    return Store.db;
  }

  return { build, fakeApplicant, fakeJobCode, rand, pick, int };
})();
