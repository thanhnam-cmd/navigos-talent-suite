/* ==========================================================
   dialogs.js — Hộp thoại nghiệp vụ (biểu mẫu + kiểm tra dữ liệu)
   ========================================================== */
const submitForm = (m, fn) => { const f = m.$('form'); const go = (e) => { e && e.preventDefault(); const r = fn(Form.values(f)); if (r && !r.ok) { if (r.errors) Form.showErrors(f, r.errors); else if (r.error) toast(r.error, 'err'); } }; f.onsubmit = go; m.$('[data-submit]') && (m.$('[data-submit]').onclick = go); };
const foot = (label = 'Lưu', cls = 'primary') => `<button class="btn" data-close>Hủy</button><button class="btn ${cls}" data-submit>${label}</button>`;
const doneThen = (m, msg, then) => (r) => { toast(msg); m.close(); Store.save(); then ? then(r) : UI.refresh(); };

const Dlg = {
  /* ----- Dự án tuyển dụng (UC_04 bước 1) ----- */
  project(id = null, then) {
    const d = id ? Q.da(id) : {};
    const m = modal({ title: id ? 'Cập nhật dự án tuyển dụng' : 'Tạo dự án tuyển dụng cho khách hàng', foot: foot(),
      body: `<form class="form-grid" novalidate>
        ${Form.field('Khách hàng', 'ma_khach_hang', { req: true, value: d.ma_khach_hang, opts: [['', '— Chọn khách hàng —'], ...DB.khach_hang.filter((k) => k.trang_thai_hop_tac === 'Đang hợp tác' || k.id === d.ma_khach_hang).map((k) => [k.id, k.ten_cong_ty])], full: true })}
        ${Form.field('Tên dự án tuyển dụng', 'ten_du_an', { req: true, value: d.ten_du_an, ph: 'VD: Tuyển dụng khối Công nghệ 2026', full: true })}
        ${Form.field('Ngày bắt đầu', 'ngay_bat_dau', { type: 'date', req: true, value: d.ngay_bat_dau || todayStr() })}
        ${Form.field('Ngày kết thúc (dự kiến)', 'ngay_ket_thuc', { type: 'date', value: d.ngay_ket_thuc || '' })}
        ${Form.field('Ghi chú', 'ghi_chu', { type: 'textarea', value: d.ghi_chu, full: true })}
        <div class="full callout">${icon('info', 'sm')}<div>Hệ thống <b>không quản lý hợp đồng kinh tế hay doanh thu</b> — phần này do bộ phận khác phụ trách. Sau khi tạo, hãy thêm các vị trí (chi tiết dự án).</div></div></form>` });
    submitForm(m, (v) => { const r = Svc.saveProject(v, id); if (r.ok) { doneThen(m, id ? 'Đã cập nhật dự án' : `Đã tạo dự án ${Code.da(r.row.id)}`, then || (() => { UI.refresh(); if (!id) Dlg.position(null, r.row.id); }))(r); } return r; });
  },
  /* ----- Vị trí / chi tiết dự án (UC_04 bước 2-6) ----- */
  position(id = null, daId = null) {
    const c = id ? Q.ct(id) : { ma_du_an: daId };
    const das = DB.du_an_tuyen_dung.filter((d) => d.trang_thai === 'Đang thực hiện' || d.id === c.ma_du_an);
    if (!das.length) return toast('Chưa có dự án tuyển dụng. Hãy tạo dự án tuyển dụng trước.', 'warn');
    const m = modal({ size: 'lg', title: id ? `Cập nhật vị trí ${Code.ct(id)}` : 'Tiếp nhận yêu cầu tuyển dụng — thêm vị trí', foot: foot(id ? 'Lưu thay đổi' : 'Lưu vị trí'),
      body: `<form class="form-grid" novalidate>
        <div class="field full"><label>Dự án tuyển dụng của khách hàng <span class="req">*</span></label><div class="row" style="flex-wrap:nowrap"><select class="select" name="ma_du_an">${[['', '— Chọn dự án tuyển dụng —'], ...das.map((d) => [d.id, `${Code.da(d.id)} · ${d.ten_du_an} — ${Q.kh(d.ma_khach_hang).ten_cong_ty}`])].map(([a, b]) => `<option value="${a}" ${String(a) === String(c.ma_du_an ?? '') ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>${id ? '' : `<button type="button" class="btn" id="qNewDa" title="Tạo dự án tuyển dụng mới">${icon('plus', 'sm')}</button>`}</div></div>
        ${Form.field('Vị trí tuyển dụng', 'vi_tri', { req: true, value: c.vi_tri, ph: 'VD: Senior Java Backend Engineer', full: true })}
        ${Form.field('Mô tả công việc', 'mo_ta_cong_viec', { type: 'textarea', value: c.mo_ta_cong_viec, full: true })}
        ${Form.field('Số lượng cần tuyển', 'so_luong', { type: 'number', req: true, value: c.so_luong ?? 1, attrs: 'min="1"' })}
        ${Form.field('Hình thức làm việc', 'hinh_thuc', { req: true, value: c.hinh_thuc || 'Toàn thời gian', opts: ['Toàn thời gian', 'Bán thời gian', 'Hợp đồng'] })}
        ${Form.field('Mức lương tối đa (VND)', 'muc_luong_toi_da', { type: 'number', value: c.muc_luong_toi_da ?? '', ph: 'VD: 40000000' })}
        ${Form.field('Hạn hoàn thành', 'han_hoan_thanh', { type: 'date', req: true, value: c.han_hoan_thanh || '', attrs: id ? '' : `min="${todayStr()}"` })}
        ${Form.field('Cấp bậc', 'ma_cap_bac', { req: true, value: c.ma_cap_bac, opts: Form.opts('cap_bac', { blank: '— Chọn —' }) })}
        ${Form.field('Chuyên môn', 'ma_chuyen_mon', { req: true, value: c.ma_chuyen_mon, opts: Form.opts('chuyen_mon', { blank: '— Chọn —' }) })}
        ${Form.field('Khu vực làm việc', 'ma_khu_vuc', { req: true, value: c.ma_khu_vuc, opts: kvOpts(), hint: 'Dùng để gợi ý nhân viên cùng khu vực khi phân công.' })}
        ${id ? '' : `<div class="full callout">${icon('info', 'sm')}<div>Vị trí mới được lưu ở trạng thái <b>Mới tiếp nhận</b>; Quản lý phân công nhân viên phụ trách để chuyển sang <b>Đang thực hiện</b>.</div></div>`}</form>` });
    m.$('#qNewDa') && (m.$('#qNewDa').onclick = () => { m.close(); Dlg.project(); });
    submitForm(m, (v) => { const r = Svc.savePosition(v, id); if (r.ok) doneThen(m, id ? 'Đã cập nhật vị trí' : `Đã lưu vị trí ${Code.ct(r.row.id)} — trạng thái Mới tiếp nhận`, () => (id ? UI.refresh() : Router.go('#/du-an/' + r.row.id)))(r); return r; });
  },
  parentDetail(daId) {
    const d = Q.da(daId); const cts = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === d.id);
    const m = modal({ size: 'lg', title: `${Code.da(d.id)} · ${esc(d.ten_du_an)}`,
      foot: `<button class="btn" id="eDa">${icon('edit', 'sm')} Sửa thông tin</button><button class="btn primary" id="addCt">${icon('plus', 'sm')} Thêm vị trí</button>`,
      body: `<dl class="kv"><dt>Khách hàng</dt><dd>${esc(Q.kh(d.ma_khach_hang).ten_cong_ty)}</dd><dt>Ngày bắt đầu</dt><dd>${fmtDate(d.ngay_bat_dau)}${d.ngay_ket_thuc ? ' → ' + fmtDate(d.ngay_ket_thuc) : ''}</dd><dt>Trạng thái</dt><dd>${badge(d.trang_thai)}</dd><dt>Ghi chú</dt><dd>${esc(d.ghi_chu || '—')}</dd></dl>
        <div class="mt"><div class="prog-meta"><span>Tiến độ = tổng ứng viên đã nhận việc / tổng số lượng cần tuyển (BR4-5)</span><b>${d.tien_do}%</b></div>${progressBar(d.tien_do, d.tien_do >= 100 ? 'green' : '')}</div>
        <div class="table-wrap mt"><table class="table responsive"><thead><tr><th>Vị trí</th><th class="num">Cần</th><th class="num">Nhận việc</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>
        ${cts.map((c) => `<tr class="clickable" data-ct="${c.id}"><td class="cell-main"><div class="t-title">${esc(c.vi_tri)}</div><div class="t-sub">${Code.ct(c.id)}</div></td><td data-label="Cần" class="num">${c.so_luong}</td><td data-label="Nhận việc" class="num">${Q.hired(c.id)}</td><td data-label="Hạn">${fmtDate(c.han_hoan_thanh)}</td><td data-label="Trạng thái">${badge(c.trang_thai)}</td></tr>`).join('') || `<tr><td colspan="5">${emptyState('Chưa có vị trí')}</td></tr>`}</tbody></table></div>` });
    m.$('#addCt').onclick = () => { m.close(); Dlg.position(null, d.id); };
    m.$('#eDa').onclick = () => { m.close(); Dlg.project(d.id); };
    m.$$('[data-ct]').forEach((tr) => (tr.onclick = () => { m.close(); Router.go('#/du-an/' + tr.dataset.ct); }));
  },
  /* ----- Phân công (UC_05) ----- */
  assign(ctId) {
    const ct = Q.ct(ctId); const cur = new Set(Q.assignees(ct.id).map((n) => n.id)); const list = Svc.suggestStaff(ct);
    const m = modal({ title: `Phân công phụ trách — ${esc(ct.vi_tri)}`, foot: foot('Phân công'),
      body: `<form novalidate><p class="muted small" style="margin-top:0">Khu vực vị trí: <b>${esc(Store.name('khu_vuc', ct.ma_khu_vuc))}</b>. Có thể chọn nhiều nhân viên (3a). Bỏ chọn nhân viên hiện tại để chuyển phân công — phân công cũ được giữ với trạng thái “Đã chuyển” (BR5-4).</p>
        <div class="stack">${list.map(({ n, sameArea, load }) => `<label class="alert" style="cursor:pointer"><input type="checkbox" name="s_${n.id}" ${cur.has(n.id) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary)"><div class="person" style="flex:1">${avatar(n.ho_ten, 'sm')}<div><div class="nm small">${esc(n.ho_ten)} ${sameArea ? '<span class="badge sm green">Cùng khu vực</span>' : ''}</div><div class="sb">${esc(n.chuc_vu)} · ${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</div></div></div><span class="badge ${load >= 3 ? 'amber' : ''} sm">${load} vị trí đang phụ trách</span></label>`).join('')}</div></form>` });
    submitForm(m, (v) => { const ids = Object.entries(v).filter(([k, x]) => k.startsWith('s_') && x).map(([k]) => Number(k.slice(2))); const r = Svc.assign(ct.id, ids, true); if (r.ok) doneThen(m, 'Đã lưu phân công — vị trí chuyển “Đang thực hiện”')(r); return r; });
  },
  /* ----- Gắn mã tin đăng (UC_04 6a) ----- */
  posting(ctId) {
    const ct = Q.ct(ctId); const tins = DB.tin_dang.filter((t) => t.ma_chi_tiet_du_an === ct.id);
    const m = modal({ title: 'Gắn mã tin đăng của kênh tuyển dụng', foot: foot('Gắn mã tin'),
      body: `<form class="form-grid" novalidate>
        ${Form.field('Kênh đăng tuyển', 'ma_kenh', { req: true, opts: [['', '— Chọn kênh —'], ...DB.kenh_dang_tuyen.filter((k) => k.trang_thai === 'Hoạt động' && k.loai !== 'noi_bo').map((k) => [k.id, k.ten_kenh])] })}
        ${Form.field('Mã tin đăng trên kênh', 'ma_tin_kenh', { req: true, ph: 'VD: VNW-58231' })}
        ${Form.field('Ngày đăng', 'ngay_dang', { type: 'date', value: todayStr() })}
        <div class="full callout">${icon('zap', 'sm')}<div>Hồ sơ apply mang mã tin này sẽ được hệ thống <b>tự động gắn</b> vào vị trí <b>${Code.ct(ct.id)}</b>. Hồ sơ đang ở danh sách chờ gán có cùng mã cũng được gắn ngay.</div></div>
        ${tins.length ? `<div class="full"><div class="field"><label>Tin đã gắn</label></div>${tins.map((t) => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--border)"><span><span class="code">${esc(t.ma_tin_kenh)}</span> ${esc(Store.get('kenh_dang_tuyen', t.ma_kenh).ten_kenh)} · ${fmtDate(t.ngay_dang)}</span><span class="row">${badge(t.trang_thai, 'sm')}${t.trang_thai === 'Đang đăng' ? `<button type="button" class="btn xs" data-rm="${t.id}">Gỡ tin</button>` : ''}</span></div>`).join('')}</div>` : ''}</form>` });
    m.$('[name=ma_kenh]').onchange = (e) => { const k = Store.get('kenh_dang_tuyen', e.target.value); if (k && !m.$('[name=ma_tin_kenh]').value) m.$('[name=ma_tin_kenh]').value = k.tien_to + '-'; };
    m.$$('[data-rm]').forEach((b) => (b.onclick = () => { Svc.removePosting(Number(b.dataset.rm)); toast('Đã gỡ tin đăng'); m.close(); UI.refresh(); }));
    submitForm(m, (v) => { const r = Svc.attachPosting(ct.id, v); if (r.ok) doneThen(m, `Đã gắn mã tin ${r.row.ma_tin_kenh}` + (r.matched ? ` · tự động gắn ${r.matched} hồ sơ chờ gán` : ''))(r); return r; });
  },
  /* ----- Đề cử ----- */
  requestEdit(dcId, then) { confirmBox({ title: 'Yêu cầu chỉnh sửa đề cử', okText: 'Gửi yêu cầu', message: 'Đề cử chuyển “Cần chỉnh sửa”; lý do được lưu vào ghi chú để nhân viên chỉnh sửa.', input: { label: 'Lý do / nội dung cần sửa', required: true, placeholder: 'Chỉ rõ cần sửa đổi ở đâu…' }, onOk: (r) => { const x = Svc.requestEdit(dcId, r); if (!x.ok) { toast(x.error, 'err'); return false; } toast('Đã yêu cầu chỉnh sửa'); then ? then() : UI.refresh(); } }); },
  resubmit(dcId, then) {
    const d = Store.get('de_cu', dcId);
    const m = modal({ title: `Chỉnh sửa đề cử ${Code.dc(d.id)}`, foot: foot('Gửi duyệt lại'),
      body: `<div class="callout red mb">${icon('info', 'sm')}<div>${esc(d.ghi_chu)}</div></div><form class="form-grid" novalidate>
        ${Form.field('Số năm kinh nghiệm', 'so_nam_kinh_nghiem', { type: 'number', value: d.so_nam_kinh_nghiem ?? '' })}
        ${Form.field('Mức lương mong muốn (VND)', 'muc_luong_mong_muon', { type: 'number', value: d.muc_luong_mong_muon ?? '' })}
        ${Form.field('Notice period', 'notice_period', { value: d.notice_period })}
        ${Form.field('Nội dung đã chỉnh sửa', 'ghi_chu', { type: 'textarea', full: true })}</form>` });
    submitForm(m, (v) => { const r = Svc.resubmitRecommendation(dcId, v); if (r.ok) doneThen(m, 'Đã gửi duyệt lại', then)(r); return r; });
  },
  clientFeedback(dcId, then) {
    const m = modal({ title: 'Ghi nhận phản hồi của khách hàng', foot: foot(),
      body: `<form class="stack" novalidate>
        <div class="field"><label>Phản hồi <span class="req">*</span></label><div class="chip-group" id="fbType">${['Đồng ý phỏng vấn', 'Từ chối ứng viên', 'Cần đề cử đợt tiếp theo'].map((t) => `<button type="button" class="chip" data-v="${t}">${t}</button>`).join('')}</div><input type="hidden" name="type"></div>
        <div id="lyDo" hidden>${Form.field('Lý do loại ứng viên', 'ly_do_loai', { type: 'textarea' })}</div>
        <div class="callout small">${icon('info', 'sm')}<div>“Đồng ý phỏng vấn”: giữ hồ sơ Đề cử và chuyển sang lên lịch. “Từ chối”: hồ sơ chuyển Bị loại. “Cần đề cử đợt tiếp theo”: giữ hồ sơ, tạo đợt đề cử mới.</div></div></form>` });
    m.$$('#fbType .chip').forEach((c) => (c.onclick = () => { m.$$('#fbType .chip').forEach((x) => x.classList.remove('active')); c.classList.add('active'); m.$('[name=type]').value = c.dataset.v; m.$('#lyDo').hidden = c.dataset.v !== 'Từ chối ứng viên'; }));
    submitForm(m, (v) => { const r = Svc.clientFeedback(dcId, v.type, v.ly_do_loai); if (r.ok) doneThen(m, 'Đã lưu phản hồi khách hàng', then || (() => { UI.refresh(); if (v.type === 'Đồng ý phỏng vấn') Dlg.interview(Store.get('de_cu', dcId).ma_ho_so_ung_vien); }))(r); return r; });
  },
  /* ----- Phỏng vấn (UC_10, UC_11) ----- */
  /** UC_10 — Lịch do khách hàng chốt; NV phỏng vấn mặc định là người phụ trách dự án; trùng lịch → chọn NV khác */
  interview(hsId, lichId = null, then) {
    const hs = Q.hs(hsId); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an); const l = lichId ? Store.get('lich_phong_van', lichId) : null;
    const asg = Q.assignees(ct.id);
    if (!asg.length) return toast('Dự án chưa có nhân viên phụ trách — cần Quản lý phân công trước khi lên lịch phỏng vấn.', 'warn');
    const defNs = l?.ma_nhan_su || Q.defaultInterviewer(ct).id;
    const others = DB.nhan_su.filter((n) => n.trang_thai_lam_viec === 'Đang làm việc' && n.vai_tro === ROLES.NV && !asg.some((a) => a.id === n.id));
    const optLabel = (n, tag) => `${n.ho_ten} — ${Store.name('khu_vuc', n.ma_khu_vuc)}${tag}`;
    const staffOpts = [...asg.map((n) => [n.id, optLabel(n, ' · phụ trách dự án')]), ...others.map((n) => [n.id, optLabel(n, n.ma_khu_vuc === ct.ma_khu_vuc ? ' · cùng khu vực' : '')])];
    const def = l ? new Date(l.thoi_gian_bat_dau) : (() => { const d = new Date(now()); d.setDate(d.getDate() + 1); if ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + (d.getDay() === 6 ? 2 : 1)); d.setHours(9, 0, 0, 0); return d; })();
    const defEnd = l ? new Date(l.thoi_gian_ket_thuc) : new Date(def.getTime() + 3600000);
    const R = Q.rules();
    const m = modal({ size: 'lg', title: l ? 'Cập nhật lịch phỏng vấn' : `Lên lịch phỏng vấn — ${esc(uv.ho_ten)}`, foot: foot(l ? 'Lưu thay đổi' : 'Lưu lịch'),
      body: `<div class="callout mb">${icon('info', 'sm')}<div><b>${esc(ct.vi_tri)}</b> · ${esc(Q.khOfCt(ct).ten_cong_ty)} · ${esc(Store.name('khu_vuc', ct.ma_khu_vuc))}<br>
          Nhập đúng lịch <b>khách hàng đã chốt</b> — hệ thống không tự đổi giờ. Nhân viên phỏng vấn mặc định là <b>người phụ trách dự án</b>; nếu bị trùng lịch, hãy chọn nhân viên khác (BR10-5).</div></div>
        <form class="form-grid" novalidate>
        ${Form.field('Ngày phỏng vấn (khách hàng chốt)', 'ngay', { type: 'date', req: true, value: toDateStr(def) })}
        ${Form.field('Nhân viên phỏng vấn', 'ma_nhan_su', { req: true, value: defNs, opts: staffOpts, hint: 'Có thể chủ động chọn nhân viên khác đang làm việc (3a).' })}
        ${Form.field('Giờ bắt đầu', 'gio_bd', { type: 'time', req: true, value: fmtTime(def) })}
        ${Form.field('Giờ kết thúc', 'gio_kt', { type: 'time', req: true, value: fmtTime(defEnd) })}
        ${Form.field('Hình thức', 'hinh_thuc', { req: true, value: l?.hinh_thuc || 'Trực tuyến', opts: ['Trực tuyến', 'Trực tiếp'] })}
        ${Form.field('Đường dẫn / Địa điểm', 'dia_diem_link', { req: true, value: l?.dia_diem_link || '', ph: 'https://meet.google.com/… hoặc địa chỉ văn phòng khách hàng' })}
        ${Form.field('Người tham gia — phía công ty', 'nguoi_tham_gia_cong_ty', { value: l ? l.nguoi_tham_gia_cong_ty || '' : `${Q.ns(defNs).ho_ten} (Navigos)` })}
        ${Form.field('Người tham gia — phía khách hàng', 'nguoi_tham_gia_khach_hang', { value: l ? l.nguoi_tham_gia_khach_hang || '' : Q.khOfCt(ct).nguoi_lien_he })}
        <div class="full" id="ivCheck"></div></form>
        <p class="muted small" style="margin:10px 0 0">Quy tắc đang áp dụng: nghỉ tối thiểu ${R.khoang_nghi_phut}′ giữa hai buổi · di chuyển khác khu vực ${R.di_chuyen_phut}′ · giờ làm việc ${R.gio_bat_dau}–${R.gio_ket_thuc}${Number(R.canh_bao_cuoi_tuan) ? ' · cảnh báo cuối tuần' : ''} · tối đa ${R.so_buoi_toi_da} buổi/ngày.</p>` });
    const f = m.$('form');
    const times = () => { const v = Form.values(f); const bd = v.ngay && v.gio_bd ? new Date(`${v.ngay}T${v.gio_bd}`) : null; const kt = v.ngay && v.gio_kt ? new Date(`${v.ngay}T${v.gio_kt}`) : null; return { v, bd, kt }; };
    // Bước 2: kiểm tra trùng lịch & cảnh báo ngay khi nhập (cùng quy tắc với máy chủ)
    const check = () => {
      const { v, bd, kt } = times(); const box = m.$('#ivCheck');
      if (!bd || !kt || isNaN(bd) || isNaN(kt) || kt <= bd || !v.ma_nhan_su) { box.innerHTML = ''; return; }
      const chk = Q.scheduleCheck({ nsId: v.ma_nhan_su, bd, kt, hinh_thuc: v.hinh_thuc, ctId: ct.id, exceptId: lichId });
      if (chk.conflicts.length) {
        const free = Q.freeInterviewers({ bd, kt, hinh_thuc: v.hinh_thuc, ctId: ct.id, exceptId: lichId }).slice(0, 6);
        box.innerHTML = `<div class="callout red">${icon('alert', 'sm')}<div><b>Trùng lịch — không thể lưu.</b> ${esc(Q.ns(v.ma_nhan_su).ho_ten)} đã có: ${chk.conflicts.map((c) => `${fmtTime(c.thoi_gian_bat_dau)}–${fmtTime(c.thoi_gian_ket_thuc)} (${esc(Q.uv(Q.hs(c.ma_ho_so_ung_vien).ma_ung_vien).ho_ten)})`).join(', ')}.
          <div class="mt-sm">Chọn nhân viên khác đang rảnh trong khung giờ này:</div>
          <div class="chip-group mt-sm">${free.map((x) => `<button type="button" class="chip" data-ns="${x.id}">${esc(x.ho_ten)} · ${esc(x.khu_vuc)}${x.canh_bao ? ` · ${x.canh_bao} cảnh báo` : ''}</button>`).join('') || '<span class="small">Không còn nhân viên nào rảnh — hãy trao đổi lại với khách hàng.</span>'}</div></div></div>`;
        m.$$('[data-ns]').forEach((b) => (b.onclick = () => { f.ma_nhan_su.value = b.dataset.ns; f.ma_nhan_su.dispatchEvent(new Event('change')); }));
      } else if (chk.warnings.length) {
        box.innerHTML = `<div class="callout amber">${icon('alert', 'sm')}<div><b>Cảnh báo xếp lịch (${chk.warnings.length})</b> — vẫn lưu được sau khi xác nhận (BR10-6):<ul style="margin:6px 0 0;padding-left:18px">${chk.warnings.map((w) => `<li><b>${esc(w.loai)}:</b> ${esc(w.text)}</li>`).join('')}</ul></div></div>`;
      } else box.innerHTML = `<div class="callout green">${icon('checkCircle', 'sm')}<div>Không trùng lịch, không có cảnh báo — sẵn sàng lưu.</div></div>`;
    };
    let prevNs = Number(defNs);
    f.ma_nhan_su.addEventListener('change', () => { // đổi nhân viên phỏng vấn → cập nhật danh sách người tham gia
      const a = Q.ns(prevNs)?.ho_ten, b = Q.ns(f.ma_nhan_su.value)?.ho_ten; if (a && b && f.nguoi_tham_gia_cong_ty.value.includes(a)) f.nguoi_tham_gia_cong_ty.value = f.nguoi_tham_gia_cong_ty.value.replace(a, b); prevNs = Number(f.ma_nhan_su.value);
    });
    ['ngay', 'gio_bd', 'gio_kt', 'hinh_thuc', 'ma_nhan_su'].forEach((k) => f[k].addEventListener('change', check));
    ['gio_bd', 'gio_kt'].forEach((k) => f[k].addEventListener('input', check));
    check();
    const done = doneThen(m, l ? 'Đã cập nhật lịch phỏng vấn' : 'Đã lưu lịch — hồ sơ chuyển “Phỏng vấn”', then);
    submitForm(m, () => {
      const { v, bd, kt } = times();
      const payload = { ...v, bd_iso: bd && !isNaN(bd) ? bd.toISOString() : '', kt_iso: kt && !isNaN(kt) ? kt.toISOString() : '' };
      const r = Svc.saveInterview(hs.id, payload, lichId);
      if (r.ok) { done(r); return r; }
      if (r.conflict) { check(); return r; } // bước 3: báo trùng lịch, đề nghị chọn nhân viên khác
      if (r.needConfirm) { // 4c: cảnh báo → người dùng xác nhận để lưu
        confirmBox({ title: 'Xác nhận lưu lịch có cảnh báo', okText: 'Xác nhận & lưu',
          message: `<ul style="margin:0;padding-left:18px">${r.warnings.map((w) => `<li><b>${esc(w.loai)}:</b> ${esc(w.text)}</li>`).join('')}</ul><p class="small muted">Lịch do khách hàng quyết định nên hệ thống không đổi giờ. Bạn có thể quay lại để chọn nhân viên khác.</p>`,
          onOk: () => { const r2 = Svc.saveInterview(hs.id, { ...payload, xac_nhan_canh_bao: true }, lichId); if (!r2.ok) { toast(r2.error || 'Không lưu được lịch.', 'err'); return; } done(r2); } });
        return { ok: true };
      }
      return r;
    });
  },
  /** UC_11 — Ghi nhận / sửa kết quả phỏng vấn (mẫu "Ghi nhận kết quả phỏng vấn" — Fix Demo lần 1) */
  interviewResult(lichId, then, { edit = false } = {}) {
    const l = Store.get('lich_phong_van', lichId); const hs = Q.hs(l.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
    const kq = Q.kqPv(l.id); const fbs = Q.feedbacks(l.id);
    const m = modal({ title: edit ? 'Sửa kết quả phỏng vấn' : 'Ghi nhận kết quả phỏng vấn', foot: foot(edit ? 'Lưu thay đổi' : 'Lưu kết quả'),
      body: `<div class="alert mb"><div class="person" style="flex:1">${avatar(uv.ho_ten)}<div><div class="nm">${esc(uv.ho_ten)}</div><div class="sb">${Code.hs(hs.id)} · ${esc(ct.vi_tri)} · ${esc(Q.khOfCt(ct).ten_cong_ty.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, ''))}</div></div></div>
          <div style="text-align:right"><div class="strong small">${fmtDate(l.thoi_gian_bat_dau)} · ${fmtTime(l.thoi_gian_bat_dau)} – ${fmtTime(l.thoi_gian_ket_thuc)}</div><div class="muted small">Vòng ${l.vong} · ${esc(Q.ns(l.ma_nhan_su).ho_ten)}</div></div></div>
        <form class="form-grid" novalidate>
        <div class="field full"><label>Kết quả phỏng vấn <span class="req">*</span></label><div class="grid g-3" id="kq" style="gap:8px">${['Đạt', 'Không đạt', 'Cần phỏng vấn thêm'].map((t) => `<button type="button" class="btn ${kq?.ket_qua === t ? 'outline-primary' : ''}" data-v="${t}">${t}</button>`).join('')}</div><input type="hidden" name="ket_qua" value="${esc(kq?.ket_qua || '')}"></div>
        ${Form.field('Điểm (0–10)', 'diem_danh_gia', { type: 'number', value: kq?.diem_danh_gia ?? '', attrs: 'min="0" max="10" step="0.1"' })}
        ${Form.field('Nhận xét của nhân viên', 'nhan_xet', { type: 'textarea', value: kq?.nhan_xet || '' })}
        <div class="field full"><label>Feedback của khách hàng</label>
          ${fbs.map((f) => `<div class="alert" style="padding:8px 12px;margin-bottom:6px"><div><div class="ds">${esc(f.nguon_feedback)} · ${fmtDate(f.ngay_gui)}</div><div class="small">${esc(f.noi_dung)}</div></div></div>`).join('')}
          <textarea class="textarea" name="feedback" placeholder="${fbs.length ? '+ Thêm feedback mới (không bắt buộc)' : 'Nhập feedback của khách hàng'}" style="min-height:64px"></textarea></div>
        <div class="full callout small">${icon('info', 'sm')}<div><b>Đạt:</b> hồ sơ chuyển sang tab <b>Chờ ghi nhận</b> để ghi nhận offer. <b>Không đạt:</b> hồ sơ Bị loại. <b>Cần phỏng vấn thêm:</b> tạo lịch vòng tiếp theo.</div></div></form>` });
    m.$$('#kq [data-v]').forEach((c) => (c.onclick = () => { m.$$('#kq [data-v]').forEach((x) => x.classList.remove('outline-primary')); c.classList.add('outline-primary'); m.$('[name=ket_qua]').value = c.dataset.v; }));
    submitForm(m, (v) => {
      const r = edit ? Svc.updateInterviewResult(lichId, v) : Svc.interviewResult(lichId, v);
      if (r.ok) doneThen(m, edit ? 'Đã cập nhật kết quả phỏng vấn' : v.ket_qua === 'Không đạt' ? 'Đã lưu — hồ sơ chuyển “Bị loại”' : v.ket_qua === 'Đạt' ? 'Đã lưu — chuyển sang Chờ ghi nhận kết quả tuyển dụng' : 'Đã lưu — có thể tạo lịch vòng tiếp theo', then)(r);
      return r;
    });
  },
  /** Xem chi tiết phỏng vấn — chỉ xem (Quản lý, Ban Giám đốc) */
  interviewDetail(lichId) {
    const l = Store.get('lich_phong_van', lichId); const hs = Q.hs(l.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an); const kh = Q.khOfCt(ct);
    const k = Q.kqPv(l.id); const fbs = Q.feedbacks(l.id); const ns = Q.ns(l.ma_nhan_su);
    const ro = (label, val, full = false) => `<div class="field ${full ? 'full' : ''}"><label>${label}</label><div class="input" style="height:auto;min-height:40px;padding:9px 12px;background:var(--surface-2)">${val || '<span class="muted">—</span>'}</div></div>`;
    modal({ size: 'lg', title: `Chi tiết phỏng vấn — ${esc(uv.ho_ten)}`, foot: '<button class="btn primary" data-close>Đóng</button>',
      body: `<div class="callout mb">${icon('briefcase', 'sm')}<div><b>${esc(ct.vi_tri)}</b> · ${esc(kh.ten_cong_ty)} · ID vị trí ${Code.ct(ct.id)}<br>Vòng ${l.vong} · ${badge(l.trang_thai, 'sm')}</div></div>
        <div class="form-grid">
          ${ro('Ngày phỏng vấn', fmtDate(l.thoi_gian_bat_dau))}${ro('Thời gian', `${fmtTime(l.thoi_gian_bat_dau)} – ${fmtTime(l.thoi_gian_ket_thuc)}`)}
          ${ro('Hình thức', esc(l.hinh_thuc))}${ro(l.hinh_thuc === 'Trực tuyến' ? 'Đường dẫn' : 'Địa điểm', l.hinh_thuc === 'Trực tuyến' ? `<a href="${esc(l.dia_diem_link)}" target="_blank" rel="noopener">${esc(l.dia_diem_link)}</a>` : esc(l.dia_diem_link))}
          ${ro('Nhân viên phỏng vấn', `${esc(ns.ho_ten)} <span class="muted small">(${esc(Store.name('khu_vuc', ns.ma_khu_vuc))})</span>`, true)}
          ${ro('Người tham gia — phía công ty', esc(l.nguoi_tham_gia_cong_ty || ''))}${ro('Người tham gia — phía khách hàng', esc(l.nguoi_tham_gia_khach_hang || ''))}
          ${l.ly_do_huy ? ro('Lý do hủy', esc(l.ly_do_huy), true) : ''}
          ${ro('Kết quả phỏng vấn', k ? badge(k.ket_qua) : '<span class="muted">Chưa ghi nhận</span>')}${ro('Điểm', k?.diem_danh_gia != null ? `<b>${k.diem_danh_gia}</b>/10` : '')}
          ${ro('Nhận xét của nhân viên', esc(k?.nhan_xet || ''), true)}
          ${ro('Feedback của khách hàng', fbs.map((f) => `<div>• ${esc(f.noi_dung)} <span class="muted small">(${fmtDate(f.ngay_gui)})</span></div>`).join(''), true)}
        </div>` });
  },
  /** Gửi đề cử cho khách hàng — hiện thông tin khách hàng để xác nhận (Fix Demo lần 1) */
  sendToClient(ids, then) {
    const ds = ids.map((id) => Store.get('de_cu', id)).filter((d) => d.trang_thai === ST.DC.DUYET);
    if (!ds.length) return toast('Chỉ gửi được đề cử ở trạng thái Chờ gửi (đã được Quản lý duyệt).', 'warn');
    const byKh = groupBy(ds, (d) => Q.khOfCt(Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an)).id);
    confirmBox({ title: 'Xác nhận gửi đề cử cho khách hàng', okText: `Xác nhận gửi (${ds.length})`,
      message: Object.entries(byKh).map(([khId, list]) => { const k = Q.kh(khId); return `<div class="card card-pad mb" style="box-shadow:none">
        <div class="strong">${esc(k.ten_cong_ty)}</div>
        <dl class="kv mt-sm" style="grid-template-columns:110px 1fr"><dt>Người liên hệ</dt><dd>${esc(k.nguoi_lien_he)}</dd><dt>Email</dt><dd>${esc(k.email)}</dd><dt>Điện thoại</dt><dd>${esc(k.so_dien_thoai)}</dd><dt>Địa chỉ</dt><dd>${esc(k.dia_chi || '—')}</dd></dl>
        <div class="small mt-sm"><b>Ứng viên gửi:</b> ${list.map((d) => { const hs = Q.hs(d.ma_ho_so_ung_vien); return `${esc(Q.uv(hs.ma_ung_vien).ho_ten)} (${esc(Q.ct(hs.ma_chi_tiet_du_an).vi_tri)}, ${esc(d.dot_de_cu)})`; }).join('; ')}</div></div>`; }).join('') + '<p class="small muted" style="margin:0">Đề cử chuyển “Đã gửi khách hàng” và chờ phản hồi.</p>',
      onOk: () => { const r = Svc.sendToClient(ds.map((d) => d.id)); if (!r.ok) { toast(r.error, 'err'); return false; } toast(`Đã gửi ${r.sent} đề cử cho khách hàng`); then ? then() : UI.refresh(); } });
  },
  /** Ban Giám đốc góp ý đề cử → Quản lý nhận (mẫu "Góp ý về đề cử") */
  comment(dcId, then) {
    const d = Store.get('de_cu', dcId); const hs = Q.hs(d.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
    const ro = (label, val) => `<div class="field"><label>${label}</label><div class="input" style="height:auto;min-height:40px;padding:9px 12px;background:var(--surface-2)">${val || '—'}</div></div>`;
    const old = Q.comments(d.id);
    const m = modal({ drawer: true, title: `Góp ý về đề cử <div class="small muted" style="font-weight:500">${Code.dc(d.id)} · ${esc(d.dot_de_cu)} · chỉ xem thông tin</div>`,
      foot: '<button class="btn" data-close>Hủy bỏ</button><button class="btn primary" data-submit>' + icon('send', 'sm') + ' Gửi cho Quản lý</button>',
      body: `<div class="alert mb"><div class="person" style="flex:1">${avatar(uv.ho_ten)}<div><div class="nm">${esc(uv.ho_ten)}</div><div class="sb">${Code.uv(uv.id)}</div></div></div><div style="text-align:right"><div class="muted small">KẾT QUẢ CỦA QUẢN LÝ</div>${badge(d.trang_thai === ST.DC.DUYET ? 'Đã duyệt' : d.trang_thai)}</div></div>
        <form class="form-grid" novalidate>
          <div class="full">${ro('Vị trí đề cử', `${Code.ct(ct.id)} · ${esc(ct.vi_tri)} — ${esc(Q.khOfCt(ct).ten_cong_ty)}`)}</div>
          ${ro('Nhân viên đề cử', esc(Q.ns(d.ma_nguoi_tao)?.ho_ten))}${ro('Quản lý xử lý', d.ma_nguoi_duyet ? `${esc(Q.ns(d.ma_nguoi_duyet).ho_ten)} · ${fmtDT(d.ngay_duyet)}` : 'Chưa xử lý')}
          ${ro('Kinh nghiệm', d.so_nam_kinh_nghiem != null ? d.so_nam_kinh_nghiem + ' năm' : '')}${ro('Mức lương mong muốn', fmtMoney(d.muc_luong_mong_muon))}
          ${old.length ? `<div class="full field"><label>Góp ý trước đó</label>${old.map((g) => `<div class="ds">• ${esc(g.noi_dung)} <span class="muted">(${fmtDT(g.ngay_gop_y)} — ${esc(g.trang_thai)})</span></div>`).join('')}</div>` : ''}
          <div class="field full"><label style="color:var(--amber)">Ý kiến của Ban Giám đốc <span class="req">*</span></label><textarea class="textarea" name="noi_dung" placeholder="Nhập góp ý gửi Quản lý…"></textarea>
            <div class="hint">${icon('info', 'sm')} Quản lý sẽ nhận thông báo và thấy ghi chú này trên đề cử. Góp ý không làm thay đổi trạng thái đề cử.</div></div>
        </form>` });
    submitForm(m, (v) => { const r = Svc.addRecommendationComment(dcId, v.noi_dung); if (r.ok) doneThen(m, 'Đã gửi góp ý cho Quản lý', then)(r); return r; });
  },
  /** Thông tin vị trí (popup) — dùng ở Danh sách đề cử của Quản lý / BGĐ */
  positionInfo(ctId) {
    const c = Q.ct(ctId); const da = Q.da(c.ma_du_an); const kh = Q.kh(da.ma_khach_hang); const h = Q.hired(c.id);
    modal({ size: 'lg', title: `${esc(c.vi_tri)} <span class="code">${Code.ct(c.id)}</span>`, foot: `<a class="btn" href="#/du-an/${c.id}">${icon('arrowRight', 'sm')} Mở trang vị trí</a><button class="btn primary" data-close>Đóng</button>`,
      body: `<dl class="kv"><dt>Khách hàng</dt><dd>${esc(kh.ten_cong_ty)}</dd><dt>Dự án tuyển dụng</dt><dd>${esc(da.ten_du_an)} (${Code.da(da.id)})</dd><dt>Trạng thái</dt><dd>${badge(c.trang_thai)}</dd>
        <dt>Cấp bậc · Chuyên môn</dt><dd>${esc(Store.name('cap_bac', c.ma_cap_bac))} · ${esc(Store.name('chuyen_mon', c.ma_chuyen_mon))}</dd><dt>Khu vực · Hình thức</dt><dd>${esc(Store.name('khu_vuc', c.ma_khu_vuc))} · ${esc(c.hinh_thuc)}</dd>
        <dt>Số lượng · Đã nhận việc</dt><dd>${c.so_luong} · ${h}</dd><dt>Mức lương tối đa</dt><dd>${fmtMoney(c.muc_luong_toi_da)}</dd><dt>Tiếp nhận → Hạn</dt><dd>${fmtDate(c.ngay_tao)} → ${fmtDate(c.han_hoan_thanh)}</dd>
        <dt>Nhân sự phụ trách</dt><dd>${Q.assignees(c.id).map((n) => esc(n.ho_ten)).join(', ') || '—'}</dd><dt>Mô tả công việc</dt><dd>${esc(c.mo_ta_cong_viec || '—')}</dd></dl>` });
  },
  /** Đề cử trực tiếp từ hồ sơ ứng viên: gõ tên vị trí (chỉ vị trí được phân công) → Lưu (Fix Demo lần 1) */
  recommendOne(uvId) {
    const u = Q.uv(uvId);
    const cts = Q.visibleCts().filter((c) => c.trang_thai === ST.CT.DANG && Q.assignees(c.id).some((n) => n.id === Auth.user.id));
    if (!cts.length) return toast('Bạn chưa được phân công vị trí nào đang thực hiện.', 'warn');
    const items = cts.map((c) => { const hs = DB.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === u.id && h.ma_chi_tiet_du_an === c.id); return { id: c.id, label: `${c.vi_tri} — ${Q.khOfCt(c).ten_cong_ty}`, sub: `${Code.ct(c.id)} · ${hs ? 'Đã có hồ sơ: ' + hs.trang_thai : 'Chưa apply — hệ thống tạo hồ sơ ứng tuyển'}`, search: `${c.vi_tri} ${Code.ct(c.id)} ${Q.khOfCt(c).ten_cong_ty}` }; });
    const m = modal({ title: `Đề cử ${esc(u.ho_ten)} vào vị trí`, foot: foot('Lưu'),
      body: `<form class="form-grid" novalidate>
        <div class="field full ta"><label>Vị trí (được phân công) <span class="req">*</span></label><input class="input" name="ct_text" placeholder="Gõ tên vị trí, ID vị trí hoặc khách hàng…" autocomplete="off"><input type="hidden" name="ct"><div class="hint" id="ctHint">${cts.length} vị trí bạn đang phụ trách</div></div>
        ${Form.field('Đợt đề cử', 'dot_de_cu', { req: true, value: 'Đợt 1' })}
        ${Form.field('Số năm kinh nghiệm', 'exp', { type: 'number', value: u.so_nam_kinh_nghiem ?? '', attrs: 'step="0.5" min="0"' })}
        ${Form.field('Lương mong muốn (VND)', 'salary', { type: 'number', ph: 'VD: 30000000' })}
        ${Form.field('Notice period', 'notice', { value: '30 ngày' })}
        ${Form.field('Ghi chú gửi Quản lý', 'ghi_chu', { type: 'textarea', full: true, ph: 'Lý do đề cử, điểm mạnh của ứng viên… (Quản lý đọc khi duyệt)' })}</form>` });
    const f = m.$('form');
    Comp.typeahead(f.ct_text, items, (it) => {
      f.ct.value = it ? it.id : '';
      if (it) { const used = new Set(DB.de_cu.filter((d) => Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an === it.id).map((d) => d.dot_de_cu)); f.dot_de_cu.value = 'Đợt ' + Math.max(1, used.size); m.$('#ctHint').textContent = it.sub; }
    });
    submitForm(m, (v) => {
      if (!v.ct) return { ok: false, errors: { ct_text: 'Gõ và chọn một vị trí trong danh sách gợi ý.' } };
      const r = Svc.createRecommendations(Number(v.ct), [u.id], { dot_de_cu: v.dot_de_cu, ghi_chu: v.ghi_chu, per: { [u.id]: { exp: v.exp === '' ? null : Number(v.exp), salary: v.salary, notice: v.notice } } });
      if (r.errors) return r;
      if (!r.ok) return { ok: false, error: (r.skipped || []).join('; ') || r.error };
      m.close(); toast(`Đã tạo đề cử cho ${esc(u.ho_ten)} — chờ Quản lý duyệt`); Pages.recommendations.tab = 'cho-duyet'; Router.go('#/de-cu');
      return { ok: true };
    });
  },
  /** Chọn hồ sơ để lên lịch phỏng vấn — gõ tên ứng viên, hiện gợi ý (Fix Demo lần 1) */
  pickHsForInterview(ready) {
    const items = ready.map((h) => { const u = Q.uv(h.ma_ung_vien); const c = Q.ct(h.ma_chi_tiet_du_an); return { id: h.id, label: u.ho_ten, sub: `${c.vi_tri} — ${Q.khOfCt(c).ten_cong_ty} · ${Code.ct(c.id)} · ${h.trang_thai === ST.HS.PV ? 'Cần phỏng vấn thêm' : 'KH đồng ý phỏng vấn'}`, search: `${u.ho_ten} ${c.vi_tri} ${Code.ct(c.id)}` }; });
    const m = modal({ size: 'sm', title: 'Chọn hồ sơ để lên lịch', foot: foot('Tiếp tục'),
      body: `<form novalidate><div class="field ta"><label>Ứng viên <span class="req">*</span></label><input class="input" name="hs_text" placeholder="Nhập tên ứng viên…" autocomplete="off"><input type="hidden" name="hs"></div>
        <p class="muted small">Chỉ hiển thị hồ sơ khách hàng đã đồng ý phỏng vấn hoặc cần phỏng vấn thêm (${ready.length} hồ sơ).</p></form>` });
    const f = m.$('form'); Comp.typeahead(f.hs_text, items, (it) => (f.hs.value = it ? it.id : ''));
    submitForm(m, (x) => { if (!x.hs) return { ok: false, errors: { hs_text: 'Gõ tên và chọn ứng viên trong danh sách gợi ý.' } }; m.close(); Dlg.interview(Number(x.hs)); return { ok: true }; });
  },
  /* ----- Kết quả tuyển dụng (UC_09) ----- */
  hiring(hsId, then) {
    const hs = Q.hs(hsId); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
    const others = Q.hsOfUv(uv.id).filter((h) => h.id !== hs.id && HS_ACTIVE.includes(h.trang_thai));
    const m = modal({ title: `Ghi nhận kết quả tuyển dụng — ${esc(uv.ho_ten)}`, foot: foot('Lưu kết quả'),
      body: `<div class="callout mb">${icon('info', 'sm')}<div>Offer do <b>khách hàng</b> gửi trực tiếp cho ứng viên qua email. Hệ thống chỉ ghi nhận kết quả và theo dõi đến khi ứng viên bắt đầu thử việc (BR9-2).</div></div>
        <form class="form-grid" novalidate>
        <div class="field full"><label>Kết quả <span class="req">*</span></label><div class="chip-group" id="kq">${['Chấp nhận offer', 'Từ chối offer'].map((t) => `<button type="button" class="chip" data-v="${t}">${t}</button>`).join('')}</div><input type="hidden" name="ket_qua"></div>
        <div id="acc" class="full form-grid" style="padding:0">${Form.field('Ngày nhận việc', 'ngay_nhan_viec', { type: 'date' })}${Form.field('Ngày khách hàng báo', 'ngay_khach_hang_bao', { type: 'date', req: true, value: todayStr() })}</div>
        <div id="rej" class="full" hidden>${Form.field('Lý do từ chối', 'ly_do_tu_choi', { type: 'textarea' })}</div>
        <div class="field full"><label>Email xác nhận của khách hàng (đính kèm)</label><input class="input" type="file" name="email_xac_nhan" accept=".eml,.msg,.pdf,.png,.jpg"><div class="hint">Lưu làm căn cứ đối chiếu (.eml, .msg, .pdf, ảnh chụp).</div></div>
        ${Form.field('Ghi chú', 'ghi_chu', { type: 'textarea', full: true })}
        ${others.length ? `<div class="full callout amber" id="warnOthers" hidden>${icon('alert', 'sm')}<div>Ứng viên đang có <b>${others.length} hồ sơ khác</b> đang xử lý (${others.map((h) => esc(Q.ctLabel(Q.ct(h.ma_chi_tiet_du_an)))).join('; ')}). Khi chấp nhận offer, hệ thống sẽ <b>tự động loại khỏi các danh sách đề cử/phỏng vấn đó</b> và ứng viên chuyển “Đang thử việc” — không còn xuất hiện trong kết quả lọc.</div></div>` : ''}
        </form>` });
    m.$$('#kq .chip').forEach((c) => (c.onclick = () => { m.$$('#kq .chip').forEach((x) => x.classList.remove('active')); c.classList.add('active'); m.$('[name=ket_qua]').value = c.dataset.v; const acc = c.dataset.v === 'Chấp nhận offer'; m.$('[name=ngay_nhan_viec]').closest('.field').hidden = !acc; m.$('#rej').hidden = acc; m.$('#warnOthers') && (m.$('#warnOthers').hidden = !acc); }));
    submitForm(m, (v) => { const r = Svc.hiringResult(hsId, v); if (r.ok) doneThen(m, v.ket_qua === 'Chấp nhận offer' ? `Ứng viên chuyển “Đang thử việc”${r.withdrawn ? ` · đã tự động loại khỏi ${r.withdrawn} danh sách khác` : ''}${r.ctStatus === ST.CT.XONG ? ' · Vị trí đủ chỉ tiêu → Hoàn thành' : ''}` : 'Đã lưu — hồ sơ chuyển “Bị loại”, dự án tiếp tục thực hiện', then)(r); return r; });
  },
  probation(hsId, then) {
    confirmBox({ title: 'Thử việc không đạt — trả ứng viên về kho', okText: 'Xác nhận', danger: true,
      message: 'Hồ sơ chuyển “Bị loại” (ghi lịch sử), ứng viên trở lại trạng thái <b>Hoạt động</b> trong kho để tiếp tục được giới thiệu việc làm. Tiến độ vị trí được tính lại; nếu vị trí đã Hoàn thành sẽ mở lại “Đang thực hiện”.',
      input: { label: 'Lý do / thông tin từ khách hàng', required: true }, onOk: (note) => { const r = Svc.probationFailed(hsId, note); if (!r.ok) { toast(r.error, 'err'); return false; } toast('Ứng viên đã quay lại kho hồ sơ'); Store.save(); then ? then() : UI.refresh(); } });
  },
  assignPending(hsId, then) {
    const m = modal({ title: 'Gán hồ sơ vào dự án', foot: foot('Gán'), body: `<form novalidate>${Form.field('Dự án (ID)', 'ct', { req: true, opts: ctOpts() })}<p class="muted small">Mã tin của hồ sơ: <span class="code">${esc(Q.hs(hsId).ma_tin_kenh || '(trống)')}</span></p></form>` });
    submitForm(m, (v) => { const r = Svc.assignPending(hsId, v.ct); if (r.ok) doneThen(m, 'Đã gán hồ sơ vào dự án', then)(r); return r; });
  },
  /** In danh sách đề cử — đánh giá hiệu suất lọc CV của nhân viên (Notes §3) */
  printRecs(list) {
    const w = window.open('', '_blank'); if (!w) return toast('Trình duyệt chặn cửa sổ in — hãy cho phép pop-up.', 'warn');
    const rows = list.map((d, i) => { const hs = Q.hs(d.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
      return `<tr><td>${i + 1}</td><td>${esc(uv.ho_ten)}<br><small>${esc(uv.email)} · ${esc(uv.so_dien_thoai)}</small></td><td>${esc(ct.vi_tri)}<br><small>${esc(Q.khOfCt(ct).ten_cong_ty)}</small></td><td>${esc(d.dot_de_cu)}</td><td>${d.so_nam_kinh_nghiem ?? '—'}</td><td>${fmtMoney(d.muc_luong_mong_muon)}</td><td>${esc(d.notice_period || '')}</td><td>${esc(Q.ns(d.ma_nguoi_tao).ho_ten)}</td><td>${esc(d.trang_thai)}${d.phan_hoi_khach_hang ? '<br><small>' + esc(d.phan_hoi_khach_hang) + '</small>' : ''}</td><td>${esc(hs.trang_thai)}</td></tr>`; }).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Danh sách đề cử ứng viên</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#0f172a}h2{margin:0}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;vertical-align:top}th{background:#283583;color:#fff}small{color:#64748b}.head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #22b4e6;padding-bottom:10px}</style></head><body>
      <div class="head"><div><h2>DANH SÁCH ĐỀ CỬ ỨNG VIÊN</h2><div>Navigos Group Việt Nam — Navigos Search</div></div><div style="text-align:right;font-size:12px">Ngày in: ${fmtDT(new Date())}<br>Người in: ${esc(Auth.user.ho_ten)}</div></div>
      <table><thead><tr><th>#</th><th>Ứng viên</th><th>Vị trí / Khách hàng</th><th>Đợt</th><th>Năm KN</th><th>Lương mong muốn</th><th>Notice</th><th>Người đề cử</th><th>Trạng thái đề cử</th><th>Trạng thái hồ sơ</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:12px;margin-top:14px">Tổng: ${list.length} đề cử · Đã duyệt/gửi: ${list.filter((d) => [ST.DC.DUYET, ST.DC.GUI].includes(d.trang_thai)).length} · KH đồng ý phỏng vấn: ${list.filter((d) => d.phan_hoi_khach_hang === 'Đồng ý phỏng vấn').length}</p>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  },
  /* ----- Khách hàng (UC_03) ----- */
  customer(id = null) {
    const k = id ? Q.kh(id) : {};
    const m = modal({ title: id ? 'Cập nhật khách hàng' : 'Thêm khách hàng', foot: foot(),
      body: `<form class="form-grid" novalidate>
        ${Form.field('Tên công ty', 'ten_cong_ty', { req: true, value: k.ten_cong_ty, full: true })}
        ${Form.field('Lĩnh vực hoạt động', 'ma_linh_vuc', { req: true, value: k.ma_linh_vuc, opts: Form.opts('linh_vuc', { blank: '— Chọn lĩnh vực —' }) })}
        ${Form.field('Người liên hệ', 'nguoi_lien_he', { req: true, value: k.nguoi_lien_he })}
        ${Form.field('Email', 'email', { type: 'email', req: true, value: k.email })}
        ${Form.field('Số điện thoại', 'so_dien_thoai', { req: true, value: k.so_dien_thoai })}
        ${Form.field('Địa chỉ', 'dia_chi', { value: k.dia_chi, full: true })}
        ${id ? Form.field('Trạng thái hợp tác', 'trang_thai_hop_tac', { value: k.trang_thai_hop_tac, opts: ['Đang hợp tác', 'Ngừng hợp tác'], hint: 'Khách hàng đã có dự án không bị xóa — chuyển “Ngừng hợp tác” để giữ lịch sử (BR3-3).' }) : ''}</form>` });
    submitForm(m, (v) => { const r = Svc.saveCustomer(v, id); if (r.ok) doneThen(m, id ? 'Đã cập nhật khách hàng' : `Đã thêm khách hàng ${Code.kh(r.row.id)}`)(r); return r; });
  },
  /* ----- Tài khoản (UC_02) ----- */
  account(id = null) {
    const n = id ? Q.ns(id) : {};
    const m = modal({ title: id ? 'Cập nhật tài khoản' : 'Thêm tài khoản', foot: foot(),
      body: `<form class="form-grid" novalidate>
        ${Form.field('Họ tên', 'ho_ten', { req: true, value: n.ho_ten, full: true })}
        ${Form.field('Tên đăng nhập', 'ten_dang_nhap', { req: true, value: n.ten_dang_nhap, attrs: id ? 'readonly' : '' })}
        ${Form.field('Email', 'email', { type: 'email', req: true, value: n.email })}
        ${Form.field('Số điện thoại', 'so_dien_thoai', { value: n.so_dien_thoai })}
        ${Form.field('Khu vực', 'ma_khu_vuc', { req: true, value: n.ma_khu_vuc, opts: kvOpts() })}
        ${Form.field('Chức vụ', 'chuc_vu', { req: true, value: n.chuc_vu })}
        ${Form.field('Vai trò', 'vai_tro', { req: true, value: n.vai_tro || ROLES.NV, opts: Object.values(ROLES) })}
        ${id ? Form.field('Trạng thái làm việc', 'trang_thai_lam_viec', { value: n.trang_thai_lam_viec, opts: ['Đang làm việc', 'Đã nghỉ việc'] }) : `<div class="full callout">${icon('lock', 'sm')}<div>Mật khẩu khởi tạo được hệ thống sinh ngẫu nhiên, <b>lưu dạng mã hóa SHA-256</b> và chỉ hiển thị một lần.</div></div>`}</form>` });
    submitForm(m, (v) => { const r = Svc.saveAccount(v, id); if (r.ok) { m.close(); UI.refresh(); if (r.password) Dlg.showPassword(r.row, r.password); else toast('Đã cập nhật tài khoản'); } return r; });
  },
  showPassword(n, pw) { modal({ size: 'sm', title: 'Mật khẩu khởi tạo', foot: '<button class="btn primary" data-close>Đã ghi nhận</button>', body: `<p style="margin-top:0">Tài khoản <b>${esc(n.ten_dang_nhap)}</b> (${esc(n.ho_ten)})</p><div class="code" style="font-size:20px;padding:12px 16px;display:block;text-align:center;letter-spacing:.1em">${esc(pw)}</div><p class="muted small">Mật khẩu chỉ hiển thị một lần. Hãy gửi cho nhân sự qua kênh nội bộ an toàn.</p>` }); },
};
