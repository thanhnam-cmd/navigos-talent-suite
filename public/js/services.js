/* ==========================================================
   services.js — Tầng nghiệp vụ (tương ứng Controller/Service phía Server)
   Mỗi hàm trả về { ok: true, ... } hoặc { ok: false, error | errors }
   Mã quy tắc (BRx-y) bám theo đặc tả Use Case — Chương 3.
   ========================================================== */
const ST = {
  CT: { MOI: 'Mới tiếp nhận', DANG: 'Đang thực hiện', XONG: 'Hoàn thành', DONG: 'Đã đóng', HUY: 'Đã hủy' },
  HS: { APPLY: 'Mới apply', DECU: 'Đề cử', PV: 'Phỏng vấn', TV: 'Thử việc', LOAI: 'Bị loại' },
  UV: { HD: 'Hoạt động', TV: 'Đang thử việc', LT: 'Lưu trữ' },
  DC: { CHO: 'Chờ duyệt', SUA: 'Cần chỉnh sửa', DUYET: 'Đã duyệt', GUI: 'Đã gửi khách hàng', GO: 'Đã gỡ' },
  LICH: { LEN: 'Đã lên lịch', XONG: 'Đã phỏng vấn', HUY: 'Đã hủy' },
};
const PC_ROLE = { PT: 'Phụ trách', HT: 'Hỗ trợ' };
const CT_CLOSED = [ST.CT.XONG, ST.CT.DONG, ST.CT.HUY];
const HS_ACTIVE = [ST.HS.APPLY, ST.HS.DECU, ST.HS.PV];
const fail = (error) => ({ ok: false, error });
const bad = (errors) => ({ ok: false, errors });

/* ---------- Truy vấn dẫn xuất ---------- */
const Q = {
  ct: (id) => Store.get('chi_tiet_du_an', id),
  da: (id) => Store.get('du_an_tuyen_dung', id),
  kh: (id) => Store.get('khach_hang', id),
  uv: (id) => Store.get('ung_vien', id),
  hs: (id) => Store.get('ho_so_ung_tuyen', id),
  ns: (id) => Store.get('nhan_su', id),
  khOfCt(ct) { return ct ? this.kh(this.da(ct.ma_du_an)?.ma_khach_hang) : null; },
  ctLabel(ct) { if (!ct) return 'Chờ gán dự án'; const kh = this.khOfCt(ct); return `${ct.vi_tri} · ${kh?.ten_cong_ty || ''}`; },
  /** Phân công theo vai trò trong dự án: "Phụ trách" (thực hiện toàn bộ nghiệp vụ) hoặc "Hỗ trợ" (chỉ phỏng vấn — Fix demo 3) */
  pcOf(ctId, role = null) { return DB.phan_cong.filter((p) => p.ma_chi_tiet_du_an === Number(ctId) && p.trang_thai === 'Đang phụ trách' && (!role || (p.vai_tro || PC_ROLE.PT) === role)); },
  assignees(ctId) { return this.pcOf(ctId, PC_ROLE.PT).map((p) => this.ns(p.ma_nhan_su)).filter(Boolean); },
  supporters(ctId) { return this.pcOf(ctId, PC_ROLE.HT).map((p) => this.ns(p.ma_nhan_su)).filter(Boolean); },
  /** Nhân sự của vị trí (phụ trách + hỗ trợ) — chỉ những người này được chọn làm nhân viên phỏng vấn */
  team(ctId) { return [...this.assignees(ctId), ...this.supporters(ctId)]; },
  /** Vai trò của người đang đăng nhập trong vị trí: 'Phụ trách' | 'Hỗ trợ' | null */
  myRole(ct) {
    if (!ct || !Auth.user) return null;
    const p = this.pcOf(ct.id).find((x) => x.ma_nhan_su === Auth.user.id);
    if (p) return p.vai_tro || PC_ROLE.PT;
    return ct.ma_nguoi_tao === Auth.user.id ? PC_ROLE.PT : null;
  },
  isSupport(ct) { return Auth.isStaff() && this.myRole(ct) === PC_ROLE.HT; },
  /** Ghi nhận / sửa kết quả phỏng vấn: người phụ trách vị trí hoặc chính nhân viên phỏng vấn buổi đó */
  canRecordIv(l) { const ct = this.ct(this.hs(l.ma_ho_so_ung_vien)?.ma_chi_tiet_du_an); return App.seeding || (Auth.isStaff() && (this.canHandleCt(ct) || l.ma_nhan_su === Auth.user.id)); },
  /** Lịch hiển thị cho người dùng: người hỗ trợ chỉ thấy buổi mình phỏng vấn */
  lichVisible(l) { const ct = this.ct(this.hs(l.ma_ho_so_ung_vien)?.ma_chi_tiet_du_an); if (!ct) return false; if (Auth.isLead() || this.canHandleCt(ct)) return true; return l.ma_nhan_su === Auth.user?.id; },
  hired(ctId) { return DB.ho_so_ung_tuyen.filter((h) => h.ma_chi_tiet_du_an === Number(ctId) && h.trang_thai === ST.HS.TV).length; },
  hsOfCt(ctId) { return DB.ho_so_ung_tuyen.filter((h) => h.ma_chi_tiet_du_an === Number(ctId)); },
  hsOfUv(uvId) { return DB.ho_so_ung_tuyen.filter((h) => h.ma_ung_vien === Number(uvId)); },
  history(hsId) { return DB.lich_su_trang_thai.filter((l) => l.ma_ho_so_ung_vien === Number(hsId)).sort((a, b) => a.thoi_diem_thay_doi.localeCompare(b.thoi_diem_thay_doi)); },
  deCuOfHs(hsId) { return DB.de_cu.filter((d) => d.ma_ho_so_ung_vien === Number(hsId)).sort((a, b) => a.ngay_tao.localeCompare(b.ngay_tao)); },
  latestDeCu(hsId) { return this.deCuOfHs(hsId).filter((d) => d.trang_thai !== ST.DC.GO).at(-1); },
  lichOfHs(hsId) { return DB.lich_phong_van.filter((l) => l.ma_ho_so_ung_vien === Number(hsId)).sort((a, b) => a.thoi_gian_bat_dau.localeCompare(b.thoi_gian_bat_dau)); },
  kqPv(lichId) { return DB.ket_qua_phong_van.find((k) => k.ma_lich === Number(lichId)); },
  feedbacks(lichId) { return DB.feedback.filter((f) => f.ma_lich === Number(lichId)); },
  kqTd(hsId) { return DB.ket_qua_tuyen_dung.find((k) => k.ma_ho_so_ung_vien === Number(hsId)); },
  /** Hồ sơ được lên lịch phỏng vấn: KH đồng ý PV (Đề cử) hoặc đang Phỏng vấn và chưa có kết quả tuyển dụng (Test demo lần 2) */
  canSchedule(h) {
    if (this.kqTd(h.id) || this.pendingIv(h)) return false;
    return h.trang_thai === ST.HS.PV || (h.trang_thai === ST.HS.DECU && this.latestDeCu(h.id)?.phan_hoi_khach_hang === 'Đồng ý phỏng vấn');
  },
  /** Buổi phỏng vấn của hồ sơ còn "Đã lên lịch" (chưa diễn ra hoặc chưa ghi nhận kết quả) — Fix demo 3 (2):
      chỉ lên lịch buổi tiếp theo khi buổi trước đã kết thúc và có kết quả */
  pendingIv(h) { return this.lichOfHs(h.id).find((l) => l.trang_thai === ST.LICH.LEN) || null; },
  /** Buổi phỏng vấn bổ sung theo yêu cầu khách hàng: vòng gần nhất đã Đạt → trả về lý do, '' nếu là vòng tiếp theo thông thường */
  extraRoundReason(h) {
    if (h.trang_thai !== ST.HS.PV) return '';
    const last = this.lichOfHs(h.id).filter((l) => l.trang_thai === ST.LICH.XONG).at(-1); if (!last) return '';
    return this.kqPv(last.id)?.ket_qua === 'Đạt' ? `Ứng viên đã Đạt vòng ${last.vong}` : '';
  },
  scheduleLabel(h) {
    if (h.trang_thai === ST.HS.DECU) return 'KH đồng ý phỏng vấn';
    const x = this.extraRoundReason(h); return x ? 'Phỏng vấn bổ sung · ' + x.replace(/^Ứng viên /, '') : 'Cần phỏng vấn thêm';
  },
  /** Các buổi khác của hồ sơ còn ở trạng thái "Đã lên lịch" */
  pendingRounds(l) { return this.lichOfHs(l.ma_ho_so_ung_vien).filter((x) => x.id !== l.id && x.trang_thai === ST.LICH.LEN); },
  lichBrief(x) { return { id: x.id, vong: x.vong, text: `Vòng ${x.vong} · ${fmtTime(x.thoi_gian_bat_dau)}–${fmtTime(x.thoi_gian_ket_thuc)} ${fmtDate(x.thoi_gian_bat_dau)} · ${Q.ns(x.ma_nhan_su)?.ho_ten || ''}` }; },
  /** Cảnh báo hạn — BR4-4 */
  deadline(ct) {
    if (!ct || CT_CLOSED.includes(ct.trang_thai)) return null;
    const d = daysUntil(ct.han_hoan_thanh);
    if (d < 0) return { level: 'red', text: `Quá hạn ${-d} ngày` };
    if (d <= 3) return { level: 'amber', text: d === 0 ? 'Đến hạn hôm nay' : `Còn ${d} ngày` };
    return null;
  },
  /** BR4-6: phạm vi dữ liệu theo vai trò */
  visibleCts() {
    if (Auth.isLead()) return DB.chi_tiet_du_an;
    const me = Auth.user.id;
    const assigned = new Set(DB.phan_cong.filter((p) => p.ma_nhan_su === me && p.trang_thai === 'Đang phụ trách').map((p) => p.ma_chi_tiet_du_an));
    return DB.chi_tiet_du_an.filter((c) => assigned.has(c.id) || c.ma_nguoi_tao === me);
  },
  /** Vị trí nhân viên được thao tác nghiệp vụ (vai trò Phụ trách) */
  handledCts() { return this.visibleCts().filter((c) => this.canHandleCt(c)); },
  /** Bảng phân quyền: chỉ nhân viên tạo vị trí mới sửa / gắn mã tin / đóng-hủy */
  isCreator(ct) { return App.seeding || (!!ct && Auth.isStaff() && ct.ma_nguoi_tao === Auth.user?.id); },
  /** Góp ý của Ban Giám đốc cho một đề cử */
  comments(dcId) { return (DB.gop_y_de_cu || []).filter((g) => g.ma_de_cu === Number(dcId)).sort((a, b) => a.ngay_gop_y.localeCompare(b.ngay_gop_y)); },
  canHandleCt(ct) { return !!ct && (Auth.isLead() || this.myRole(ct) === PC_ROLE.PT); },
  /** Chặn thao tác nghiệp vụ của nhân viên không phụ trách vị trí (kiểm tra tại máy chủ) */
  denyCt(ct) { return !App.seeding && Auth.isStaff() && !this.canHandleCt(ct) ? 'Chỉ nhân viên phụ trách vị trí này mới được thực hiện thao tác.' : null; },
  age(uv) { return uv.nam_sinh ? now().getFullYear() - uv.nam_sinh : null; },
  isNormalized(uv) { return !!uv.ma_nhan_su; },
  /* ---------- Xếp lịch phỏng vấn — BR10-2, BR10-5, BR10-6 ---------- */
  RULE_DEFAULTS: { khoang_nghi_phut: 60, di_chuyen_phut: 90, gio_bat_dau: '08:00', gio_ket_thuc: '18:00', canh_bao_cuoi_tuan: 1, so_buoi_toi_da: 4 },
  /** Quy tắc xếp lịch đang áp dụng (màn hình "Quy tắc xếp lịch phỏng vấn") */
  rules() { return { ...this.RULE_DEFAULTS, ...(DB.quy_tac_xep_lich?.[0] || {}) }; },
  /** Nhân viên phỏng vấn mặc định = nhân viên phụ trách dự án (ưu tiên chính người đang thao tác nếu cũng phụ trách) */
  defaultInterviewer(ct) { const a = this.team(ct.id); return a.find((n) => n.id === Auth.user?.id) || a[0] || null; },
  /** Khu vực của buổi phỏng vấn trực tiếp (chọn khi lên lịch; dữ liệu cũ lấy khu vực của vị trí); trực tuyến không cần di chuyển */
  lichRegion(l) { return l.hinh_thuc === 'Trực tiếp' ? l.ma_khu_vuc ?? this.ct(this.hs(l.ma_ho_so_ung_vien)?.ma_chi_tiet_du_an)?.ma_khu_vuc ?? null : null; },
  /** Nhận diện khu vực ghi trong địa chỉ (VD "Văn phòng … — Hà Nội", "Quận 7, TP. HCM") */
  regionInText(s) {
    const t = ' ' + norm(s).replace(/[^a-z0-9]+/g, ' ') + ' ';
    const alias = (k) => { const n = norm(k.ten).replace(/^tp\.?\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim(); return n === 'ho chi minh' ? [n, 'hcm', 'sai gon'] : [n]; };
    return DB.khu_vuc.find((k) => alias(k).some((a) => t.includes(' ' + a + ' ')))?.id ?? null;
  },
  /** Khu vực mặc định của địa điểm phỏng vấn trực tiếp: theo địa chỉ khách hàng, không rõ thì theo khu vực vị trí */
  defaultIvRegion(ct) { return this.regionInText(this.khOfCt(ct)?.dia_chi) ?? ct.ma_khu_vuc; },
  /** Phỏng vấn trực tiếp: nhân viên phỏng vấn phải cùng khu vực với địa điểm phỏng vấn */
  regionMismatch(ns, hinh_thuc, kv) {
    if (hinh_thuc !== 'Trực tiếp' || !kv || !ns || ns.ma_khu_vuc === Number(kv)) return null;
    return `${ns.ho_ten} làm việc tại ${Store.name('khu_vuc', ns.ma_khu_vuc)} — phỏng vấn trực tiếp tại ${Store.name('khu_vuc', kv)} cần nhân viên cùng khu vực.`;
  },
  /** Khoảng cách tối thiểu (phút) giữa giờ kết thúc buổi trước và giờ bắt đầu buổi sau của cùng một ứng viên */
  CANDIDATE_GAP: 60,
  /** Lịch của ỨNG VIÊN (mọi hồ sơ, mọi vị trí) trùng hoặc cách buổi đang xếp chưa đủ 60 phút */
  candidateCheck({ uvId, bd, kt, exceptId = null }) {
    const g = this.CANDIDATE_GAP * 60000;
    return DB.lich_phong_van.filter((l) => l.id !== Number(exceptId) && l.trang_thai !== ST.LICH.HUY && this.hs(l.ma_ho_so_ung_vien)?.ma_ung_vien === Number(uvId)
      && new Date(l.thoi_gian_bat_dau).getTime() < kt.getTime() + g && new Date(l.thoi_gian_ket_thuc).getTime() + g > bd.getTime());
  },
  candidateClash(l) { const ct = this.ct(this.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an); return `${fmtTime(l.thoi_gian_bat_dau)}–${fmtTime(l.thoi_gian_ket_thuc)} ngày ${fmtDate(l.thoi_gian_bat_dau)} (${ct.vi_tri} — ${this.khOfCt(ct).ten_cong_ty})`; },
  /** Kiểm tra lịch của MỘT nhân viên phỏng vấn: trùng lịch = lỗi (BR10-2), các trường hợp còn lại = cảnh báo (BR10-6) */
  scheduleCheck({ nsId, bd, kt, hinh_thuc, ctId, kv = null, exceptId = null }) {
    const R = this.rules(); const region = hinh_thuc === 'Trực tiếp' ? Number(kv) || this.ct(ctId)?.ma_khu_vuc : null;
    const mine = DB.lich_phong_van.filter((l) => l.id !== exceptId && l.ma_nhan_su === Number(nsId) && l.trang_thai !== ST.LICH.HUY);
    const conflicts = mine.filter((l) => l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_bat_dau) < kt && new Date(l.thoi_gian_ket_thuc) > bd);
    const label = (l) => `${fmtTime(l.thoi_gian_bat_dau)}–${fmtTime(l.thoi_gian_ket_thuc)} với ${this.uv(this.hs(l.ma_ho_so_ung_vien).ma_ung_vien).ho_ten}`;
    const sameDay = mine.filter((l) => toDateStr(l.thoi_gian_bat_dau) === toDateStr(bd));
    const warnings = [];
    sameDay.filter((l) => !conflicts.includes(l)).forEach((l) => {
      const s = new Date(l.thoi_gian_bat_dau), e = new Date(l.thoi_gian_ket_thuc);
      const gap = e <= bd ? (bd - e) / 60000 : s >= kt ? (s - kt) / 60000 : null;
      if (gap === null) return;
      const r2 = this.lichRegion(l);
      if (region && r2 && region !== r2 && gap < R.di_chuyen_phut)
        warnings.push({ loai: 'Di chuyển', text: `Thiếu thời gian di chuyển ${Store.name('khu_vuc', r2)} ↔ ${Store.name('khu_vuc', region)}: chỉ cách buổi ${label(l)} ${Math.round(gap)} phút (cần ≥ ${R.di_chuyen_phut} phút).` });
      else if (gap < R.khoang_nghi_phut)
        warnings.push({ loai: 'Khoảng nghỉ', text: `Khoảng nghỉ với buổi ${label(l)} chỉ ${Math.round(gap)} phút (tối thiểu ${R.khoang_nghi_phut} phút).` });
    });
    if (fmtTime(bd) < R.gio_bat_dau || fmtTime(kt) > R.gio_ket_thuc || toDateStr(kt) !== toDateStr(bd))
      warnings.push({ loai: 'Ngoài giờ', text: `Ngoài giờ làm việc (${R.gio_bat_dau}–${R.gio_ket_thuc}).` });
    if (Number(R.canh_bao_cuoi_tuan) && [0, 6].includes(new Date(bd).getDay()))
      warnings.push({ loai: 'Cuối tuần', text: `Lịch rơi vào cuối tuần (${new Date(bd).getDay() === 0 ? 'Chủ nhật' : 'Thứ bảy'}).` });
    if (sameDay.length + 1 > R.so_buoi_toi_da)
      warnings.push({ loai: 'Số buổi', text: `Vượt số buổi tối đa trong ngày: ${sameDay.length + 1}/${R.so_buoi_toi_da} buổi.` });
    return { conflicts, warnings };
  },
  /** Gợi ý nhân sự của vị trí (phụ trách / hỗ trợ) KHÔNG trùng lịch trong khung giờ khách hàng chốt, cùng khu vực nếu phỏng vấn trực tiếp */
  freeInterviewers({ bd, kt, hinh_thuc, ctId, kv = null, exceptId = null }) {
    const asg = new Set(this.assignees(ctId).map((n) => n.id));
    return this.team(ctId).filter((n) => n.trang_thai_lam_viec === 'Đang làm việc' && !this.regionMismatch(n, hinh_thuc, kv))
      .map((n) => ({ n, chk: this.scheduleCheck({ nsId: n.id, bd, kt, hinh_thuc, ctId, kv, exceptId }) }))
      .filter((x) => !x.chk.conflicts.length)
      .sort((a, b) => asg.has(b.n.id) - asg.has(a.n.id) || a.chk.warnings.length - b.chk.warnings.length)
      .map((x) => ({ id: x.n.id, ho_ten: x.n.ho_ten, khu_vuc: Store.name('khu_vuc', x.n.ma_khu_vuc), vai_tro: asg.has(x.n.id) ? PC_ROLE.PT : PC_ROLE.HT, canh_bao: x.chk.warnings.length }));
  },
  /** Yêu cầu bổ sung người hỗ trợ đang chờ Quản lý xử lý */
  supportRequests(ctId = null) { return (DB.yeu_cau_ho_tro || []).filter((y) => y.trang_thai === 'Chờ xử lý' && (!ctId || y.ma_chi_tiet_du_an === Number(ctId))); },
  /** Độ phù hợp ứng viên – vị trí (thang 100 điểm, gợi ý xếp hạng khi lọc):
      Chuyên môn 30 · Cấp bậc 25 (lệch 1 bậc: 12) · Khu vực 20 · Lĩnh vực của khách hàng 15 · Kỹ năng 10 (khớp ≥ 2 kỹ năng: 10, khớp 1: 5) */
  FIT_RULES: [['Chuyên môn', 30, 'Trùng chuyên môn của vị trí'], ['Cấp bậc', 25, 'Đúng cấp bậc: 25 điểm · lệch 1 bậc: 12 điểm'], ['Khu vực', 20, 'Cùng khu vực làm việc của vị trí'],
    ['Lĩnh vực', 15, 'Từng làm cùng lĩnh vực với khách hàng'], ['Kỹ năng', 10, 'Kỹ năng có trong tên vị trí / mô tả công việc: khớp ≥ 2 kỹ năng 10 điểm, khớp 1 kỹ năng 5 điểm']],
  fitDetail(uv, ct) {
    if (!ct) return null;
    const cb = (id) => Store.get('cap_bac', id)?.bac ?? 0; const lv = this.khOfCt(ct)?.ma_linh_vuc;
    const kw = norm(ct.vi_tri + ' ' + (ct.mo_ta_cong_viec || '')); const skills = String(uv.ky_nang || '').split(',').map((x) => x.trim()).filter(Boolean);
    const hit = skills.filter((k) => norm(k).length > 1 && kw.includes(norm(k)));
    const near = uv.ma_cap_bac && uv.ma_cap_bac !== ct.ma_cap_bac && Math.abs(cb(uv.ma_cap_bac) - cb(ct.ma_cap_bac)) === 1;
    const nm = (t, id) => (id ? Store.name(t, id) : '—');
    const got = [uv.ma_chuyen_mon === ct.ma_chuyen_mon ? 30 : 0, uv.ma_cap_bac === ct.ma_cap_bac ? 25 : near ? 12 : 0, uv.ma_khu_vuc === ct.ma_khu_vuc ? 20 : 0,
      uv.ma_linh_vuc && uv.ma_linh_vuc === lv ? 15 : 0, hit.length >= 2 ? 10 : hit.length ? 5 : 0];
    const pair = [[nm('chuyen_mon', uv.ma_chuyen_mon), nm('chuyen_mon', ct.ma_chuyen_mon)], [nm('cap_bac', uv.ma_cap_bac), nm('cap_bac', ct.ma_cap_bac)],
      [nm('khu_vuc', uv.ma_khu_vuc), nm('khu_vuc', ct.ma_khu_vuc)], [nm('linh_vuc', uv.ma_linh_vuc), nm('linh_vuc', lv)], [hit.length ? 'Khớp: ' + hit.join(', ') : 'Không khớp kỹ năng nào', 'Tên vị trí & mô tả công việc']];
    const parts = this.FIT_RULES.map(([label, w, rule], i) => ({ label, w, rule, got: got[i], uv: pair[i][0], ct: pair[i][1] }));
    return { score: sum(got), parts };
  },
  fit(uv, ct) { return ct ? this.fitDetail(uv, ct).score : null; },
  /** Tên tệp danh sách đề cử gửi khách hàng */
  recListFile(ct, dot, fmt = 'xlsx') { return `Danh_sach_de_cu_${Code.ct(ct.id)}_${String(dot || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '')}.${fmt === 'sheet' ? 'csv' : 'xlsx'}`; },
};

/* ---------- Lịch sử trạng thái — 4 trường theo góp ý (Notes §4) ---------- */
function logStatus(hs, status, note = '') {
  let t = now().getTime();
  while (DB.lich_su_trang_thai.some((l) => l.ma_ho_so_ung_vien === hs.id && l.thoi_diem_thay_doi === new Date(t).toISOString())) t += 1;
  DB.lich_su_trang_thai.push({ ma_ho_so_ung_vien: hs.id, thoi_diem_thay_doi: new Date(t).toISOString(), trang_thai_moi: status, ghi_chu: note });
  hs.trang_thai = status;
}
/** Truy vết thời gian nằm ở từng trạng thái từ timeline (không cần cột bắt đầu/kết thúc) */
function statusDurations(hsId) {
  const h = Q.history(hsId);
  return h.map((x, i) => ({ ...x, duration: (i < h.length - 1 ? new Date(h[i + 1].thoi_diem_thay_doi) : now()) - new Date(x.thoi_diem_thay_doi), current: i === h.length - 1 }));
}

/* ---------- Tiến độ & trạng thái dự án — BR4-2, BR4-5, BR9-5 ---------- */
function recalcCt(ct) {
  const hired = Q.hired(ct.id);
  if (ct.trang_thai === ST.CT.DANG && hired >= ct.so_luong) ct.trang_thai = ST.CT.XONG;
  else if (ct.trang_thai === ST.CT.XONG && hired < ct.so_luong) ct.trang_thai = ST.CT.DANG; // thử việc không đạt → mở lại
  recalcDa(Q.da(ct.ma_du_an));
}
function recalcDa(da) {
  if (!da) return;
  const cts = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === da.id && c.trang_thai !== ST.CT.HUY);
  const need = sum(cts.map((c) => c.so_luong)); const got = sum(cts.map((c) => Math.min(c.so_luong, Q.hired(c.id))));
  da.tien_do = need ? Math.min(100, Math.round((got / need) * 100)) : 0;
  const all = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === da.id);
  da.trang_thai = all.length && all.every((c) => CT_CLOSED.includes(c.trang_thai)) ? 'Hoàn thành' : 'Đang thực hiện';
  da.ngay_cap_nhat = nowISO();
}
function recalcAll() { DB.chi_tiet_du_an.forEach(recalcCt); DB.du_an_tuyen_dung.forEach(recalcDa); }

const Svc = {
  /* ===== UC_02 Tài khoản & phân quyền ===== */
  saveAccount(data, id = null) {
    if (!Auth.isAdmin() && !App.seeding) return fail('Chỉ Quản trị viên được quản lý tài khoản.');
    const e = {};
    ['ho_ten', 'ten_dang_nhap', 'email', 'chuc_vu', 'vai_tro', 'ma_khu_vuc'].forEach((k) => { if (!data[k]) e[k] = 'Bắt buộc nhập.'; });
    if (data.email && !isEmail(data.email)) e.email = 'Email sai định dạng.';
    if (data.so_dien_thoai && !isPhone(data.so_dien_thoai)) e.so_dien_thoai = 'Số điện thoại sai định dạng.';
    if (DB.nhan_su.some((n) => n.id !== id && norm(n.ten_dang_nhap) === norm(data.ten_dang_nhap))) e.ten_dang_nhap = 'Tên đăng nhập đã tồn tại.';
    if (DB.nhan_su.some((n) => n.id !== id && norm(n.email) === norm(data.email))) e.email = 'Email đã tồn tại.';
    if (Object.keys(e).length) return bad(e);
    const row = { ho_ten: data.ho_ten, ten_dang_nhap: data.ten_dang_nhap, email: data.email, so_dien_thoai: data.so_dien_thoai, chuc_vu: data.chuc_vu, vai_tro: data.vai_tro, ma_khu_vuc: Number(data.ma_khu_vuc) };
    if (id) { const n = Q.ns(id); Object.assign(n, row, { trang_thai_lam_viec: data.trang_thai_lam_viec || n.trang_thai_lam_viec }); Store.save(); return { ok: true, row: n }; }
    const pw = data.mat_khau || Svc.genPassword();
    const n = Store.insert('nhan_su', { ...row, mat_khau: hashPw(pw), trang_thai_lam_viec: 'Đang làm việc' });
    Store.save(); return { ok: true, row: n, password: pw };
  },
  genPassword() { const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 10; i++) s += c[Math.floor(Math.random() * c.length)]; return s; },
  resetPassword(id) { const pw = Svc.genPassword(); Q.ns(id).mat_khau = hashPw(pw); Store.save(); return { ok: true, password: pw }; },
  setRole(id, role) { if (!Auth.isAdmin()) return fail('Chỉ Quản trị viên được phân quyền.'); Q.ns(id).vai_tro = role; Store.save(); return { ok: true }; },
  /** BR2-4: tài khoản đã phát sinh dữ liệu không xóa — chuyển "Đã nghỉ việc" */
  deactivateAccount(id) {
    const n = Q.ns(id); if (n.id === Auth.user.id) return fail('Không thể vô hiệu hóa chính tài khoản đang đăng nhập.');
    n.trang_thai_lam_viec = 'Đã nghỉ việc'; DB.phan_cong.filter((p) => p.ma_nhan_su === n.id && p.trang_thai === 'Đang phụ trách').forEach((p) => (p.trang_thai = 'Đã chuyển'));
    Store.save(); return { ok: true };
  },

  /* ===== Danh mục dùng chung (Quản trị viên) ===== */
  addCatalog(table, ten) {
    if (!Auth.isAdmin()) return fail('Chỉ Quản trị viên được cập nhật danh mục.');
    if (!['khu_vuc', 'linh_vuc', 'cap_bac', 'chuyen_mon'].includes(table)) return fail('Danh mục không hợp lệ.');
    ten = String(ten || '').trim(); if (!ten) return fail('Nhập tên danh mục.');
    if (DB[table].some((r) => norm(r.ten) === norm(ten))) return fail('Danh mục đã tồn tại.');
    const row = Store.insert(table, { ten, ...(table === 'cap_bac' ? { bac: DB.cap_bac.length + 1 } : {}) }); Store.save(); return { ok: true, row };
  },
  toggleChannel(id) {
    if (!Auth.isAdmin()) return fail('Chỉ Quản trị viên được cập nhật kênh đăng tuyển.');
    const k = Store.get('kenh_dang_tuyen', id); k.trang_thai = k.trang_thai === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động'; Store.save(); return { ok: true };
  },

  /* ===== Góp ý đề cử của Ban Giám đốc → Quản lý nhận (Fix Demo lần 1) ===== */
  addRecommendationComment(dcId, noiDung) {
    if (!Auth.isBGD() && !App.seeding) return fail('Chỉ Ban Giám đốc được gửi góp ý đề cử.');
    const d = Store.get('de_cu', dcId); if (!d) return fail('Không tìm thấy đề cử.');
    noiDung = String(noiDung || '').trim(); if (!noiDung) return bad({ noi_dung: 'Nhập nội dung góp ý.' });
    if (noiDung.length > 2000) return bad({ noi_dung: 'Tối đa 2000 ký tự.' });
    const g = Store.insert('gop_y_de_cu', { ma_de_cu: d.id, ma_nguoi_gop_y: Auth.user.id, noi_dung: noiDung, ngay_gop_y: nowISO(), trang_thai: 'Chờ Quản lý xem', ngay_xem: null });
    Store.save(); return { ok: true, row: g };
  },
  markCommentsSeen(dcIds) {
    if (!Auth.isQL()) return fail('Chỉ Quản lý nhận góp ý.');
    let n = 0; (DB.gop_y_de_cu || []).filter((g) => dcIds.map(Number).includes(g.ma_de_cu) && g.trang_thai !== 'Đã xem').forEach((g) => { g.trang_thai = 'Đã xem'; g.ngay_xem = nowISO(); n++; });
    Store.save(); return { ok: true, seen: n };
  },
  /** Đổi mật khẩu — mọi vai trò (bảng phân quyền) */
  changePassword(oldPw, newPw, confirmPw) {
    const u = Auth.user; const e = {};
    if (!u || u.mat_khau !== hashPw(String(oldPw || ''))) e.mk_cu = 'Mật khẩu hiện tại không đúng.';
    if (String(newPw || '').length < 6) e.mk_moi = 'Mật khẩu mới tối thiểu 6 ký tự.';
    else if (newPw === oldPw) e.mk_moi = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (newPw !== confirmPw) e.mk_xn = 'Xác nhận mật khẩu không khớp.';
    if (Object.keys(e).length) return bad(e);
    u.mat_khau = hashPw(newPw); Store.save(); return { ok: true };
  },

  /* ===== UC_03 Khách hàng ===== */
  saveCustomer(data, id = null) {
    const e = {};
    ['ten_cong_ty', 'nguoi_lien_he', 'email', 'so_dien_thoai', 'ma_linh_vuc'].forEach((k) => { if (!data[k]) e[k] = 'Bắt buộc nhập.'; });
    if (data.email && !isEmail(data.email)) e.email = 'Email sai định dạng.';
    if (data.so_dien_thoai && !isPhone(data.so_dien_thoai)) e.so_dien_thoai = 'Số điện thoại sai định dạng.';
    const dup = DB.khach_hang.find((k) => k.id !== id && (norm(k.ten_cong_ty) === norm(data.ten_cong_ty) || norm(k.email) === norm(data.email)));
    if (dup) e[norm(dup.ten_cong_ty) === norm(data.ten_cong_ty) ? 'ten_cong_ty' : 'email'] = `Khách hàng đã tồn tại: ${dup.ten_cong_ty} (${Code.kh(dup.id)}).`;
    if (Object.keys(e).length) return bad(e);
    const row = { ten_cong_ty: data.ten_cong_ty, nguoi_lien_he: data.nguoi_lien_he, email: data.email, so_dien_thoai: data.so_dien_thoai, dia_chi: data.dia_chi, ma_linh_vuc: Number(data.ma_linh_vuc) };
    if (id) { Object.assign(Q.kh(id), row, data.trang_thai_hop_tac ? { trang_thai_hop_tac: data.trang_thai_hop_tac } : {}); Store.save(); return { ok: true, row: Q.kh(id) }; }
    const k = Store.insert('khach_hang', { ...row, trang_thai_hop_tac: 'Đang hợp tác', ngay_tao: nowISO() }); Store.save(); return { ok: true, row: k };
  },

  /* ===== UC_04 Dự án tuyển dụng & chi tiết dự án ===== */
  saveProject(data, id = null) {
    const e = {}; if (!data.ma_khach_hang) e.ma_khach_hang = 'Chọn khách hàng.'; if (!data.ten_du_an) e.ten_du_an = 'Nhập tên dự án tuyển dụng.'; if (!data.ngay_bat_dau) e.ngay_bat_dau = 'Chọn ngày bắt đầu.';
    if (data.ngay_ket_thuc && data.ngay_bat_dau && data.ngay_ket_thuc < data.ngay_bat_dau) e.ngay_ket_thuc = 'Ngày kết thúc phải sau ngày bắt đầu.';
    const kh = Q.kh(data.ma_khach_hang); if (kh && kh.trang_thai_hop_tac !== 'Đang hợp tác' && !id) e.ma_khach_hang = 'Khách hàng đã ngừng hợp tác.';
    if (Object.keys(e).length) return bad(e);
    const row = { ma_khach_hang: Number(data.ma_khach_hang), ten_du_an: data.ten_du_an, ngay_bat_dau: data.ngay_bat_dau, ngay_ket_thuc: data.ngay_ket_thuc || null, ghi_chu: data.ghi_chu };
    if (id) { Object.assign(Q.da(id), row, { ngay_cap_nhat: nowISO() }); Store.save(); return { ok: true, row: Q.da(id) }; }
    const d = Store.insert('du_an_tuyen_dung', { ...row, tien_do: 0, trang_thai: 'Đang thực hiện', ngay_tao: nowISO(), ngay_cap_nhat: null });
    Store.save(); return { ok: true, row: d };
  },
  savePosition(data, id = null) {
    if (id && !Q.isCreator(Q.ct(id))) return fail('Chỉ nhân viên tạo vị trí này mới được sửa.');
    const e = {};
    ['ma_du_an', 'vi_tri', 'so_luong', 'hinh_thuc', 'han_hoan_thanh', 'ma_cap_bac', 'ma_chuyen_mon', 'ma_khu_vuc'].forEach((k) => { if (!data[k]) e[k] = 'Bắt buộc nhập.'; });
    if (data.so_luong && !(Number(data.so_luong) > 0)) e.so_luong = 'Số lượng phải lớn hơn 0.';
    if (data.han_hoan_thanh && !id && data.han_hoan_thanh < todayStr()) e.han_hoan_thanh = 'Hạn hoàn thành không được sớm hơn hôm nay.';
    if (data.muc_luong_toi_da && Number(data.muc_luong_toi_da) < 0) e.muc_luong_toi_da = 'Mức lương không hợp lệ.';
    if (Object.keys(e).length) return bad(e);
    const row = { ma_du_an: Number(data.ma_du_an), vi_tri: data.vi_tri, mo_ta_cong_viec: data.mo_ta_cong_viec, so_luong: Number(data.so_luong), hinh_thuc: data.hinh_thuc,
      muc_luong_toi_da: data.muc_luong_toi_da ? Number(data.muc_luong_toi_da) : null, han_hoan_thanh: data.han_hoan_thanh, ma_cap_bac: Number(data.ma_cap_bac), ma_chuyen_mon: Number(data.ma_chuyen_mon), ma_khu_vuc: Number(data.ma_khu_vuc) };
    if (id) { const ct = Q.ct(id); Object.assign(ct, row); recalcCt(ct); Store.save(); return { ok: true, row: ct }; }
    const ct = Store.insert('chi_tiet_du_an', { ...row, trang_thai: ST.CT.MOI, ly_do_dong_huy: null, ngay_tao: nowISO(), ma_nguoi_tao: Auth.user.id });
    recalcDa(Q.da(ct.ma_du_an)); Store.save(); return { ok: true, row: ct };
  },
  closePosition(id, type, reason) {
    if (!Q.isCreator(Q.ct(id))) return fail('Chỉ nhân viên tạo vị trí này mới được đóng hoặc hủy.');
    if (!reason) return fail('Bắt buộc nhập lý do.');
    const ct = Q.ct(id); if (CT_CLOSED.includes(ct.trang_thai)) return fail('Dự án đã kết thúc.');
    ct.trang_thai = type === 'huy' ? ST.CT.HUY : ST.CT.DONG; ct.ly_do_dong_huy = reason;
    // Hồ sơ còn đang xử lý được giải phóng, ứng viên trở lại sẵn sàng cho dự án khác
    Q.hsOfCt(id).filter((h) => HS_ACTIVE.includes(h.trang_thai)).forEach((h) => {
      logStatus(h, ST.HS.LOAI, `Dự án ${ct.trang_thai.toLowerCase()}: ${reason}`);
      Q.deCuOfHs(h.id).filter((d) => [ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai)).forEach((d) => (d.trang_thai = ST.DC.GO));
      Q.lichOfHs(h.id).filter((l) => l.trang_thai === ST.LICH.LEN).forEach((l) => { l.trang_thai = ST.LICH.HUY; l.ly_do_huy = `Vị trí ${ct.trang_thai.toLowerCase()}: ${reason}`; });
    });
    DB.tin_dang.filter((t) => t.ma_chi_tiet_du_an === ct.id).forEach((t) => (t.trang_thai = 'Đã gỡ tin'));
    recalcDa(Q.da(ct.ma_du_an)); Store.save(); return { ok: true };
  },
  /** UC_04 6a — Gắn mã tin đăng (BR4-3) */
  attachPosting(ctId, data) {
    if (!Q.isCreator(Q.ct(ctId))) return fail('Chỉ nhân viên tạo vị trí này mới được gắn mã tin đăng.');
    const e = {}; if (!data.ma_kenh) e.ma_kenh = 'Chọn kênh đăng tuyển.'; if (!data.ma_tin_kenh) e.ma_tin_kenh = 'Nhập mã tin đăng trên kênh.';
    if (data.ma_tin_kenh && DB.tin_dang.some((t) => t.ma_kenh === Number(data.ma_kenh) && norm(t.ma_tin_kenh) === norm(data.ma_tin_kenh))) e.ma_tin_kenh = 'Mã tin này đã được gắn cho một dự án khác.';
    if (Object.keys(e).length) return bad(e);
    const t = Store.insert('tin_dang', { ma_chi_tiet_du_an: Number(ctId), ma_kenh: Number(data.ma_kenh), ma_tin_kenh: data.ma_tin_kenh.toUpperCase(), ngay_dang: data.ngay_dang ? new Date(data.ngay_dang).toISOString() : nowISO(), trang_thai: 'Đang đăng' });
    // Hồ sơ trong danh sách chờ gán mang đúng mã tin được tự động gắn
    let n = 0; DB.ho_so_ung_tuyen.filter((h) => !h.ma_chi_tiet_du_an && norm(h.ma_tin_kenh) === norm(t.ma_tin_kenh)).forEach((h) => { h.ma_chi_tiet_du_an = Number(ctId); logStatus(h, ST.HS.APPLY, `Tự động gắn dự án theo mã tin ${t.ma_tin_kenh}`); n++; });
    Store.save(); return { ok: true, row: t, matched: n };
  },
  removePosting(id) { const t = Store.get('tin_dang', id); if (!Q.isCreator(Q.ct(t.ma_chi_tiet_du_an))) return fail('Chỉ nhân viên tạo vị trí này mới được gỡ tin.'); t.trang_thai = 'Đã gỡ tin'; Store.save(); return { ok: true }; },

  /* ===== UC_05 Phân công — BR5-1..4 ===== */
  /** roles: { [maNhanSu]: 'Phụ trách' | 'Hỗ trợ' } — mặc định Phụ trách; vị trí phải có ít nhất một người Phụ trách */
  assign(ctId, staffIds, replace = false, roles = {}) {
    if (!Auth.isQL() && !App.seeding) return fail('Chỉ Quản lý được phân công nhân viên.');
    staffIds = (staffIds || []).map(Number).filter(Boolean);
    if (!staffIds.length) return fail('Chưa chọn nhân viên phụ trách.');
    const roleOf = (id) => (roles[id] === PC_ROLE.HT ? PC_ROLE.HT : PC_ROLE.PT);
    const ct = Q.ct(ctId); if (CT_CLOSED.includes(ct.trang_thai)) return fail('Dự án đã kết thúc, không thể phân công.');
    for (const id of staffIds) { const n = Q.ns(id); if (!n || n.trang_thai_lam_viec !== 'Đang làm việc') return fail('Chỉ phân công nhân viên đang làm việc.'); }
    const current = DB.phan_cong.filter((p) => p.ma_chi_tiet_du_an === ct.id && p.trang_thai === 'Đang phụ trách');
    const after = replace ? staffIds : [...new Set([...current.map((p) => p.ma_nhan_su), ...staffIds])];
    if (!after.some((id) => (staffIds.includes(id) ? roleOf(id) : current.find((p) => p.ma_nhan_su === id)?.vai_tro || PC_ROLE.PT) === PC_ROLE.PT)) return fail('Vị trí cần ít nhất một nhân viên vai trò “Phụ trách”.');
    if (replace) current.filter((p) => !staffIds.includes(p.ma_nhan_su)).forEach((p) => (p.trang_thai = 'Đã chuyển')); // BR5-4
    current.filter((p) => staffIds.includes(p.ma_nhan_su)).forEach((p) => (p.vai_tro = roleOf(p.ma_nhan_su)));
    staffIds.filter((id) => !current.some((p) => p.ma_nhan_su === id)).forEach((id) => Store.insert('phan_cong', { ma_chi_tiet_du_an: ct.id, ma_nhan_su: id, ngay_phan_cong: nowISO(), trang_thai: 'Đang phụ trách', vai_tro: roleOf(id) }));
    if (ct.trang_thai === ST.CT.MOI) ct.trang_thai = ST.CT.DANG; // BR5-3
    // Đã bổ sung người hỗ trợ → đóng các yêu cầu đang chờ của vị trí
    if (staffIds.some((id) => roleOf(id) === PC_ROLE.HT)) Q.supportRequests(ct.id).forEach((y) => Object.assign(y, { trang_thai: 'Đã xử lý', ma_nguoi_xu_ly: Auth.user?.id || null, ngay_xu_ly: nowISO() }));
    Store.save(); return { ok: true };
  },
  /** Nhân viên phụ trách báo Quản lý: không còn nhân sự phù hợp để phỏng vấn → đề nghị phân công thêm người hỗ trợ */
  requestSupport(ctId, noiDung) {
    const ct = Q.ct(ctId); if (!ct) return fail('Không tìm thấy vị trí.');
    const deny = Q.denyCt(ct); if (deny) return fail(deny);
    if (!String(noiDung || '').trim()) return bad({ noi_dung: 'Nhập nội dung đề nghị gửi Quản lý.' });
    if (Q.supportRequests(ct.id).some((y) => y.ma_nguoi_gui === Auth.user.id)) return fail('Bạn đã gửi đề nghị cho vị trí này — đang chờ Quản lý phân công.');
    const y = Store.insert('yeu_cau_ho_tro', { ma_chi_tiet_du_an: ct.id, ma_nguoi_gui: Auth.user.id, noi_dung: String(noiDung).trim(), ngay_gui: nowISO(), trang_thai: 'Chờ xử lý', ma_nguoi_xu_ly: null, ngay_xu_ly: null });
    Store.save(); return { ok: true, row: y };
  },
  /** Quản lý đóng đề nghị khi không cần bổ sung người */
  closeSupportRequest(id) {
    if (!Auth.isQL()) return fail('Chỉ Quản lý xử lý đề nghị phân công.');
    const y = Store.get('yeu_cau_ho_tro', id); if (!y || y.trang_thai !== 'Chờ xử lý') return fail('Đề nghị đã được xử lý.');
    Object.assign(y, { trang_thai: 'Đã xử lý', ma_nguoi_xu_ly: Auth.user.id, ngay_xu_ly: nowISO() }); Store.save(); return { ok: true };
  },
  /** Gợi ý nhân viên: cùng khu vực trước (thuận tiện đi phỏng vấn trực tiếp — Notes §4), ít việc trước */
  suggestStaff(ct) {
    return DB.nhan_su.filter((n) => n.vai_tro === ROLES.NV && n.trang_thai_lam_viec === 'Đang làm việc').map((n) => ({
      n, sameArea: n.ma_khu_vuc === ct.ma_khu_vuc,
      load: DB.phan_cong.filter((p) => p.ma_nhan_su === n.id && p.trang_thai === 'Đang phụ trách' && !CT_CLOSED.includes(Q.ct(p.ma_chi_tiet_du_an)?.trang_thai)).length,
    })).sort((a, b) => (b.sameArea - a.sameArea) || (a.load - b.load));
  },

  /* ===== Tiếp nhận hồ sơ tự động từ kênh đăng tuyển — Hình 3.20, BR8-4 ===== */
  ingest(payload, kenh) {
    // Giai đoạn 1: kiểm tra trùng theo email / số điện thoại (BR8-1)
    const phone = String(payload.so_dien_thoai || '').replace(/\D/g, '');
    let uv = DB.ung_vien.find((u) => norm(u.email) === norm(payload.email) || (phone && String(u.so_dien_thoai).replace(/\D/g, '') === phone));
    let isNew = false;
    if (!uv) {
      uv = Store.insert('ung_vien', { ma_linh_vuc: null, ma_cap_bac: null, ma_chuyen_mon: null, ma_khu_vuc: null, ma_nhan_su: null, ho_ten: payload.ho_ten, gioi_tinh: payload.gioi_tinh || null, nam_sinh: payload.nam_sinh || null,
        email: payload.email, so_dien_thoai: payload.so_dien_thoai, dia_chi: payload.dia_chi || '', trinh_do_hoc_van: payload.trinh_do_hoc_van || '', so_nam_kinh_nghiem: payload.so_nam_kinh_nghiem ?? null,
        ky_nang: payload.ky_nang || '', nguon: kenh.ten_kenh, cv_dinh_kem: payload.cv || '', ghi_chu: payload.tieu_de ? 'Tiêu đề hồ sơ: ' + payload.tieu_de : '', trang_thai: ST.UV.HD, ngay_tao: nowISO() });
      isNew = true;
    }
    // Giai đoạn 2: đối chiếu mã tin đăng với dự án (BR4-3)
    const tin = DB.tin_dang.find((t) => t.ma_kenh === kenh.id && norm(t.ma_tin_kenh) === norm(payload.ma_tin_kenh) && t.trang_thai === 'Đang đăng');
    const ctId = tin && !CT_CLOSED.includes(Q.ct(tin.ma_chi_tiet_du_an)?.trang_thai) ? tin.ma_chi_tiet_du_an : null;
    // Không tạo hồ sơ trùng cho cùng ứng viên ở cùng dự án
    if (ctId && DB.ho_so_ung_tuyen.some((h) => h.ma_ung_vien === uv.id && h.ma_chi_tiet_du_an === ctId)) return { status: 'dup-apply', uv, isNew };
    // Giai đoạn 3: lưu hồ sơ apply (gắn dự án hoặc đưa vào danh sách chờ gán)
    const hs = Store.insert('ho_so_ung_tuyen', { ma_chi_tiet_du_an: ctId, ma_ung_vien: uv.id, ma_tin_kenh: String(payload.ma_tin_kenh || '').toUpperCase(), ngay_apply: nowISO(), trang_thai: ST.HS.APPLY, ghi_chu: '' });
    logStatus(hs, ST.HS.APPLY, ctId ? `Apply qua ${kenh.ten_kenh} (mã tin ${hs.ma_tin_kenh})` : `Apply qua ${kenh.ten_kenh} — mã tin ${hs.ma_tin_kenh || '(trống)'} chưa đối chiếu được, chờ gán`);
    if (uv.trang_thai === ST.UV.LT && isNew === false) { uv.trang_thai = ST.UV.HD; uv.ghi_chu = (uv.ghi_chu ? uv.ghi_chu + ' | ' : '') + 'Kích hoạt lại do ứng viên chủ động apply mới'; }
    return { status: ctId ? 'matched' : 'pending', uv, hs, isNew };
  },
  /** Chạy một phiên đồng bộ (mô phỏng crawler/API của kênh) */
  runSync(kenhId = null, opts = {}) {
    const kenhs = DB.kenh_dang_tuyen.filter((k) => k.trang_thai === 'Hoạt động' && (!kenhId || k.id === Number(kenhId)) && k.loai !== 'noi_bo');
    const result = { tong: 0, moi: 0, trung: 0, gan: 0, cho_gan: 0, bo_qua: 0, kenh: kenhs.map((k) => k.ten_kenh).join(', ') };
    kenhs.forEach((k) => {
      const tins = DB.tin_dang.filter((t) => t.ma_kenh === k.id && t.trang_thai === 'Đang đăng');
      const n = opts.count ?? (2 + Math.floor(Math.random() * 3));
      for (let i = 0; i < n; i++) {
        const unknown = !tins.length || Math.random() < 0.18;
        const payload = Seed.fakeApplicant(unknown ? Seed.fakeJobCode(k) : tins[Math.floor(Math.random() * tins.length)].ma_tin_kenh, Math.random() < 0.15);
        const r = Svc.ingest(payload, k); result.tong++;
        if (r.isNew) result.moi++; else result.trung++;
        if (r.status === 'matched') result.gan++; else if (r.status === 'pending') result.cho_gan++; else result.bo_qua++;
      }
    });
    DB._sync_log.unshift({ thoi_diem: nowISO(), nguoi: Auth.user?.ho_ten || 'Hệ thống (lịch tự động)', ...result }); DB._sync_log.length = Math.min(DB._sync_log.length, 30);
    Store.save(); return { ok: true, ...result };
  },
  /** Thu thập từ URL tin tuyển dụng: nhận diện kênh theo tên miền + mã tin trong URL */
  syncFromUrl(url) {
    let u; try { u = new URL(url); } catch (e) { return fail('URL không hợp lệ.'); }
    const k = DB.kenh_dang_tuyen.find((x) => x.ten_mien && u.hostname.replace(/^www\./, '').endsWith(x.ten_mien));
    if (!k) return fail('Tên miền chưa được cấu hình là kênh đăng tuyển: ' + u.hostname);
    const m = url.match(/([A-Za-z]{2,4})[-_]?(\d{4,})/g); const code = m ? m.at(-1).replace(/[_]/, '-').toUpperCase() : null;
    const tin = DB.tin_dang.find((t) => t.ma_kenh === k.id && code && norm(t.ma_tin_kenh).replace('-', '') === norm(code).replace('-', ''));
    const n = 1 + Math.floor(Math.random() * 3); const res = { tong: 0, moi: 0, trung: 0, gan: 0, cho_gan: 0, bo_qua: 0, kenh: k.ten_kenh + ' (URL)' };
    for (let i = 0; i < n; i++) { const r = Svc.ingest(Seed.fakeApplicant(tin ? tin.ma_tin_kenh : code || Seed.fakeJobCode(k), false), k); res.tong++; r.isNew ? res.moi++ : res.trung++; r.status === 'matched' ? res.gan++ : r.status === 'pending' ? res.cho_gan++ : res.bo_qua++; }
    DB._sync_log.unshift({ thoi_diem: nowISO(), nguoi: Auth.user.ho_ten, url, ...res }); Store.save();
    return { ok: true, ...res, code };
  },
  /** Gán hồ sơ chờ gán vào dự án */
  assignPending(hsId, ctId) {
    const hs = Q.hs(hsId); const ct = Q.ct(ctId);
    if (!ct) return fail('Chọn dự án cần gán.');
    if (CT_CLOSED.includes(ct.trang_thai)) return fail('Dự án đã kết thúc.');
    if (DB.ho_so_ung_tuyen.some((h) => h.id !== hs.id && h.ma_ung_vien === hs.ma_ung_vien && h.ma_chi_tiet_du_an === ct.id)) return fail('Ứng viên đã có hồ sơ ở dự án này.');
    hs.ma_chi_tiet_du_an = ct.id; logStatus(hs, ST.HS.APPLY, `Nhân viên gán thủ công vào ${Code.ct(ct.id)} – ${ct.vi_tri}`); Store.save(); return { ok: true };
  },

  /* ===== UC_08 Chuẩn hóa & gắn thẻ ứng viên ===== */
  normalizeCandidate(id, data) {
    const e = {};
    ['ho_ten', 'email', 'so_dien_thoai'].forEach((k) => { if (!data[k]) e[k] = 'Bắt buộc nhập.'; });
    if (data.email && !isEmail(data.email)) e.email = 'Email sai định dạng.';
    if (data.so_dien_thoai && !isPhone(data.so_dien_thoai)) e.so_dien_thoai = 'Số điện thoại sai định dạng.';
    if (data.nam_sinh && (Number(data.nam_sinh) < 1950 || Number(data.nam_sinh) > now().getFullYear() - 16)) e.nam_sinh = 'Năm sinh không hợp lệ.';
    if (data.so_nam_kinh_nghiem && (Number(data.so_nam_kinh_nghiem) < 0 || Number(data.so_nam_kinh_nghiem) > 50)) e.so_nam_kinh_nghiem = 'Từ 0 đến 50 năm.';
    const phone = String(data.so_dien_thoai).replace(/\D/g, '');
    const dup = DB.ung_vien.find((u) => u.id !== Number(id) && (norm(u.email) === norm(data.email) || String(u.so_dien_thoai).replace(/\D/g, '') === phone));
    if (dup) return { ok: false, duplicate: dup, errors: { [norm(dup.email) === norm(data.email) ? 'email' : 'so_dien_thoai']: `Trùng với hồ sơ ${Code.uv(dup.id)} – ${dup.ho_ten}.` } };
    if (data.cv && !/\.(pdf|docx?)$/i.test(data.cv)) e.cv_dinh_kem = 'CV chỉ nhận PDF/DOC/DOCX, tối đa 5MB.';
    if (Object.keys(e).length) return bad(e);
    const uv = Q.uv(id);
    Object.assign(uv, { ho_ten: data.ho_ten.replace(/\s+/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase()), gioi_tinh: data.gioi_tinh || null, nam_sinh: data.nam_sinh ? Number(data.nam_sinh) : null, email: data.email.toLowerCase(),
      so_dien_thoai: data.so_dien_thoai, dia_chi: data.dia_chi, trinh_do_hoc_van: data.trinh_do_hoc_van, so_nam_kinh_nghiem: data.so_nam_kinh_nghiem === '' ? null : Number(data.so_nam_kinh_nghiem),
      ma_linh_vuc: Number(data.ma_linh_vuc) || null, ma_cap_bac: Number(data.ma_cap_bac) || null, ma_chuyen_mon: Number(data.ma_chuyen_mon) || null, ma_khu_vuc: Number(data.ma_khu_vuc) || null,
      ky_nang: String(data.ky_nang || '').split(',').map((s) => s.trim()).filter(Boolean).join(', '), ghi_chu: data.ghi_chu, ma_nhan_su: uv.ma_nhan_su || Auth.user.id });
    if (data.cv) uv.cv_dinh_kem = data.cv;
    Store.save(); return { ok: true, row: uv };
  },
  /** Gộp hồ sơ trùng: chuyển toàn bộ hồ sơ ứng tuyển về hồ sơ gốc (BR8-1) */
  mergeCandidate(fromId, intoId) {
    const from = Q.uv(fromId), into = Q.uv(intoId);
    Q.hsOfUv(from.id).forEach((h) => {
      if (h.ma_chi_tiet_du_an && DB.ho_so_ung_tuyen.some((x) => x.ma_ung_vien === into.id && x.ma_chi_tiet_du_an === h.ma_chi_tiet_du_an)) { logStatus(h, ST.HS.LOAI, 'Hồ sơ trùng — đã gộp'); }
      h.ma_ung_vien = into.id;
    });
    ['ky_nang', 'cv_dinh_kem'].forEach((k) => { if (!into[k] && from[k]) into[k] = from[k]; });
    DB.ung_vien.splice(DB.ung_vien.indexOf(from), 1);
    Store.save(); return { ok: true };
  },
  /** Cập nhật trạng thái ứng viên (vòng đời — Notes §3) */
  setCandidateStatus(id, status, note) {
    const uv = Q.uv(id);
    if (status === ST.UV.HD && uv.trang_thai === ST.UV.TV) return fail('Ứng viên đang thử việc. Dùng chức năng “Thử việc không đạt” ở hồ sơ ứng tuyển để đưa về kho.');
    uv.trang_thai = status; uv.ghi_chu = [uv.ghi_chu, `${fmtDate(now())}: ${status}${note ? ' – ' + note : ''}`].filter(Boolean).join(' | ');
    let n = 0;
    if (status === ST.UV.LT) n = Svc._withdrawActive(uv, `Ứng viên lưu trữ: ${note || 'không còn nhu cầu'}`);
    Store.save(); return { ok: true, withdrawn: n };
  },
  /** Rút ứng viên khỏi mọi danh sách đề cử/phỏng vấn đang mở (tránh “gọi điện mãi” — Notes §3) */
  _withdrawActive(uv, note, exceptHsId = null) {
    let n = 0;
    Q.hsOfUv(uv.id).filter((h) => h.id !== exceptHsId && HS_ACTIVE.includes(h.trang_thai)).forEach((h) => {
      logStatus(h, ST.HS.LOAI, note); n++;
      Q.deCuOfHs(h.id).filter((d) => [ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai)).forEach((d) => { d.trang_thai = ST.DC.GO; d.ghi_chu = [d.ghi_chu, 'Tự động gỡ: ' + note].filter(Boolean).join(' | '); });
      Q.lichOfHs(h.id).filter((l) => l.trang_thai === ST.LICH.LEN).forEach((l) => { l.trang_thai = ST.LICH.HUY; l.ly_do_huy = note; });
      const ct = Q.ct(h.ma_chi_tiet_du_an); ct && recalcCt(ct);
    });
    return n;
  },

  /* ===== UC_06 Lọc nâng cao — BR6-6, BR6-7 ===== */
  filterCandidates(c = {}) {
    const ct = c.ct ? Q.ct(c.ct) : null; const kw = norm(c.q);
    return DB.ung_vien.filter((u) => {
      if (c.forRecommend !== false && u.trang_thai !== ST.UV.HD) return false; // chỉ ứng viên Hoạt động
      if (c.trang_thai && u.trang_thai !== c.trang_thai) return false;
      if (kw && !norm([u.ho_ten, u.email, u.so_dien_thoai, u.ky_nang, Code.uv(u.id)].join(' ')).includes(kw)) return false;
      if (c.cap_bac && u.ma_cap_bac !== Number(c.cap_bac)) return false;
      if (c.chuyen_mon && u.ma_chuyen_mon !== Number(c.chuyen_mon)) return false;
      if (c.khu_vuc && u.ma_khu_vuc !== Number(c.khu_vuc)) return false;
      if (c.linh_vuc && u.ma_linh_vuc !== Number(c.linh_vuc)) return false;
      if (c.exp_min !== '' && c.exp_min != null && (u.so_nam_kinh_nghiem ?? -1) < Number(c.exp_min)) return false;
      if (c.exp_max !== '' && c.exp_max != null && (u.so_nam_kinh_nghiem ?? 99) > Number(c.exp_max)) return false;
      const age = Q.age(u);
      if (c.age_min && (age ?? 0) < Number(c.age_min)) return false;
      if (c.age_max && (age ?? 999) > Number(c.age_max)) return false;
      if (c.ky_nang && !norm(u.ky_nang).includes(norm(c.ky_nang))) return false;
      if (c.normalized === 'yes' && !Q.isNormalized(u)) return false;
      if (c.normalized === 'no' && Q.isNormalized(u)) return false;
      if (ct) {
        const hs = DB.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === u.id && h.ma_chi_tiet_du_an === ct.id);
        if (c.applied === 'yes' && !hs) return false;
        if (c.applied === 'no' && hs) return false;
      }
      return true;
    }).map((u) => {
      const hs = ct ? DB.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === u.id && h.ma_chi_tiet_du_an === ct.id) : null;
      return { uv: u, hs, fit: ct ? Q.fit(u, ct) : null };
    }).sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0) || b.uv.id - a.uv.id);
  },

  /* ===== UC_06 Tạo đề cử — BR6-1..5 ===== */
  createRecommendations(ctId, uvIds, info) {
    const ct = Q.ct(ctId);
    if (!ct) return fail('Chọn vị trí (ID vị trí) trước khi tạo đề cử.');
    const deny = Q.denyCt(ct); if (deny) return fail(deny);
    if (ct.trang_thai !== ST.CT.DANG) return fail('Chỉ tạo đề cử cho dự án ở trạng thái “Đang thực hiện”.');
    if (!uvIds.length) return fail('Chưa tick chọn ứng viên nào.');
    if (!info.dot_de_cu) return bad({ dot_de_cu: 'Nhập đợt đề cử.' });
    const created = [], skipped = [];
    uvIds.forEach((id) => {
      const uv = Q.uv(id);
      if (uv.trang_thai !== ST.UV.HD) { skipped.push(`${uv.ho_ten}: không ở trạng thái Hoạt động`); return; }
      let hs = DB.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === uv.id && h.ma_chi_tiet_du_an === ct.id); // BR6-2
      if (hs && [ST.HS.PV, ST.HS.TV, ST.HS.LOAI].includes(hs.trang_thai)) { skipped.push(`${uv.ho_ten}: hồ sơ đang ở trạng thái “${hs.trang_thai}”`); return; }
      if (hs && DB.de_cu.some((d) => d.ma_ho_so_ung_vien === hs.id && norm(d.dot_de_cu) === norm(info.dot_de_cu) && d.trang_thai !== ST.DC.GO)) { skipped.push(`${uv.ho_ten}: đã có đề cử trong ${info.dot_de_cu}`); return; }
      if (hs && DB.de_cu.some((d) => d.ma_ho_so_ung_vien === hs.id && [ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai))) { skipped.push(`${uv.ho_ten}: đang có đề cử chưa gửi khách hàng`); return; }
      if (!hs) { // 6a — ứng viên chưa apply: tạo hồ sơ ứng tuyển, mã tin để trống
        hs = Store.insert('ho_so_ung_tuyen', { ma_chi_tiet_du_an: ct.id, ma_ung_vien: uv.id, ma_tin_kenh: '', ngay_apply: nowISO(), trang_thai: ST.HS.APPLY, ghi_chu: 'Chưa apply — cần liên hệ khảo sát nguyện vọng' });
        logStatus(hs, ST.HS.APPLY, 'Nhân viên chủ động tạo hồ sơ từ kho dữ liệu (ứng viên chưa apply)');
      }
      const d = Store.insert('de_cu', { ma_ho_so_ung_vien: hs.id, ma_nguoi_tao: Auth.user.id, ma_nguoi_duyet: null, dot_de_cu: info.dot_de_cu, trang_thai: ST.DC.CHO,
        so_nam_kinh_nghiem: info.per?.[id]?.exp ?? uv.so_nam_kinh_nghiem, muc_luong_mong_muon: info.per?.[id]?.salary ? Number(info.per[id].salary) : null, notice_period: info.per?.[id]?.notice || info.notice_period || '',
        ngay_tao: nowISO(), ngay_duyet: null, ngay_gui_khach_hang: null, phan_hoi_khach_hang: null, ngay_phan_hoi: null, ly_do_loai: null, ghi_chu: info.ghi_chu || '' });
      logStatus(hs, ST.HS.DECU, `Tạo đề cử ${info.dot_de_cu} — chờ Quản lý duyệt`);
      created.push(d);
    });
    Store.save(); return { ok: created.length > 0, created, skipped, error: created.length ? null : 'Không tạo được đề cử nào.' };
  },
  /** UC_06 bước 8 — Duyệt / Yêu cầu chỉnh sửa (BR6-4) */
  approveRecommendation(id) {
    if (!Auth.isQL() && !App.seeding) return fail('Chỉ Quản lý được duyệt đề cử.');
    const d = Store.get('de_cu', id); if (d.trang_thai !== ST.DC.CHO) return fail('Đề cử không ở trạng thái Chờ duyệt.');
    Object.assign(d, { trang_thai: ST.DC.DUYET, ma_nguoi_duyet: Auth.user.id, ngay_duyet: nowISO() }); Store.save(); return { ok: true };
  },
  requestEdit(id, reason) {
    if (!Auth.isQL() && !App.seeding) return fail('Chỉ Quản lý được yêu cầu chỉnh sửa đề cử.');
    if (!reason) return fail('Nhập lý do yêu cầu chỉnh sửa.');
    const d = Store.get('de_cu', id); if (d.trang_thai !== ST.DC.CHO) return fail('Đề cử không ở trạng thái Chờ duyệt.');
    Object.assign(d, { trang_thai: ST.DC.SUA, ma_nguoi_duyet: Auth.user.id, ngay_duyet: nowISO(), ghi_chu: [d.ghi_chu, `Yêu cầu sửa (${Auth.user.ho_ten}): ${reason}`].filter(Boolean).join(' | ') });
    Store.save(); return { ok: true };
  },
  resubmitRecommendation(id, data) {
    const d = Store.get('de_cu', id); const deny = Q.denyCt(Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an)); if (deny) return fail(deny);
    if (d.trang_thai !== ST.DC.SUA) return fail('Chỉ gửi duyệt lại đề cử “Cần chỉnh sửa”.');
    Object.assign(d, { so_nam_kinh_nghiem: data.so_nam_kinh_nghiem === '' ? null : Number(data.so_nam_kinh_nghiem), muc_luong_mong_muon: data.muc_luong_mong_muon ? Number(data.muc_luong_mong_muon) : null,
      notice_period: data.notice_period, ghi_chu: [d.ghi_chu, `Đã chỉnh sửa: ${data.ghi_chu || '—'}`].join(' | '), trang_thai: ST.DC.CHO, ngay_duyet: null });
    Store.save(); return { ok: true };
  },
  /** 8d — Gỡ ứng viên khỏi danh sách (chưa gửi khách hàng) */
  removeRecommendation(id) {
    const d = Store.get('de_cu', id); const deny = Q.denyCt(Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an)); if (deny) return fail(deny);
    if (![ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai)) return fail('Chỉ gỡ đề cử chưa gửi khách hàng.');
    d.trang_thai = ST.DC.GO; const hs = Q.hs(d.ma_ho_so_ung_vien);
    const prev = Q.history(hs.id).filter((h) => h.trang_thai_moi !== ST.HS.DECU).at(-1)?.trang_thai_moi || ST.HS.APPLY;
    logStatus(hs, prev, `Gỡ khỏi danh sách đề cử ${d.dot_de_cu}`); Store.save(); return { ok: true };
  },
  /** UC_07 — Gửi khách hàng (BR7-1) */
  /** opt: { dinh_kem_cv, dinh_kem_ds, dinh_dang_ds: 'xlsx' | 'sheet', loi_nhan } — mỗi vị trí ghi một lần gửi (GUI_KHACH_HANG) */
  sendToClient(ids, opt = {}) {
    const sent = [], err = [];
    const deny = ids.map((id) => Q.denyCt(Q.ct(Q.hs(Store.get('de_cu', id).ma_ho_so_ung_vien).ma_chi_tiet_du_an))).find(Boolean); if (deny) return fail(deny);
    const cv = opt.dinh_kem_cv !== false, ds = opt.dinh_kem_ds !== false;
    if (!cv && !ds) return fail('Chọn ít nhất một loại tệp đính kèm khi gửi khách hàng.');
    ids.forEach((id) => { const d = Store.get('de_cu', id); if (d.trang_thai !== ST.DC.DUYET) { err.push(d); return; } d.trang_thai = ST.DC.GUI; d.ngay_gui_khach_hang = nowISO(); sent.push(d); });
    if (!sent.length) return fail('Đề cử cần được Quản lý duyệt trước khi gửi khách hàng.');
    const files = [];
    Object.values(groupBy(sent, (d) => Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an)).forEach((list) => {
      const ct = Q.ct(Q.hs(list[0].ma_ho_so_ung_vien).ma_chi_tiet_du_an); const tep = ds ? Q.recListFile(ct, list[0].dot_de_cu, opt.dinh_dang_ds) : null; if (tep) files.push(tep);
      Store.insert('gui_khach_hang', { ma_chi_tiet_du_an: ct.id, ma_nguoi_gui: Auth.user?.id ?? list[0].ma_nguoi_tao, ngay_gui: nowISO(), so_ung_vien: list.length, dinh_kem_cv: cv ? 1 : 0,
        tep_danh_sach: tep, loi_nhan: String(opt.loi_nhan || '').trim() || null, ds_de_cu: list.map((d) => d.id).join(',') });
    });
    Store.save(); return { ok: true, sent: sent.length, blocked: err.length, files };
  },
  /** UC_07 — Ghi nhận phản hồi khách hàng (BR7-2, BR7-3) */
  clientFeedback(id, type, reason) {
    const d = Store.get('de_cu', id); const deny = Q.denyCt(Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an)); if (deny) return fail(deny);
    if (d.trang_thai !== ST.DC.GUI) return fail('Đề cử chưa ở trạng thái “Đã gửi khách hàng”.');
    if (!type) return fail('Chọn phản hồi của khách hàng.');
    if (d.phan_hoi_khach_hang) return fail('Đề cử đã có phản hồi.');
    if (type === 'Từ chối ứng viên' && !reason) return bad({ ly_do_loai: 'Nhập lý do loại ứng viên.' });
    Object.assign(d, { phan_hoi_khach_hang: type, ngay_phan_hoi: nowISO(), ly_do_loai: reason || null });
    const hs = Q.hs(d.ma_ho_so_ung_vien);
    if (type === 'Từ chối ứng viên') logStatus(hs, ST.HS.LOAI, 'Khách hàng từ chối: ' + reason);
    Store.save(); return { ok: true };
  },

  /* ===== UC_10 Lịch phỏng vấn — BR10-1..6 =====
     Lịch do khách hàng chốt → hệ thống KHÔNG đổi giờ. Nhân viên phỏng vấn mặc định là người phụ trách dự án;
     trùng lịch là lỗi (không lưu, đề nghị nhân viên khác); các cảnh báo xếp lịch cần người dùng xác nhận. */
  saveInterview(hsId, data, id = null) {
    const hs = Q.hs(hsId); const ct = Q.ct(hs?.ma_chi_tiet_du_an); const e = {};
    if (!ct || !Q.assignees(ct.id).length) return fail('Dự án chưa có nhân viên phụ trách — cần Quản lý phân công trước khi lên lịch phỏng vấn.');
    const deny = Q.denyCt(ct); if (deny) return fail('Chỉ nhân viên phụ trách vị trí mới được tạo, sửa hoặc hủy lịch phỏng vấn.');
    if (!id) {
      const dc = Q.latestDeCu(hs.id);
      const allowed = hs.trang_thai === ST.HS.PV || (hs.trang_thai === ST.HS.DECU && dc?.phan_hoi_khach_hang === 'Đồng ý phỏng vấn');
      if (!allowed) return fail('Chỉ lên lịch khi khách hàng đã đồng ý phỏng vấn (hồ sơ “Đề cử”) hoặc hồ sơ đang “Phỏng vấn”.');
      if (Q.kqTd(hs.id)) return fail('Hồ sơ đã có kết quả tuyển dụng — không lên thêm lịch phỏng vấn.');
      const p = Q.pendingIv(hs);
      if (p) return fail(`Ứng viên đang có lịch phỏng vấn vòng ${p.vong} (${fmtTime(p.thoi_gian_bat_dau)}–${fmtTime(p.thoi_gian_ket_thuc)} ngày ${fmtDate(p.thoi_gian_bat_dau)}) chưa ghi nhận kết quả — chỉ lên lịch buổi tiếp theo khi buổi này đã kết thúc và có kết quả.`);
      // Khách hàng yêu cầu thêm buổi với ứng viên đã Đạt → bắt buộc ghi rõ yêu cầu
      if (Q.extraRoundReason(hs) && !String(data.ghi_chu || '').trim()) e.ghi_chu = 'Ghi rõ yêu cầu phỏng vấn bổ sung của khách hàng.';
    }
    [...(data.bd_iso && data.kt_iso ? [] : ['ngay', 'gio_bd', 'gio_kt']), 'hinh_thuc', 'ma_nhan_su'].forEach((k) => { if (!data[k]) e[k] = 'Bắt buộc nhập.'; });
    // Trình duyệt gửi kèm mốc thời gian ISO (đúng múi giờ người dùng); dự phòng ghép ngày + giờ
    const at = (iso, d, t) => { const x = iso ? new Date(iso) : d && t ? new Date(`${d}T${t}`) : null; return x && !isNaN(x) ? x : null; };
    const bd = at(data.bd_iso, data.ngay, data.gio_bd); const kt = at(data.kt_iso, data.ngay, data.gio_kt);
    if (bd && kt && kt <= bd) e.gio_kt = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    if (data.hinh_thuc === 'Trực tuyến' && !/^https?:\/\//i.test(data.dia_diem_link || '')) e.dia_diem_link = 'Phỏng vấn trực tuyến cần đường dẫn hợp lệ.';
    if (data.hinh_thuc === 'Trực tiếp' && !data.dia_diem_link) e.dia_diem_link = 'Nhập địa điểm phỏng vấn.';
    // Khu vực của địa điểm phỏng vấn trực tiếp: khu vực ghi trong địa chỉ phải khớp khu vực đã chọn
    let kv = null;
    if (data.hinh_thuc === 'Trực tiếp') {
      const inText = Q.regionInText(data.dia_diem_link); kv = Number(data.ma_khu_vuc) || inText;
      if (!kv) e.ma_khu_vuc = 'Chọn khu vực của địa điểm phỏng vấn.';
      else if (inText && inText !== kv) e.dia_diem_link = `Địa điểm ghi ở ${Store.name('khu_vuc', inText)} nhưng khu vực đã chọn là ${Store.name('khu_vuc', kv)}.`;
    }
    if (bd && kt && kt > bd) {
      const cc = Q.candidateCheck({ uvId: hs.ma_ung_vien, bd, kt, exceptId: id });
      if (cc.length) e.gio_bd = `Ứng viên đã có buổi phỏng vấn ${Q.candidateClash(cc[0])} — buổi trước phải kết thúc trước giờ bắt đầu buổi sau ít nhất ${Q.CANDIDATE_GAP} phút.`;
    }
    const ns = Q.ns(data.ma_nhan_su);
    if (data.ma_nhan_su && (!ns || ns.trang_thai_lam_viec !== 'Đang làm việc')) e.ma_nhan_su = 'Nhân viên phỏng vấn phải đang làm việc.';
    else if (ns && !App.seeding && !Q.team(ct.id).some((n) => n.id === ns.id)) e.ma_nhan_su = 'Chỉ chọn nhân sự phụ trách hoặc hỗ trợ của vị trí. Cần thêm người — hãy báo Quản lý phân công người hỗ trợ.';
    else if (ns && kv && Q.regionMismatch(ns, data.hinh_thuc, kv)) e.ma_nhan_su = Q.regionMismatch(ns, data.hinh_thuc, kv);
    if (Object.keys(e).length) return bad(e);
    // Bước 2–3: kiểm tra trùng lịch của nhân viên phỏng vấn (lỗi) và cảnh báo xếp lịch
    const chk = Q.scheduleCheck({ nsId: ns.id, bd, kt, hinh_thuc: data.hinh_thuc, ctId: ct.id, kv, exceptId: id });
    if (chk.conflicts.length) {
      const c = chk.conflicts[0]; const cu = Q.uv(Q.hs(c.ma_ho_so_ung_vien).ma_ung_vien);
      return { ok: false, conflict: true, free: Q.freeInterviewers({ bd, kt, hinh_thuc: data.hinh_thuc, ctId: ct.id, kv, exceptId: id }).slice(0, 6),
        errors: { ma_nhan_su: `Trùng lịch: ${ns.ho_ten} đã có buổi phỏng vấn ${cu.ho_ten} (${fmtTime(c.thoi_gian_bat_dau)}–${fmtTime(c.thoi_gian_ket_thuc)} ${fmtDate(c.thoi_gian_bat_dau)}). Không thể lưu — hãy chọn nhân viên khác; thời gian giữ nguyên vì do khách hàng quyết định.` } };
    }
    if (chk.warnings.length && !data.xac_nhan_canh_bao) return { ok: false, needConfirm: true, warnings: chk.warnings };
    const row = { ma_nhan_su: Number(data.ma_nhan_su), thoi_gian_bat_dau: bd.toISOString(), thoi_gian_ket_thuc: kt.toISOString(), hinh_thuc: data.hinh_thuc, dia_diem_link: data.dia_diem_link, ma_khu_vuc: kv,
      nguoi_tham_gia_cong_ty: data.nguoi_tham_gia_cong_ty || '', nguoi_tham_gia_khach_hang: data.nguoi_tham_gia_khach_hang || '',
      nguoi_tham_gia: [data.nguoi_tham_gia_cong_ty, data.nguoi_tham_gia_khach_hang].filter(Boolean).join(', ') || data.nguoi_tham_gia || '' };
    if (!id) row.ghi_chu = String(data.ghi_chu || '').trim() || null;
    if (id) { const l = Store.get('lich_phong_van', id); if (l.trang_thai !== ST.LICH.LEN) return fail('Chỉ sửa lịch “Đã lên lịch”.'); Object.assign(l, row); Store.save(); return { ok: true, row: l }; }
    const vong = Q.lichOfHs(hs.id).filter((l) => l.trang_thai !== ST.LICH.HUY).length + 1;
    const l = Store.insert('lich_phong_van', { ma_ho_so_ung_vien: hs.id, ...row, trang_thai: ST.LICH.LEN, vong });
    if (hs.trang_thai !== ST.HS.PV) logStatus(hs, ST.HS.PV, `Lên lịch phỏng vấn vòng ${vong} – ${fmtDT(bd)} – NV phỏng vấn: ${ns.ho_ten}`);
    else if (row.ghi_chu) logStatus(hs, ST.HS.PV, `Lên lịch phỏng vấn bổ sung vòng ${vong} theo yêu cầu khách hàng – ${fmtDT(bd)}: ${row.ghi_chu}`);
    Store.save(); return { ok: true, row: l, warnings: chk.warnings };
  },
  cancelInterview(id, reason) {
    const l = Store.get('lich_phong_van', id);
    const deny = Q.denyCt(Q.ct(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an)); if (deny) return fail('Chỉ nhân viên phụ trách vị trí mới được hủy lịch phỏng vấn.');
    if (l.trang_thai !== ST.LICH.LEN) return fail('Chỉ hủy lịch “Đã lên lịch”.');
    if (!reason) return fail('Nhập lý do hủy lịch.');
    l.trang_thai = ST.LICH.HUY; l.ly_do_huy = reason;
    Store.save(); return { ok: true };
  },
  /** UC_11 — Kết quả phỏng vấn & feedback (BR11-1..3) */
  interviewResult(lichId, data) {
    const l = Store.get('lich_phong_van', lichId); const e = {};
    if (!Q.canRecordIv(l)) return fail('Chỉ nhân viên phụ trách vị trí hoặc nhân viên phỏng vấn buổi này mới được ghi nhận kết quả.');
    if (Q.kqPv(l.id)) return fail('Lịch đã có kết quả phỏng vấn.');
    if (l.trang_thai === ST.LICH.HUY) return fail('Lịch đã bị hủy.');
    if (new Date(l.thoi_gian_bat_dau) > now()) return fail('Buổi phỏng vấn chưa diễn ra.');
    if (!data.ket_qua) e.ket_qua = 'Chọn kết quả.';
    if (data.diem_danh_gia !== '' && (isNaN(data.diem_danh_gia) || Number(data.diem_danh_gia) < 0 || Number(data.diem_danh_gia) > 10)) e.diem_danh_gia = 'Điểm từ 0 đến 10.';
    if (Object.keys(e).length) return bad(e);
    // Không đạt khi hồ sơ còn buổi phỏng vấn khác đang chờ → người dùng phải xác nhận hủy (không tự hủy ngầm)
    const pending = Q.pendingRounds(l);
    if (data.ket_qua === 'Không đạt' && pending.length && !data.xac_nhan_huy_lich) return { ok: false, needConfirm: true, pending: pending.map(Q.lichBrief) };
    Store.insert('ket_qua_phong_van', { ma_lich: l.id, ket_qua: data.ket_qua, diem_danh_gia: data.diem_danh_gia === '' ? null : Math.round(Number(data.diem_danh_gia) * 10) / 10, nhan_xet: data.nhan_xet, ngay_ghi_nhan: nowISO() });
    if (data.feedback) Store.insert('feedback', { ma_lich: l.id, nguon_feedback: 'Khách hàng', noi_dung: data.feedback, ngay_gui: nowISO() });
    l.trang_thai = ST.LICH.XONG;
    const hs = Q.hs(l.ma_ho_so_ung_vien);
    if (data.ket_qua === 'Không đạt') {
      logStatus(hs, ST.HS.LOAI, `Không đạt phỏng vấn vòng ${l.vong}${data.nhan_xet ? ': ' + data.nhan_xet : ''}`);
      pending.forEach((x) => { x.trang_thai = ST.LICH.HUY; x.ly_do_huy = `Hủy theo xác nhận của ${Auth.user?.ho_ten || 'nhân viên'}: ứng viên không đạt vòng ${l.vong}`; });
    } else logStatus(hs, ST.HS.PV, data.ket_qua === 'Đạt' ? `Đạt phỏng vấn vòng ${l.vong} — chờ kết quả tuyển dụng từ khách hàng` : `Cần phỏng vấn thêm sau vòng ${l.vong}`);
    Store.save(); return { ok: true };
  },
  /** UC_11 1c — sửa kết quả phỏng vấn đã ghi nhận */
  updateInterviewResult(lichId, data) {
    const l = Store.get('lich_phong_van', lichId); const kq = Q.kqPv(l.id); const e = {};
    if (!Q.canRecordIv(l)) return fail('Chỉ nhân viên phụ trách vị trí hoặc nhân viên phỏng vấn buổi này mới được sửa kết quả.');
    if (!kq) return fail('Lịch chưa có kết quả để sửa.');
    const hs = Q.hs(l.ma_ho_so_ung_vien);
    const later = Q.lichOfHs(hs.id).some((x) => x.id !== l.id && x.trang_thai !== ST.LICH.HUY && x.thoi_gian_bat_dau > l.thoi_gian_bat_dau);
    if (Q.kqTd(hs.id)) return fail('Hồ sơ đã có kết quả tuyển dụng — không sửa được kết quả phỏng vấn.');
    if (data.ket_qua !== kq.ket_qua && later) return fail('Đã có vòng phỏng vấn sau — chỉ sửa được điểm và nhận xét.');
    if (!data.ket_qua) e.ket_qua = 'Chọn kết quả.';
    if (data.diem_danh_gia !== '' && (isNaN(data.diem_danh_gia) || Number(data.diem_danh_gia) < 0 || Number(data.diem_danh_gia) > 10)) e.diem_danh_gia = 'Điểm từ 0 đến 10.';
    if (Object.keys(e).length) return bad(e);
    const changed = data.ket_qua !== kq.ket_qua;
    const pending = changed && data.ket_qua === 'Không đạt' ? Q.pendingRounds(l) : [];
    if (pending.length && !data.xac_nhan_huy_lich) return { ok: false, needConfirm: true, pending: pending.map(Q.lichBrief) };
    pending.forEach((x) => { x.trang_thai = ST.LICH.HUY; x.ly_do_huy = `Hủy theo xác nhận của ${Auth.user?.ho_ten || 'nhân viên'}: ứng viên không đạt vòng ${l.vong}`; });
    Object.assign(kq, { ket_qua: data.ket_qua, diem_danh_gia: data.diem_danh_gia === '' ? null : Math.round(Number(data.diem_danh_gia) * 10) / 10, nhan_xet: data.nhan_xet });
    if (data.feedback) Store.insert('feedback', { ma_lich: l.id, nguon_feedback: 'Khách hàng', noi_dung: data.feedback, ngay_gui: nowISO() });
    if (changed) logStatus(hs, data.ket_qua === 'Không đạt' ? ST.HS.LOAI : ST.HS.PV, `Sửa kết quả phỏng vấn vòng ${l.vong}: ${data.ket_qua}`);
    Store.save(); return { ok: true };
  },
  addFeedback(lichId, content, source = 'Khách hàng') { if (!Q.canRecordIv(Store.get('lich_phong_van', lichId))) return fail('Chỉ nhân viên phụ trách hoặc nhân viên phỏng vấn buổi này mới được thêm feedback.'); if (!content) return fail('Nhập nội dung feedback.'); Store.insert('feedback', { ma_lich: Number(lichId), nguon_feedback: source, noi_dung: content, ngay_gui: nowISO() }); Store.save(); return { ok: true }; },

  /* ===== UC_09 Kết quả tuyển dụng — BR9-1..6 ===== */
  hiringResult(hsId, data) {
    const hs = Q.hs(hsId); const e = {};
    const deny = Q.denyCt(Q.ct(hs.ma_chi_tiet_du_an)); if (deny) return fail(deny);
    if (Q.kqTd(hs.id)) return fail('Hồ sơ đã có kết quả tuyển dụng.');
    if (hs.trang_thai !== ST.HS.PV) return fail('Chỉ ghi nhận kết quả khi hồ sơ ở trạng thái “Phỏng vấn”.');
    if (!data.ket_qua) e.ket_qua = 'Chọn kết quả.';
    if (data.ket_qua === 'Chấp nhận offer' && !data.ngay_nhan_viec) e.ngay_nhan_viec = 'Nhập ngày nhận việc.';
    if (data.ket_qua === 'Từ chối offer' && !data.ly_do_tu_choi) e.ly_do_tu_choi = 'Nhập lý do từ chối.';
    if (!data.ngay_khach_hang_bao) e.ngay_khach_hang_bao = 'Nhập ngày khách hàng báo.';
    if (Object.keys(e).length) return bad(e);
    Store.insert('ket_qua_tuyen_dung', { ma_ho_so_ung_vien: hs.id, ket_qua: data.ket_qua, ngay_nhan_viec: data.ngay_nhan_viec || null, ly_do_tu_choi: data.ly_do_tu_choi || null,
      email_xac_nhan: data.email_xac_nhan || '', ngay_khach_hang_bao: data.ngay_khach_hang_bao, ghi_chu: data.ghi_chu || '', ngay_ghi_nhan: nowISO() });
    const ct = Q.ct(hs.ma_chi_tiet_du_an); let withdrawn = 0;
    if (data.ket_qua === 'Chấp nhận offer') {
      logStatus(hs, ST.HS.TV, `Chấp nhận offer — nhận việc ${fmtDate(data.ngay_nhan_viec)}`);
      const uv = Q.uv(hs.ma_ung_vien); uv.trang_thai = ST.UV.TV; // BR9-6: không còn xuất hiện trong kết quả lọc
      // Loại bỏ ứng viên đã nhận việc khỏi MỌI danh sách đề cử/đề xuất khác (Notes §3 — điểm demo trọng tâm)
      withdrawn = Svc._withdrawActive(uv, `Tự động loại: ứng viên đã nhận việc tại ${Q.ctLabel(ct)}`, hs.id);
    } else logStatus(hs, ST.HS.LOAI, 'Từ chối offer: ' + data.ly_do_tu_choi);
    recalcCt(ct); Store.save();
    return { ok: true, withdrawn, ctStatus: ct.trang_thai };
  },
  /** Luồng thử việc không đạt → ứng viên quay lại bể hồ sơ (Notes §3) */
  probationFailed(hsId, note) {
    const hs = Q.hs(hsId); const deny = Q.denyCt(Q.ct(hs.ma_chi_tiet_du_an)); if (deny) return fail(deny);
    if (hs.trang_thai !== ST.HS.TV) return fail('Hồ sơ không ở trạng thái Thử việc.');
    if (!note) return fail('Nhập lý do / ghi chú.');
    logStatus(hs, ST.HS.LOAI, 'Thử việc không đạt: ' + note);
    const uv = Q.uv(hs.ma_ung_vien);
    if (!DB.ho_so_ung_tuyen.some((h) => h.ma_ung_vien === uv.id && h.trang_thai === ST.HS.TV)) uv.trang_thai = ST.UV.HD;
    const ct = Q.ct(hs.ma_chi_tiet_du_an); recalcCt(ct); Store.save();
    return { ok: true, ctStatus: ct.trang_thai };
  },
  /** Đổi trạng thái thủ công (UC_09 1a) — chỉ các chuyển hợp lệ */
  manualStatus(hsId, status, note) {
    const hs = Q.hs(hsId); const deny = hs.ma_chi_tiet_du_an && Q.denyCt(Q.ct(hs.ma_chi_tiet_du_an)); if (deny) return fail(deny);
    const allowed = { [ST.HS.APPLY]: [ST.HS.LOAI], [ST.HS.DECU]: [ST.HS.LOAI], [ST.HS.PV]: [ST.HS.LOAI], [ST.HS.LOAI]: [ST.HS.APPLY], [ST.HS.TV]: [] }[hs.trang_thai] || [];
    if (!allowed.includes(status)) return fail(`Không cho phép chuyển “${hs.trang_thai}” → “${status}” thủ công. Hãy dùng đúng nghiệp vụ (đề cử / phỏng vấn / kết quả tuyển dụng).`);
    if (!note) return fail('Nhập ghi chú cho lần thay đổi.');
    if (status === ST.HS.APPLY && Q.uv(hs.ma_ung_vien).trang_thai !== ST.UV.HD) return fail('Ứng viên không ở trạng thái Hoạt động.');
    if (status === ST.HS.LOAI) { Q.deCuOfHs(hs.id).filter((d) => [ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai)).forEach((d) => (d.trang_thai = ST.DC.GO)); Q.lichOfHs(hs.id).filter((l) => l.trang_thai === ST.LICH.LEN).forEach((l) => { l.trang_thai = ST.LICH.HUY; l.ly_do_huy = 'Hồ sơ chuyển Bị loại: ' + note; }); }
    logStatus(hs, status, note); Store.save(); return { ok: true };
  },
};

/* ---------- Báo cáo — UC_12 (BR12-1..6) ---------- */
const Reports = {
  inRange(d, f) { if (!d) return false; const s = toDateStr(d); return (!f.from || s >= f.from) && (!f.to || s <= f.to); },
  /** Mốc cuối kỳ: ngày "Đến ngày" (không vượt quá hôm nay) */
  endOf(f) { const t = todayStr(); return f.to && f.to < t ? f.to : t; },
  /** Vị trí thuộc kỳ báo cáo: thời gian tuyển dụng (ngày tiếp nhận → hạn hoàn thành) giao với kỳ */
  inPeriod(ct, f) { return (!f.to || toDateStr(ct.ngay_tao) <= f.to) && (!f.from || toDateStr(ct.han_hoan_thanh) >= f.from); },
  /** Số ứng viên nhận việc (đang thử việc) tính đến hết ngày `end` — dựa vào lịch sử trạng thái */
  hiredAsOf(ctId, end) {
    return Q.hsOfCt(ctId).filter((h) => Q.history(h.id).filter((x) => toDateStr(x.thoi_diem_thay_doi) <= end).at(-1)?.trang_thai_moi === ST.HS.TV).length;
  },
  scopeCts(f) {
    return DB.chi_tiet_du_an.filter((ct) => {
      const da = Q.da(ct.ma_du_an);
      if (f.ctId && ct.id !== f.ctId) return false;
      if (!f.ctId && !this.inPeriod(ct, f)) return false;
      if (f.kh && da.ma_khach_hang !== Number(f.kh)) return false;
      if (f.vt && !norm(ct.vi_tri).includes(norm(f.vt))) return false;
      if (f.ns && !DB.phan_cong.some((p) => p.ma_chi_tiet_du_an === ct.id && p.ma_nhan_su === Number(f.ns))) return false;
      return true;
    });
  },
  /** Tiến độ từng vị trí trong kỳ: nhận việc lũy kế đến cuối kỳ; đề cử, phỏng vấn phát sinh trong kỳ */
  progress(f) {
    const end = this.endOf(f); const live = end === todayStr();
    return this.scopeCts(f).filter((ct) => ct.trang_thai !== ST.CT.HUY || this.inRange(ct.ngay_tao, f)).map((ct) => {
      const hired = this.hiredAsOf(ct.id, end); const hsIds = new Set(Q.hsOfCt(ct.id).map((h) => h.id));
      const decu = DB.de_cu.filter((d) => hsIds.has(d.ma_ho_so_ung_vien) && d.trang_thai !== ST.DC.GO && this.inRange(d.ngay_tao, { ...f, to: end })).length;
      const pv = DB.lich_phong_van.filter((l) => hsIds.has(l.ma_ho_so_ung_vien) && l.trang_thai !== ST.LICH.HUY && this.inRange(l.thoi_gian_bat_dau, { ...f, to: end })).length;
      const lateDays = toDateStr(ct.han_hoan_thanh) < end && hired < ct.so_luong && ![ST.CT.DONG, ST.CT.HUY].includes(ct.trang_thai) ? Math.round((new Date(end) - new Date(toDateStr(ct.han_hoan_thanh))) / DAY) : 0;
      return { ct, da: Q.da(ct.ma_du_an), kh: Q.khOfCt(ct), hired, pct: Math.min(100, Math.round((hired / ct.so_luong) * 100)), dl: live ? Q.deadline(ct) : lateDays ? { level: 'red', text: `Quá hạn ${lateDays} ngày` } : null,
        lateDays, decu, pv, staff: Q.assignees(ct.id).map((n) => n.ho_ten).join(', '), status: live ? ct.trang_thai : hired >= ct.so_luong ? ST.CT.XONG : ct.trang_thai === ST.CT.XONG ? ST.CT.DANG : ct.trang_thai };
    });
  },
  /** Vị trí trễ hạn tính đến cuối kỳ: đã qua hạn hoàn thành mà chưa đủ chỉ tiêu (không tính vị trí Đã đóng / Đã hủy) */
  overdue(f) { return this.progress(f).filter((r) => r.lateDays > 0); },
  /** Gom các dòng vị trí theo dự án tuyển dụng */
  byProject(rows) {
    return Object.values(groupBy(rows, (r) => r.ct.ma_du_an)).map((list) => {
      const can = sum(list.map((r) => r.ct.so_luong)); const nhan = sum(list.map((r) => Math.min(r.ct.so_luong, r.hired)));
      return { da: list[0].da, kh: list[0].kh, list, can, nhan, pct: can ? Math.round((nhan / can) * 100) : 0, decu: sum(list.map((r) => r.decu)), pv: sum(list.map((r) => r.pv)),
        han: list.map((r) => toDateStr(r.ct.han_hoan_thanh)).sort().at(-1), staff: [...new Set(list.flatMap((r) => r.staff.split(', ').filter(Boolean)))].join(', '),
        lateDays: Math.max(0, ...list.map((r) => r.lateDays)), status: list.every((r) => CT_CLOSED.includes(r.status)) ? 'Hoàn thành' : 'Đang thực hiện' };
    }).sort((a, b) => a.da.id - b.da.id);
  },
  byCustomer(f) {
    const cts = this.scopeCts(f); const g = groupBy(cts, (c) => Q.da(c.ma_du_an).ma_khach_hang);
    return Object.entries(g).map(([khId, list]) => ({
      kh: Q.kh(khId), duan: new Set(list.map((c) => c.ma_du_an)).size, vitri: list.length, can: sum(list.filter((c) => c.trang_thai !== ST.CT.HUY).map((c) => c.so_luong)),
      nhan: sum(list.map((c) => Q.hired(c.id))), dang: list.filter((c) => [ST.CT.MOI, ST.CT.DANG].includes(c.trang_thai)).length, xong: list.filter((c) => c.trang_thai === ST.CT.XONG).length,
      tre: list.filter((c) => Q.deadline(c)?.level === 'red').length,
    })).sort((a, b) => b.vitri - a.vitri);
  },
  hiring(f) {
    const ids = new Set(this.scopeCts(f).map((c) => c.id));
    return DB.ket_qua_tuyen_dung.filter((k) => ids.has(Q.hs(k.ma_ho_so_ung_vien)?.ma_chi_tiet_du_an) && (!f.from && !f.to || this.inRange(k.ngay_khach_hang_bao, f)))
      .map((k) => { const hs = Q.hs(k.ma_ho_so_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an); return { k, hs, uv: Q.uv(hs.ma_ung_vien), ct, kh: Q.khOfCt(ct) }; });
  },
  /** BR12-2: tỷ lệ chuyển đổi theo các mốc trạng thái đã đạt tới (dựa vào lịch sử) */
  conversion(f) {
    const ids = new Set(this.scopeCts(f).map((c) => c.id));
    const hs = DB.ho_so_ung_tuyen.filter((h) => ids.has(h.ma_chi_tiet_du_an) && (!f.from && !f.to || this.inRange(h.ngay_apply, f)));
    const reached = (s) => hs.filter((h) => Q.history(h.id).some((x) => x.trang_thai_moi === s)).length;
    return [
      { label: 'Mới apply', value: hs.length, color: '#22b4e6' }, { label: 'Đề cử', value: reached(ST.HS.DECU), color: '#7c3aed' },
      { label: 'Phỏng vấn', value: reached(ST.HS.PV), color: '#d97706' }, { label: 'Thử việc', value: reached(ST.HS.TV), color: '#12a150' },
    ];
  },
  /** BR12-4: hiệu suất đề cử của nhân viên trong kỳ */
  staffPerf(f) {
    return DB.nhan_su.filter((n) => n.vai_tro === ROLES.NV && (!f.ns || n.id === Number(f.ns)) && (n.trang_thai_lam_viec === 'Đang làm việc' || DB.de_cu.some((d) => d.ma_nguoi_tao === n.id))).map((n) => {
      const dcs = DB.de_cu.filter((d) => d.ma_nguoi_tao === n.id && (!f.from && !f.to || this.inRange(d.ngay_tao, f)));
      const hsIds = new Set(dcs.map((d) => d.ma_ho_so_ung_vien));
      const pv = DB.lich_phong_van.filter((l) => l.ma_nhan_su === n.id && l.trang_thai === ST.LICH.XONG && (!f.from && !f.to || this.inRange(l.thoi_gian_bat_dau, f))).length;
      const hired = [...hsIds].filter((id) => Q.hs(id).trang_thai === ST.HS.TV).length;
      const approved = dcs.filter((d) => [ST.DC.DUYET, ST.DC.GUI].includes(d.trang_thai)).length;
      const accepted = dcs.filter((d) => d.phan_hoi_khach_hang === 'Đồng ý phỏng vấn').length;
      const sent = dcs.filter((d) => d.trang_thai === ST.DC.GUI).length;
      return { n, duan: DB.phan_cong.filter((p) => p.ma_nhan_su === n.id && p.trang_thai === 'Đang phụ trách').length, decu: dcs.length, approved, sua: dcs.filter((d) => d.ghi_chu?.includes('Yêu cầu sửa')).length,
        sent, accepted, pv, hired, rateApprove: dcs.length ? Math.round((approved / dcs.length) * 100) : 0, rateClient: sent ? Math.round((accepted / sent) * 100) : 0, dcs };
    }).sort((a, b) => b.hired - a.hired || b.decu - a.decu);
  },
};

/* ---------- Thông báo / đếm cho menu ---------- */
const Shell = {
  counts() {
    if (!Store.db || !Auth.user) return {};
    const cts = Auth.canWork() ? Q.visibleCts() : []; const ctIds = new Set(cts.map((c) => c.id)); const t = todayStr();
    return {
      choPhanCong: DB.chi_tiet_du_an.filter((c) => c.trang_thai === ST.CT.MOI).length,
      gopYMoi: Auth.isQL() ? new Set((DB.gop_y_de_cu || []).filter((g) => g.trang_thai !== 'Đã xem').map((g) => g.ma_de_cu)).size : 0,
      choDuyet: DB.de_cu.filter((d) => d.trang_thai === ST.DC.CHO).length,
      canSua: DB.de_cu.filter((d) => d.trang_thai === ST.DC.SUA && d.ma_nguoi_tao === Auth.user.id).length,
      choGan: DB.ho_so_ung_tuyen.filter((h) => !h.ma_chi_tiet_du_an && h.trang_thai === ST.HS.APPLY).length,
      chuaChuanHoa: DB.ung_vien.filter((u) => !u.ma_nhan_su && u.trang_thai === ST.UV.HD).length,
      pvHomNay: DB.lich_phong_van.filter((l) => l.trang_thai === ST.LICH.LEN && toDateStr(l.thoi_gian_bat_dau) === t && (Auth.isLead() || (ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an) && Q.lichVisible(l)))).length,
      yeuCauHoTro: Auth.isQL() ? Q.supportRequests().length : 0,
    };
  },
  notifications() {
    if (!Auth.canWork()) return [];
    const out = []; const c = this.counts();
    Q.visibleCts().forEach((ct) => { const dl = Q.deadline(ct); if (dl) out.push({ ic: 'clock', tone: dl.level, title: `${ct.vi_tri} — ${dl.text}`, desc: `${Code.ct(ct.id)} · ${Q.khOfCt(ct)?.ten_cong_ty} · ${Q.hired(ct.id)}/${ct.so_luong} đã nhận việc`, href: '#/du-an/' + ct.id }); });
    if (Auth.isQL() && c.gopYMoi) out.push({ ic: 'info', tone: 'violet', title: `${c.gopYMoi} đề cử có góp ý mới của Ban Giám đốc`, desc: 'Xem góp ý trong Danh sách đề cử', href: '#/de-cu' });
    if (Auth.isQL()) Q.supportRequests().forEach((y) => { const ct = Q.ct(y.ma_chi_tiet_du_an); out.push({ ic: 'users', tone: 'red', title: `${Q.ns(y.ma_nguoi_gui)?.ho_ten} đề nghị bổ sung người hỗ trợ`, desc: `${ct.vi_tri} (${Code.ct(ct.id)}): ${y.noi_dung}`, href: '#/du-an/' + ct.id }); });
    if (Auth.isQL() && c.choPhanCong) out.push({ ic: 'userCheck', tone: 'blue', title: `${c.choPhanCong} vị trí mới tiếp nhận chờ phân công`, desc: 'Phân công nhân viên phụ trách để bắt đầu thực hiện', href: '#/du-an?tab=phan-cong' });
    if (Auth.isQL() && c.choDuyet) out.push({ ic: 'send', tone: 'amber', title: `${c.choDuyet} đề cử chờ duyệt`, desc: 'Duyệt hoặc yêu cầu chỉnh sửa trước khi gửi khách hàng', href: '#/de-cu?tab=cho-duyet' });
    if (c.canSua) out.push({ ic: 'edit', tone: 'red', title: `${c.canSua} đề cử cần chỉnh sửa`, desc: 'Quản lý đã yêu cầu chỉnh sửa', href: '#/de-cu?tab=can-sua' });
    if (c.pvHomNay) out.push({ ic: 'calendar', tone: 'violet', title: `${c.pvHomNay} buổi phỏng vấn hôm nay`, desc: 'Xem lịch và chuẩn bị tham gia cùng khách hàng', href: '#/phong-van' });
    if (c.choGan) out.push({ ic: 'inbox', tone: 'amber', title: `${c.choGan} hồ sơ apply chờ gán dự án`, desc: 'Mã tin chưa đối chiếu được với dự án nào', href: '#/thu-thap?tab=cho-gan' });
    return out;
  },
  toggleNotifications() {
    if ($('.dropdown.notif')) return $$('.dropdown').forEach((d) => d.remove()); $$('.dropdown').forEach((d) => d.remove());
    const list = this.notifications(); const tone = { red: 'tone-red', amber: 'tone-amber', blue: 'tone-blue', violet: 'tone-violet' };
    const dd = document.createElement('div'); dd.className = 'dropdown notif';
    dd.innerHTML = `<div class="dd-head">Thông báo <span class="badge blue">${list.length}</span></div>` + (list.length ? list.map((n) => `<div class="dd-item" data-href="${n.href}"><span class="ico ${tone[n.tone]}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none">${icon(n.ic, 'sm')}</span><div><div class="strong small">${esc(n.title)}</div><div class="muted small">${esc(n.desc)}</div></div></div>`).join('') : emptyState('Không có thông báo mới', 'bell'));
    document.body.appendChild(dd); $$('.dd-item', dd).forEach((i) => (i.onclick = () => { dd.remove(); Router.go(i.dataset.href); }));
  },
  toggleUserMenu() {
    if ($('.dropdown.umenu')) return $$('.dropdown').forEach((d) => d.remove()); $$('.dropdown').forEach((d) => d.remove());
    const dd = document.createElement('div'); dd.className = 'dropdown umenu'; dd.style.width = '260px';
    dd.innerHTML = `<div class="dd-head"><div><div>${esc(Auth.user.ho_ten)}</div><div class="muted small" style="font-weight:500">${esc(Auth.user.email)}</div></div></div>
      <div class="menu-item" data-act="settings">${icon('settings', 'sm')} Cài đặt</div>
      <div class="menu-item" data-act="logout" style="color:var(--red)">${icon('logout', 'sm')} Đăng xuất</div>`;
    document.body.appendChild(dd);
    $('[data-act=settings]', dd).onclick = () => { dd.remove(); Router.go('#/cai-dat'); };
    $('[data-act=logout]', dd).onclick = () => Auth.logout();
  },
};
