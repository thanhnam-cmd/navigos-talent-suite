/* ==========================================================
   dialogs.js — Hộp thoại nghiệp vụ (biểu mẫu + kiểm tra dữ liệu)
   ========================================================== */
const submitForm = (m, fn) => { const f = m.$('form'); const go = (e) => { e && e.preventDefault(); const r = fn(Form.values(f)); if (r && !r.ok) { if (r.errors) Form.showErrors(f, r.errors); else if (r.error) toast(r.error, 'err'); } }; f.onsubmit = go; m.$('[data-submit]') && (m.$('[data-submit]').onclick = go); };
const foot = (label = 'Lưu', cls = 'primary') => `<button class="btn" data-close>Hủy</button><button class="btn ${cls}" data-submit>${label}</button>`;
/** Danh sách giờ 24h, bước 15 phút (07:00–21:00) — chọn bằng một lần bấm, không phải gõ SA/CH */
const timeOpts = (cur) => { const l = []; for (let mi = 7 * 60; mi <= 21 * 60; mi += 15) l.push(`${String(Math.floor(mi / 60)).padStart(2, '0')}:${String(mi % 60).padStart(2, '0')}`); if (cur && !l.includes(cur)) l.push(cur); return l.sort().map((t) => [t, t]); };
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
        <div class="mt"><div class="prog-meta"><span>Tiến độ = tổng ứng viên đã nhận việc / tổng số lượng cần tuyển</span><b>${d.tien_do}%</b></div>${progressBar(d.tien_do, d.tien_do >= 100 ? 'green' : '')}</div>
        <div class="table-wrap mt"><table class="table responsive"><thead><tr><th>Vị trí</th><th class="num">Cần</th><th class="num">Nhận việc</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>
        ${cts.map((c) => `<tr class="clickable" data-ct="${c.id}"><td class="cell-main"><div class="t-title">${esc(c.vi_tri)}</div><div class="t-sub">${Code.ct(c.id)}</div></td><td data-label="Cần" class="num">${c.so_luong}</td><td data-label="Nhận việc" class="num">${Q.hired(c.id)}</td><td data-label="Hạn">${fmtDate(c.han_hoan_thanh)}</td><td data-label="Trạng thái">${badge(c.trang_thai)}</td></tr>`).join('') || `<tr><td colspan="5">${emptyState('Chưa có vị trí')}</td></tr>`}</tbody></table></div>` });
    m.$('#addCt').onclick = () => { m.close(); Dlg.position(null, d.id); };
    m.$('#eDa').onclick = () => { m.close(); Dlg.project(d.id); };
    m.$$('[data-ct]').forEach((tr) => (tr.onclick = () => { m.close(); Router.go('#/du-an/' + tr.dataset.ct); }));
  },
  /* ----- Phân công (UC_05) ----- */
  assign(ctId) {
    const ct = Q.ct(ctId); const cur = new Map(Q.pcOf(ct.id).map((p) => [p.ma_nhan_su, p.vai_tro || PC_ROLE.PT])); const list = Svc.suggestStaff(ct);
    const reqs = Q.supportRequests(ct.id);
    const roleSel = (n) => `<select class="select" name="r_${n.id}" style="width:156px;height:34px">${[['', '— Không chọn —'], [PC_ROLE.PT, 'Phụ trách'], [PC_ROLE.HT, 'Hỗ trợ']].map(([a, b]) => `<option value="${a}" ${(cur.get(n.id) || '') === a ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
    const m = modal({ size: 'lg', title: `Phân công nhân sự — ${esc(ct.vi_tri)}`, foot: foot('Lưu phân công'),
      body: `<form novalidate>
        ${reqs.map((y) => `<div class="callout amber mb">${icon('users', 'sm')}<div><b>${esc(Q.ns(y.ma_nguoi_gui).ho_ten)}</b> đề nghị bổ sung người hỗ trợ (${fmtDT(y.ngay_gui)}): ${esc(y.noi_dung)}</div></div>`).join('')}
        <p class="muted small" style="margin-top:0">Khu vực vị trí: <b>${esc(Store.name('khu_vuc', ct.ma_khu_vuc))}</b>. Bỏ chọn một nhân viên đang tham gia để chuyển phân công — lịch sử phân công vẫn được giữ.</p>
        <div class="stack">${list.map(({ n, sameArea, load }) => `<div class="alert"><div class="person" style="flex:1">${avatar(n.ho_ten, 'sm')}<div><div class="nm small">${esc(n.ho_ten)} ${sameArea ? '<span class="badge sm green">Cùng khu vực</span>' : ''}</div><div class="sb">${esc(n.chuc_vu)} · ${esc(Store.name('khu_vuc', n.ma_khu_vuc))} · ${load} vị trí đang tham gia</div></div></div>${roleSel(n)}</div>`).join('')}</div></form>` });
    submitForm(m, (v) => {
      const pick = Object.entries(v).filter(([k, x]) => k.startsWith('r_') && x); const ids = pick.map(([k]) => Number(k.slice(2)));
      const r = Svc.assign(ct.id, ids, true, Object.fromEntries(pick.map(([k, x]) => [Number(k.slice(2)), x])));
      if (r.ok) doneThen(m, 'Đã lưu phân công')(r); return r;
    });
  },
  /** Nhân viên phụ trách đề nghị Quản lý bổ sung người hỗ trợ phỏng vấn */
  requestSupport(ctId, then) {
    const ct = Q.ct(ctId);
    const m = modal({ title: 'Báo Quản lý bổ sung người hỗ trợ', foot: foot('Gửi Quản lý'),
      body: `<form novalidate><div class="alert mb"><div><div class="strong">${esc(ct.vi_tri)}</div><div class="muted small">ID vị trí ${Code.ct(ct.id)} · ${esc(Q.khOfCt(ct).ten_cong_ty)}</div></div></div>
        ${Form.field('Nội dung đề nghị', 'noi_dung', { type: 'textarea', req: true, value: 'Nhân sự của vị trí đều trùng lịch trong khung giờ khách hàng chốt — đề nghị phân công thêm người hỗ trợ phỏng vấn.' })}</form>` });
    submitForm(m, (v) => { const r = Svc.requestSupport(ct.id, v.noi_dung); if (r.ok) doneThen(m, 'Đã gửi đề nghị — Quản lý sẽ nhận thông báo', then)(r); return r; });
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
    const asg = Q.assignees(ct.id); const kh = Q.khOfCt(ct);
    if (!asg.length) return toast('Dự án chưa có nhân viên phụ trách — cần Quản lý phân công trước khi lên lịch phỏng vấn.', 'warn');
    // Fix demo 3: chỉ chọn nhân sự của vị trí (Phụ trách / Hỗ trợ); thiếu người → báo Quản lý phân công thêm người hỗ trợ
    const team = Q.team(ct.id); const old = l && !team.some((n) => n.id === l.ma_nhan_su) ? Q.ns(l.ma_nhan_su) : null;
    const defNs = l?.ma_nhan_su || Q.defaultInterviewer(ct).id;
    const optLabel = (n) => `${n.ho_ten} — ${Store.name('khu_vuc', n.ma_khu_vuc)} · ${asg.some((a) => a.id === n.id) ? 'Phụ trách' : 'Hỗ trợ'}`;
    const staffOpts = [...team.map((n) => [n.id, optLabel(n)]), ...(old ? [[old.id, `${old.ho_ten} — không còn trong nhân sự vị trí`]] : [])];
    const chips = `<div class="dlg-chips"><span class="chip-info">${icon('briefcase', 'sm')}<label>Vị trí</label><b>${esc(ct.vi_tri)}</b></span><span class="chip-info"><label>ID vị trí</label><b>${Code.ct(ct.id)}</b></span><span class="chip-info">${icon('building', 'sm')}<label>Khách hàng</label><b>${esc(kh.ten_cong_ty)}</b></span></div>`;
    const def = l ? new Date(l.thoi_gian_bat_dau) : (() => { const d = new Date(now()); d.setDate(d.getDate() + 1); if ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + (d.getDay() === 6 ? 2 : 1)); d.setHours(9, 0, 0, 0); return d; })();
    const defEnd = l ? new Date(l.thoi_gian_ket_thuc) : new Date(def.getTime() + 3600000);
    const extra = !l && Q.extraRoundReason(hs);
    const kvDef = l?.ma_khu_vuc ?? Q.defaultIvRegion(ct);
    const kvOptsIv = DB.khu_vuc.map((k) => [k.id, k.ten]);
    const m = modal({ size: 'lg', title: `${l ? 'Cập nhật lịch phỏng vấn' : 'Lên lịch phỏng vấn'} — ${esc(uv.ho_ten)}${chips}`, foot: foot(l ? 'Lưu thay đổi' : 'Lưu lịch'),
      body: `${extra ? `<div class="callout amber mb">${icon('alert', 'sm')}<div>${esc(extra)} — buổi này sẽ là <b>vòng ${Q.lichOfHs(hs.id).filter((x) => x.trang_thai !== ST.LICH.HUY).length + 1}</b>. Ghi rõ yêu cầu của khách hàng.</div></div>` : ''}
        <form class="form-grid" novalidate>
        ${extra ? Form.field('Yêu cầu phỏng vấn bổ sung của khách hàng', 'ghi_chu', { type: 'textarea', req: true, full: true, ph: 'VD: Khách hàng muốn Giám đốc khối gặp thêm ứng viên trước khi gửi offer' }) : l?.ghi_chu ? `<div class="field full"><label>Yêu cầu phỏng vấn bổ sung</label><div>${esc(l.ghi_chu)}</div></div>` : ''}
        ${Form.field('Ngày phỏng vấn (khách hàng chốt)', 'ngay', { type: 'date', req: true, value: toDateStr(def) })}
        ${Form.field('Nhân viên phỏng vấn', 'ma_nhan_su', { req: true, value: defNs, opts: staffOpts, hint: `Nhân sự phụ trách / hỗ trợ của vị trí (${team.length} người). <a href="#" data-sup>Cần thêm người? Báo Quản lý</a>` })}
        ${Form.field('Giờ bắt đầu', 'gio_bd', { req: true, value: fmtTime(def), opts: timeOpts(fmtTime(def)) })}
        ${Form.field('Giờ kết thúc', 'gio_kt', { req: true, value: fmtTime(defEnd), opts: timeOpts(fmtTime(defEnd)) })}
        ${Form.field('Hình thức', 'hinh_thuc', { req: true, value: l?.hinh_thuc || 'Trực tuyến', opts: ['Trực tuyến', 'Trực tiếp'] })}
        ${Form.field('Khu vực địa điểm phỏng vấn', 'ma_khu_vuc', { req: true, value: kvDef, opts: kvOptsIv, hint: 'Phỏng vấn trực tiếp: nhân viên phỏng vấn phải cùng khu vực.' })}
        ${Form.field('Đường dẫn / Địa điểm', 'dia_diem_link', { req: true, full: true, value: l?.dia_diem_link || '', ph: 'https://meet.google.com/… hoặc địa chỉ văn phòng khách hàng' })}
        ${Form.field('Người tham gia — phía công ty', 'nguoi_tham_gia_cong_ty', { value: l ? l.nguoi_tham_gia_cong_ty || '' : `${Q.ns(defNs).ho_ten} (Navigos)` })}
        ${Form.field('Người tham gia — phía khách hàng', 'nguoi_tham_gia_khach_hang', { value: l ? l.nguoi_tham_gia_khach_hang || '' : Q.khOfCt(ct).nguoi_lien_he })}
        <div class="full" id="ivCheck"></div></form>` });
    m.$$('[data-sup]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); Dlg.requestSupport(ct.id, () => {}); }));
    const f = m.$('form');
    const times = () => { const v = Form.values(f); const bd = v.ngay && v.gio_bd ? new Date(`${v.ngay}T${v.gio_bd}`) : null; const kt = v.ngay && v.gio_kt ? new Date(`${v.ngay}T${v.gio_kt}`) : null; return { v, bd, kt }; };
    const kvSel = f.ma_khu_vuc; const kvBox = kvSel.closest('.field');
    const syncKv = () => { const off = f.hinh_thuc.value === 'Trực tiếp'; kvSel.disabled = !off; kvBox.style.opacity = off ? '' : '.55'; };
    // Bước 2: kiểm tra lịch ứng viên, khu vực, trùng lịch nhân viên & cảnh báo ngay khi nhập (cùng quy tắc với máy chủ)
    const check = () => {
      const { v, bd, kt } = times(); const box = m.$('#ivCheck');
      if (!bd || !kt || isNaN(bd) || isNaN(kt) || !v.ma_nhan_su) { box.innerHTML = ''; return; }
      if (kt <= bd) { box.innerHTML = `<div class="callout red">${icon('alert', 'sm')}<div>Giờ kết thúc phải sau giờ bắt đầu.</div></div>`; return; }
      const kv = v.hinh_thuc === 'Trực tiếp' ? Number(v.ma_khu_vuc) || null : null;
      const freeHtml = (title) => { const free = Q.freeInterviewers({ bd, kt, hinh_thuc: v.hinh_thuc, ctId: ct.id, kv, exceptId: lichId }).slice(0, 6);
        return free.length ? `<div class="mt-sm">${title}</div><div class="chip-group mt-sm">${free.map((x) => `<button type="button" class="chip" data-ns="${x.id}">${esc(x.ho_ten)} · ${esc(x.khu_vuc)} · ${x.vai_tro}${x.canh_bao ? ` · ${x.canh_bao} cảnh báo` : ''}</button>`).join('')}</div>`
          : `<div class="mt-sm">Không còn nhân sự nào của vị trí phù hợp trong khung giờ này.</div><button type="button" class="btn sm mt-sm" data-sup>${icon('users', 'sm')} Báo Quản lý phân công thêm người hỗ trợ</button>`; };
      const bind = () => { m.$$('[data-ns]').forEach((b) => (b.onclick = () => { f.ma_nhan_su.value = b.dataset.ns; f.ma_nhan_su.dispatchEvent(new Event('change')); })); m.$$('#ivCheck [data-sup]').forEach((b) => (b.onclick = () => Dlg.requestSupport(ct.id, () => {}))); };
      const cc = Q.candidateCheck({ uvId: uv.id, bd, kt, exceptId: lichId });
      if (cc.length) { box.innerHTML = `<div class="callout red">${icon('alert', 'sm')}<div><b>Trùng lịch ứng viên — không thể lưu.</b> ${esc(uv.ho_ten)} đã có buổi phỏng vấn ${cc.map((c) => esc(Q.candidateClash(c))).join('; ')}. Buổi trước phải kết thúc trước giờ bắt đầu buổi sau ít nhất ${Q.CANDIDATE_GAP} phút.</div></div>`; return; }
      const mis = Q.regionMismatch(Q.ns(v.ma_nhan_su), v.hinh_thuc, kv);
      if (mis) { box.innerHTML = `<div class="callout red">${icon('alert', 'sm')}<div><b>Khác khu vực — không thể lưu.</b> ${esc(mis)}${freeHtml(`Nhân sự của vị trí tại ${esc(Store.name('khu_vuc', kv))} đang rảnh:`)}</div></div>`; bind(); return; }
      const chk = Q.scheduleCheck({ nsId: v.ma_nhan_su, bd, kt, hinh_thuc: v.hinh_thuc, ctId: ct.id, kv, exceptId: lichId });
      if (chk.conflicts.length) {
        box.innerHTML = `<div class="callout red">${icon('alert', 'sm')}<div><b>Trùng lịch — không thể lưu.</b> ${esc(Q.ns(v.ma_nhan_su).ho_ten)} đã có: ${chk.conflicts.map((c) => `${fmtTime(c.thoi_gian_bat_dau)}–${fmtTime(c.thoi_gian_ket_thuc)} (${esc(Q.uv(Q.hs(c.ma_ho_so_ung_vien).ma_ung_vien).ho_ten)})`).join(', ')}.
          ${freeHtml('Chọn nhân sự khác của vị trí đang rảnh trong khung giờ này:')}</div></div>`;
        bind();
      } else if (chk.warnings.length) {
        box.innerHTML = `<div class="callout amber">${icon('alert', 'sm')}<div><b>Cảnh báo xếp lịch (${chk.warnings.length})</b> — vẫn lưu được sau khi xác nhận:<ul style="margin:6px 0 0;padding-left:18px">${chk.warnings.map((w) => `<li><b>${esc(w.loai)}:</b> ${esc(w.text)}</li>`).join('')}</ul></div></div>`;
      } else box.innerHTML = `<div class="callout green">${icon('checkCircle', 'sm')}<div>Không trùng lịch, không có cảnh báo — sẵn sàng lưu.</div></div>`;
    };
    let prevNs = Number(defNs);
    f.ma_nhan_su.addEventListener('change', () => { // đổi nhân viên phỏng vấn → cập nhật danh sách người tham gia
      const a = Q.ns(prevNs)?.ho_ten, b = Q.ns(f.ma_nhan_su.value)?.ho_ten; if (a && b && f.nguoi_tham_gia_cong_ty.value.includes(a)) f.nguoi_tham_gia_cong_ty.value = f.nguoi_tham_gia_cong_ty.value.replace(a, b); prevNs = Number(f.ma_nhan_su.value);
    });
    // Đổi giờ bắt đầu → giữ nguyên thời lượng buổi phỏng vấn
    let dur = Math.max(15, Math.round((defEnd - def) / 60000));
    const toMin = (t) => { const [h, mi] = String(t || '').split(':').map(Number); return h * 60 + mi; };
    const setEnd = (min) => { const t = `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; if (![...f.gio_kt.options].some((o) => o.value === t)) f.gio_kt.add(new Option(t, t)); f.gio_kt.value = t; };
    f.gio_bd.addEventListener('change', () => setEnd(Math.min(toMin(f.gio_bd.value) + dur, 23 * 60 + 45)));
    f.gio_kt.addEventListener('change', () => { const d = toMin(f.gio_kt.value) - toMin(f.gio_bd.value); if (d > 0) dur = d; });
    f.hinh_thuc.addEventListener('change', syncKv);
    f.dia_diem_link.addEventListener('input', () => { const k = f.hinh_thuc.value === 'Trực tiếp' && Q.regionInText(f.dia_diem_link.value); if (k && Number(kvSel.value) !== k) { kvSel.value = k; check(); } });
    ['ngay', 'gio_bd', 'gio_kt', 'hinh_thuc', 'ma_nhan_su', 'ma_khu_vuc'].forEach((k) => f[k].addEventListener('change', check));
    syncKv(); check();
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
      const save = (x) => (edit ? Svc.updateInterviewResult(lichId, x) : Svc.interviewResult(lichId, x));
      const done = doneThen(m, edit ? 'Đã cập nhật kết quả phỏng vấn' : v.ket_qua === 'Không đạt' ? 'Đã lưu — hồ sơ chuyển “Bị loại”' : v.ket_qua === 'Đạt' ? 'Đã lưu — chuyển sang Chờ ghi nhận kết quả tuyển dụng' : 'Đã lưu — có thể tạo lịch vòng tiếp theo', then);
      const r = save(v);
      if (r.ok) { done(r); return r; }
      if (r.needConfirm) { // hồ sơ còn buổi phỏng vấn khác đang chờ → hỏi trước khi hủy, không hủy ngầm
        confirmBox({ title: 'Hủy các buổi phỏng vấn còn chờ?', danger: true, okText: 'Lưu & hủy các buổi này',
          message: `Ứng viên <b>Không đạt</b> nên hồ sơ chuyển “Bị loại”. Các buổi phỏng vấn sau của ứng viên vẫn đang chờ và sẽ được <b>hủy</b>:<ul style="margin:8px 0 0;padding-left:18px">${r.pending.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul>`,
          onOk: () => { const r2 = save({ ...v, xac_nhan_huy_lich: true }); if (!r2.ok) { toast(r2.error || 'Không lưu được kết quả.', 'err'); return; } done(r2); } });
        return { ok: true };
      }
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
  /** Gửi đề cử cho khách hàng: thông tin khách hàng, ứng viên kèm CV, tệp danh sách đề cử (Excel / Google Sheet) và lời nhắn — Fix demo 3 (2) */
  sendToClient(ids, then) {
    const ds = ids.map((id) => Store.get('de_cu', id)).filter((d) => d.trang_thai === ST.DC.DUYET);
    if (!ds.length) return toast('Chỉ gửi được đề cử ở trạng thái Chờ gửi (đã được Quản lý duyệt).', 'warn');
    const ctOf = (d) => Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an); const uvOf = (d) => Q.uv(Q.hs(d.ma_ho_so_ung_vien).ma_ung_vien);
    const groups = Object.values(groupBy(ds, (d) => ctOf(d).id)).map((list) => ({ ct: ctOf(list[0]), list }));
    const withCv = ds.filter((d) => uvOf(d).cv_dinh_kem).length;
    let fmt = 'xlsx';
    const files = () => groups.map((g) => Q.recListFile(g.ct, g.list[0].dot_de_cu, fmt));
    const first = groups[0]; const k0 = Q.khOfCt(first.ct);
    const m = modal({ size: 'lg', title: 'Xác nhận gửi đề cử cho khách hàng', foot: `<button class="btn" data-close>Hủy</button><button class="btn primary" data-submit>${icon('send', 'sm')} Xác nhận gửi (${ds.length})</button>`,
      body: `<form novalidate class="send-form">
        ${groups.map(({ ct, list }) => { const k = Q.khOfCt(ct); return `<div class="send-co">
          <div class="row between" style="gap:8px;flex-wrap:wrap"><b>${esc(k.ten_cong_ty)}</b><span class="badge blue sm">${esc(ct.vi_tri)} · ${Code.ct(ct.id)}</span></div>
          <dl class="send-kv"><dt>Người liên hệ</dt><dd>${esc(k.nguoi_lien_he)}</dd><dt>Email</dt><dd>${esc(k.email)}</dd><dt>Địa chỉ</dt><dd>${esc(k.dia_chi || '—')}</dd><dt>Điện thoại</dt><dd>${esc(k.so_dien_thoai)}</dd></dl></div>
          <div class="send-sec"><span>Ứng viên gửi (${list.length})</span><span class="muted">Mỗi ứng viên kèm CV đã lưu trong hồ sơ</span></div>
          <div class="send-list">${list.map((d) => { const u = uvOf(d); return `<div class="send-row"><div class="person">${avatar(u.ho_ten, 'sm')}<div><b class="small">${esc(u.ho_ten)}</b> <span class="muted small">${esc(d.dot_de_cu)}</span></div></div>
            ${u.cv_dinh_kem ? `<span class="file-chip pdf">${icon('file', 'sm')} ${esc(u.cv_dinh_kem)}</span><button type="button" class="btn xs ghost" data-cv="${u.id}">Xem</button>` : '<span class="file-chip none">Chưa có CV trong hồ sơ</span>'}</div>`; }).join('')}</div>`; }).join('')}
        <div class="send-sec"><span>Tệp đính kèm khi gửi</span><span class="muted">Chọn ít nhất một loại</span></div>
        <label class="att-opt"><input type="checkbox" name="cv" checked><div><b>CV của từng ứng viên</b><div class="muted small">${withCv} tệp PDF, mỗi tệp là CV của một ứng viên trong danh sách trên.</div></div></label>
        <label class="att-opt"><input type="checkbox" name="ds" checked><div style="flex:1"><div class="row" style="gap:8px;flex-wrap:wrap"><b>File danh sách đề cử</b><span class="seg" id="fmt"><button type="button" class="on" data-f="xlsx">Excel (.xlsx)</button><button type="button" data-f="sheet">Google Sheet</button></span></div>
          <div class="muted small">Gồm ${ds.length} ứng viên đề cử: họ tên, năm kinh nghiệm, mức lương mong muốn, notice period, liên hệ.</div><div id="dsFiles" class="mt-sm"></div></div></label>
        <div class="send-sec"><span>Lời nhắn gửi khách hàng</span><span class="muted">Tùy chọn</span></div>
        <textarea class="textarea" name="loi_nhan" placeholder="Kính gửi ${esc(String(k0.nguoi_lien_he).replace(/\s*\(.*\)\s*$/, ''))}, Navigos gửi danh sách ứng viên cho vị trí ${esc(first.ct.vi_tri)}…"></textarea></form>` });
    const f = m.$('form');
    const drawFiles = () => { m.$('#dsFiles').innerHTML = files().map((n, i) => `<span class="file-chip ${fmt === 'xlsx' ? 'xls' : 'sheet'}">${icon('file', 'sm')} ${esc(n)}</span><button type="button" class="btn xs ghost" data-pv="${i}">Xem trước</button>`).join(' ');
      m.$$('[data-pv]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); const g = groups[Number(b.dataset.pv)]; Dlg.recListPreview(g.list, files()[Number(b.dataset.pv)]); })); };
    m.$$('#fmt [data-f]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); fmt = b.dataset.f; m.$$('#fmt [data-f]').forEach((x) => x.classList.toggle('on', x === b)); drawFiles(); }));
    m.$$('[data-cv]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); Dlg.cvPreview(Number(b.dataset.cv)); }));
    const sync = () => m.$$('.att-opt').forEach((x) => x.classList.toggle('on', x.querySelector('input').checked));
    f.cv.onchange = sync; f.ds.onchange = sync; sync(); drawFiles();
    m.$('[data-submit]').onclick = (e) => {
      e.preventDefault();
      const opt = { dinh_kem_cv: f.cv.checked, dinh_kem_ds: f.ds.checked, dinh_dang_ds: fmt, loi_nhan: f.loi_nhan.value };
      if (!opt.dinh_kem_cv && !opt.dinh_kem_ds) return toast('Chọn ít nhất một loại tệp đính kèm khi gửi khách hàng.', 'err');
      const names = files(); const r = Svc.sendToClient(ds.map((d) => d.id), opt); if (!r.ok) return toast(r.error, 'err');
      if (opt.dinh_kem_ds) groups.forEach((g, i) => Dlg.recListFile(g.list, names[i], fmt));
      m.close(); toast(`Đã gửi ${r.sent} đề cử cho khách hàng${opt.dinh_kem_ds ? ' · đã tạo ' + names.join(', ') : ''}`); then ? then() : UI.refresh();
    };
  },
  /** Dữ liệu của tệp danh sách đề cử gửi khách hàng */
  recListData(list) {
    const headers = ['STT', 'Họ tên', 'Năm sinh', 'Email', 'Số điện thoại', 'Số năm kinh nghiệm', 'Mức lương mong muốn (VND)', 'Notice period', 'Đợt đề cử'];
    const rows = list.map((d, i) => { const u = Q.uv(Q.hs(d.ma_ho_so_ung_vien).ma_ung_vien); return [i + 1, u.ho_ten, u.nam_sinh || '', u.email, u.so_dien_thoai, d.so_nam_kinh_nghiem ?? '', d.muc_luong_mong_muon != null ? Number(d.muc_luong_mong_muon) : '', d.notice_period || '', d.dot_de_cu]; });
    return { headers, rows };
  },
  recListFile(list, name, fmt) {
    const { headers, rows } = this.recListData(list); const ct = Q.ct(Q.hs(list[0].ma_ho_so_ung_vien).ma_chi_tiet_du_an);
    if (fmt === 'sheet') Export.csv(name, headers, rows); else Export.excel(name.replace(/\.xlsx$/, ''), `Danh sách đề cử — ${ct.vi_tri} (${Code.ct(ct.id)}) — ${Q.khOfCt(ct).ten_cong_ty}`, headers, rows, { silent: true });
  },
  recListPreview(list, name) {
    const { headers, rows } = this.recListData(list);
    modal({ size: 'lg', title: `Xem trước — ${esc(name)}`, foot: '<button class="btn primary" data-close>Đóng</button>',
      body: `<div class="table-wrap"><table class="table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i === 6 ? 'num' : ''}">${i === 6 && c !== '' ? fmtMoney(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` });
  },
  /** Xem CV của ứng viên (bản trình bày từ dữ liệu hồ sơ đã chuẩn hóa) */
  cvPreview(uvId) {
    const u = Q.uv(uvId); const age = Q.age(u);
    modal({ size: 'lg', title: `${icon('file', 'sm')} ${esc(u.cv_dinh_kem || 'CV ứng viên')}`, foot: '<button class="btn primary" data-close>Đóng</button>',
      body: `<div class="cv-sheet"><div class="cv-head">${avatar(u.ho_ten, 'lg')}<div><h2>${esc(u.ho_ten)}</h2><div class="muted">${esc(Store.name('chuyen_mon', u.ma_chuyen_mon))} · ${esc(Store.name('cap_bac', u.ma_cap_bac))}</div>
          <div class="small mt-sm">${esc(u.email)} · ${esc(u.so_dien_thoai)}${u.dia_chi ? ' · ' + esc(u.dia_chi) : ''}</div></div></div>
        <dl class="kv mt"><dt>Năm sinh</dt><dd>${u.nam_sinh ? `${u.nam_sinh} (${age} tuổi)` : '—'}</dd><dt>Giới tính</dt><dd>${esc(u.gioi_tinh || '—')}</dd><dt>Khu vực</dt><dd>${esc(Store.name('khu_vuc', u.ma_khu_vuc))}</dd>
          <dt>Lĩnh vực</dt><dd>${esc(u.ma_linh_vuc ? Store.name('linh_vuc', u.ma_linh_vuc) : '—')}</dd><dt>Học vấn</dt><dd>${esc(u.trinh_do_hoc_van || '—')}</dd><dt>Kinh nghiệm</dt><dd>${u.so_nam_kinh_nghiem ?? '—'} năm</dd>
          <dt>Kỹ năng</dt><dd>${String(u.ky_nang || '').split(',').filter(Boolean).map((x) => `<span class="tag">${esc(x.trim())}</span>`).join('') || '—'}</dd><dt>Ghi chú</dt><dd>${esc(u.ghi_chu || '—')}</dd></dl></div>` });
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
      m.close(); toast(`Đã tạo đề cử cho ${esc(u.ho_ten)} — chờ Quản lý duyệt`); Pages.recommendations.tab = 'cho-duyet'; Router.go('#/de-cu?ct=' + v.ct);
      return { ok: true };
    });
  },
  /** Chọn hồ sơ để lên lịch phỏng vấn — gõ tên ứng viên, hiện gợi ý (Fix Demo lần 1) */
  pickHsForInterview(ready) {
    const items = ready.map((h) => { const u = Q.uv(h.ma_ung_vien); const c = Q.ct(h.ma_chi_tiet_du_an); return { id: h.id, label: u.ho_ten, sub: `${c.vi_tri} — ${Q.khOfCt(c).ten_cong_ty} · ${Code.ct(c.id)} · ${Q.scheduleLabel(h)}`, search: `${u.ho_ten} ${c.vi_tri} ${Code.ct(c.id)}` }; });
    const m = modal({ size: 'sm', title: 'Chọn hồ sơ để lên lịch', foot: foot('Tiếp tục'),
      body: `<form novalidate><div class="field ta"><label>Ứng viên <span class="req">*</span></label><input class="input" name="hs_text" placeholder="Nhập tên ứng viên…" autocomplete="off"><input type="hidden" name="hs"></div>
        <p class="muted small">Gồm hồ sơ khách hàng đồng ý phỏng vấn và hồ sơ đã phỏng vấn xong cần thêm buổi (${ready.length} hồ sơ). Ứng viên đang có lịch chưa ghi nhận kết quả không hiện ở đây.</p></form>` });
    const f = m.$('form'); Comp.typeahead(f.hs_text, items, (it) => (f.hs.value = it ? it.id : ''));
    submitForm(m, (x) => { if (!x.hs) return { ok: false, errors: { hs_text: 'Gõ tên và chọn ứng viên trong danh sách gợi ý.' } }; m.close(); Dlg.interview(Number(x.hs)); return { ok: true }; });
  },
  /* ----- Kết quả tuyển dụng (UC_09) ----- */
  hiring(hsId, then) {
    const hs = Q.hs(hsId); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
    const others = Q.hsOfUv(uv.id).filter((h) => h.id !== hs.id && HS_ACTIVE.includes(h.trang_thai));
    const m = modal({ title: `Ghi nhận kết quả tuyển dụng — ${esc(uv.ho_ten)}`, foot: foot('Lưu kết quả'),
      body: `<div class="callout mb">${icon('info', 'sm')}<div>Offer do <b>khách hàng</b> gửi trực tiếp cho ứng viên qua email. Hệ thống chỉ ghi nhận kết quả và theo dõi đến khi ứng viên bắt đầu thử việc.</div></div>
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
  /** In danh sách đề cử theo mẫu: tiêu đề công ty, vị trí – khách hàng, bảng đề cử, tổng hợp, chữ ký; số trang ở chân trang */
  printRecs(list) {
    const w = window.open('', '_blank'); if (!w) return toast('Trình duyệt chặn cửa sổ in — hãy cho phép pop-up.', 'warn');
    const ctOf = (d) => Q.ct(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an); const cts = [...new Set(list.map((d) => ctOf(d).id))].map((id) => Q.ct(id));
    const one = cts.length === 1; const d0 = new Date(); const u = Auth.user;
    const dcState = (d) => d.trang_thai === ST.DC.DUYET ? '<b class="ok">Đã duyệt</b>' : d.trang_thai === ST.DC.GUI ? `Đã gửi khách hàng${d.phan_hoi_khach_hang ? `<br><b class="fb">Khách hàng ${esc(d.phan_hoi_khach_hang.charAt(0).toLowerCase() + d.phan_hoi_khach_hang.slice(1))}</b>` : ''}`
      : d.trang_thai === ST.DC.SUA ? '<b class="warn">Cần chỉnh sửa</b>' : esc(d.trang_thai);
    const rows = list.map((d, i) => { const hs = Q.hs(d.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = ctOf(d);
      return `<tr><td class="c">${i + 1}</td><td><b>${esc(uv.ho_ten)}</b><small>${esc(uv.email)} · ${esc(uv.so_dien_thoai)}</small></td>${one ? '' : `<td>${esc(ct.vi_tri)}<small>${Code.ct(ct.id)} · ${esc(Q.khOfCt(ct).ten_cong_ty)}</small></td>`}
        <td class="c">${esc(d.dot_de_cu)}</td><td class="c">${d.so_nam_kinh_nghiem ?? '—'}</td><td class="r">${fmtMoney(d.muc_luong_mong_muon)}</td><td class="c">${esc(d.notice_period || '—')}</td><td class="c">${esc(Q.ns(d.ma_nguoi_tao).ho_ten)}</td><td class="c">${dcState(d)}</td><td class="c">${esc(hs.trang_thai)}</td></tr>`; }).join('');
    const sub = one ? `<span>VỊ TRÍ</span><b>${esc(cts[0].vi_tri)}</b><i></i><span>KHÁCH HÀNG</span><b>${esc(Q.khOfCt(cts[0]).ten_cong_ty)}</b>` : `<span>PHẠM VI</span><b>${cts.length} vị trí</b><i></i><span>NHÂN VIÊN ĐỀ CỬ</span><b>${esc([...new Set(list.map((d) => Q.ns(d.ma_nguoi_tao).ho_ten))].join(', '))}</b>`;
    const ok = list.filter((d) => [ST.DC.DUYET, ST.DC.GUI].includes(d.trang_thai)).length; const acc = list.filter((d) => d.phan_hoi_khach_hang === 'Đồng ý phỏng vấn').length;
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Danh sách đề cử ứng viên</title><style>
      @page{size:A4 landscape;margin:12mm 14mm 14mm;@bottom-left{content:"Navigos Talent Suite · Danh sách đề cử ứng viên";font:9px Inter,Arial,sans-serif;color:#64748b;border-top:1px solid #e2e8f0}@bottom-right{content:"Trang " counter(page) "/" counter(pages);font:9px Inter,Arial,sans-serif;color:#64748b;border-top:1px solid #e2e8f0}@top-left{content:""}@top-right{content:""}}
      *{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;margin:0;color:#0f172a;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .top{display:flex;justify-content:space-between;align-items:flex-start}.co{font-weight:800;color:#283583;letter-spacing:.02em;font-size:13px}.co small{display:block;font-weight:500;color:#64748b;letter-spacing:0;font-size:11px;margin-top:2px}
      .meta{text-align:right;font-size:11px;color:#475569;line-height:1.5}h1{text-align:center;color:#283583;font-size:20px;margin:10px 0 6px;letter-spacing:.02em}
      .sub{display:flex;justify-content:center;align-items:center;gap:8px;font-size:12px;padding-bottom:10px;border-bottom:2px solid #22b4e6}.sub span{font-size:10px;color:#64748b;letter-spacing:.06em}.sub b{color:#283583}.sub i{width:1px;height:14px;background:#cbd5e1;margin:0 6px}
      table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#283583;color:#fff;font-weight:600;padding:7px 6px;font-size:11px;border:1px solid #283583}td{border:1px solid #cbd5e1;padding:7px 6px;vertical-align:middle}
      tr{break-inside:avoid}td small{display:block;color:#64748b;font-size:10px;margin-top:2px}.c{text-align:center}.r{text-align:right;white-space:nowrap}b.ok{color:#12a150}b.fb{color:#1d6fe0;font-size:10px}b.warn{color:#d97706}
      .sum{margin-top:10px;font-size:11px}.end{break-inside:avoid}.date{text-align:right;font-style:italic;color:#475569;margin:22px 0 0}
      .sign{display:flex;justify-content:flex-end;gap:70px;margin-top:10px;text-align:center}.sign div{min-width:170px}.sign b{display:block}.sign i{display:block;font-size:10px;color:#64748b}.sign .nm{margin-top:56px;font-weight:600}
    </style></head><body>
      <div class="top"><div class="co">NAVIGOS GROUP VIỆT NAM<small>Talent Suite — Nghiệp vụ tuyển dụng</small></div><div class="meta">Ngày in: ${fmtTime(d0)} · ${fmtDate(d0)}<br>Người in: ${esc(u.ho_ten)}</div></div>
      <h1>DANH SÁCH ĐỀ CỬ ỨNG VIÊN</h1><div class="sub">${sub}</div>
      <table><thead><tr><th style="width:38px">STT</th><th>Ứng viên</th>${one ? '' : '<th>Vị trí / Khách hàng</th>'}<th>Đợt</th><th>Năm KN</th><th>Lương mong muốn</th><th>Notice</th><th>Người đề cử</th><th>Trạng thái đề cử</th><th>Trạng thái hồ sơ</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="sum"><b>Tổng:</b> ${list.length} đề cử &nbsp;·&nbsp; <b>Đã duyệt/gửi:</b> ${ok} &nbsp;·&nbsp; <b>KH đồng ý phỏng vấn:</b> ${acc}</div>
      <div class="end"><div class="date">Ngày ${String(d0.getDate()).padStart(2, '0')} tháng ${String(d0.getMonth() + 1).padStart(2, '0')} năm ${d0.getFullYear()}</div>
      <div class="sign"><div><b>Người lập danh sách</b><i>(Ký, ghi rõ họ tên)</i><div class="nm">${esc(u.ho_ten)}</div></div><div><b>Quản lý xác nhận</b><i>(Ký, ghi rõ họ tên)</i></div></div></div>
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
        ${id ? Form.field('Trạng thái hợp tác', 'trang_thai_hop_tac', { value: k.trang_thai_hop_tac, opts: ['Đang hợp tác', 'Ngừng hợp tác'], hint: 'Khách hàng đã có dự án không bị xóa — chuyển “Ngừng hợp tác” để giữ lịch sử.' }) : ''}</form>` });
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
  /** Quên mật khẩu: người dùng gửi yêu cầu cho Quản trị viên; Quản trị viên tự đặt lại bằng mã khôi phục */
  forgotPassword(name = '') {
    const m = modal({ title: 'Quên mật khẩu', foot: `<button class="btn" data-close>Đóng</button><button class="btn primary" data-submit>${icon('send', 'sm')} Gửi yêu cầu</button>`,
      body: `<div class="seg seg-lg mb" id="fpTab"><button type="button" class="on" data-t="user">Gửi yêu cầu cấp lại</button><button type="button" data-t="admin">Tôi là Quản trị viên</button></div>
        <form novalidate class="form-grid" id="fpUser" style="grid-template-columns:1fr">
          <p class="small t2" style="margin:0">Yêu cầu được gửi tới Quản trị viên. Quản trị viên đặt lại mật khẩu và gửi mật khẩu mới cho bạn qua kênh liên hệ bên dưới.</p>
          ${Form.field('Tên đăng nhập hoặc email', 'username', { req: true, value: name, ph: 'VD: nhanvien hoặc tram.dao@navigosgroup.com' })}
          ${Form.field('Số điện thoại / email để liên hệ lại', 'lien_he', { ph: 'VD: 0912 345 678' })}
          ${Form.field('Ghi chú cho Quản trị viên', 'ghi_chu', { type: 'textarea', ph: 'Không bắt buộc' })}</form>
        <form novalidate class="form-grid" id="fpAdmin" style="grid-template-columns:1fr" hidden>
          <p class="small t2" style="margin:0">Quản trị viên quên mật khẩu: nhập <b>mã khôi phục</b> được giao khi bàn giao hệ thống để tự đặt mật khẩu mới.</p>
          ${Form.field('Tên đăng nhập Quản trị viên', 'username', { req: true, value: name, ph: 'VD: admin' })}
          ${Form.field('Mã khôi phục', 'code', { req: true, ph: 'NVG-XXXX-XXXX', attrs: 'autocomplete="off" style="text-transform:uppercase"' })}
          ${Form.field('Mật khẩu mới', 'password', { type: 'password', req: true, hint: 'Tối thiểu 6 ký tự.', attrs: 'autocomplete="new-password"' })}
          ${Form.field('Nhập lại mật khẩu mới', 'password2', { type: 'password', req: true, attrs: 'autocomplete="new-password"' })}</form>
        <div id="fpDone"></div>` });
    let tab = 'user'; const fu = m.$('#fpUser'), fa = m.$('#fpAdmin'), btn = m.$('[data-submit]');
    m.$$('#fpTab [data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; m.$$('#fpTab [data-t]').forEach((x) => x.classList.toggle('on', x === b)); fu.hidden = tab !== 'user'; fa.hidden = tab !== 'admin';
      btn.innerHTML = tab === 'user' ? `${icon('send', 'sm')} Gửi yêu cầu` : `${icon('check', 'sm')} Đặt mật khẩu mới`; m.$('#fpDone').innerHTML = ''; }));
    btn.onclick = (e) => {
      e.preventDefault();
      if (tab === 'user') {
        const v = Form.values(fu); if (!v.username.trim()) return Form.showErrors(fu, { username: 'Nhập tên đăng nhập hoặc email.' });
        const r = Api.call('POST', '/api/forgot', v); if (!r.ok) return r.errors ? Form.showErrors(fu, r.errors) : toast(r.error, 'err');
        fu.hidden = true; m.$('#fpTab').hidden = true; btn.hidden = true;
        m.$('#fpDone').innerHTML = `<div class="callout green">${icon('checkCircle', 'sm')}<div><b>${esc(r.message)}</b><div class="small mt-sm">Cần gấp? Liên hệ trực tiếp Quản trị viên:</div>${Dlg.adminContacts()}</div></div>`;
      } else {
        const v = Form.values(fa); const er = {};
        if (!v.username.trim()) er.username = 'Nhập tên đăng nhập.'; if (!v.code.trim()) er.code = 'Nhập mã khôi phục.';
        if (v.password.length < 6) er.password = 'Mật khẩu mới tối thiểu 6 ký tự.'; else if (v.password !== v.password2) er.password2 = 'Mật khẩu nhập lại không khớp.';
        if (Object.keys(er).length) return Form.showErrors(fa, er);
        const r = Api.call('POST', '/api/recover', { username: v.username, code: v.code, password: v.password });
        if (!r.ok) return r.errors ? Form.showErrors(fa, r.errors) : toast(r.error, 'err');
        m.close(); toast(r.message); const lf = $('#lf'); if (lf) { lf.u.value = v.username; lf.p.value = ''; lf.p.focus(); }
      }
    };
  },
  /** Danh sách Quản trị viên kèm email / điện thoại bấm được */
  adminContacts() {
    const r = Api.call('GET', '/api/contact'); const list = r.ok ? r.admins : [];
    return list.length ? `<div class="stack mt-sm" style="gap:8px">${list.map((a) => `<div class="contact-card">${avatar(a.ho_ten, 'sm')}<div style="flex:1;min-width:0"><b>${esc(a.ho_ten)}</b><div class="muted small">${esc(a.chuc_vu)} · Quản trị viên</div></div>
      <a class="btn sm" href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Yêu cầu hỗ trợ tài khoản Navigos Talent Suite')}">${icon('mail', 'sm')} ${esc(a.email)}</a>${a.so_dien_thoai ? `<a class="btn sm" href="tel:${esc(String(a.so_dien_thoai).replace(/\s+/g, ''))}">${icon('phone', 'sm')} ${esc(a.so_dien_thoai)}</a>` : ''}</div>`).join('')}</div>` : '<div class="muted small mt-sm">Chưa có thông tin Quản trị viên.</div>';
  },
  contactAdmin() {
    const m = modal({ title: 'Liên hệ Quản trị viên', foot: `<button class="btn" data-close>Đóng</button><button class="btn primary" id="toForgot">${icon('lock', 'sm')} Gửi yêu cầu cấp lại mật khẩu</button>`,
      body: `<p class="small t2" style="margin-top:0">Quản trị viên cấp tài khoản, phân quyền và đặt lại mật khẩu. Bấm email hoặc số điện thoại để liên hệ.</p>${Dlg.adminContacts()}` });
    m.$('#toForgot').onclick = () => { m.close(); Dlg.forgotPassword($('#lf')?.u.value.trim() || ''); };
  },
  showPassword(n, pw) { modal({ size: 'sm', title: 'Mật khẩu khởi tạo', foot: '<button class="btn primary" data-close>Đã ghi nhận</button>', body: `<p style="margin-top:0">Tài khoản <b>${esc(n.ten_dang_nhap)}</b> (${esc(n.ho_ten)})</p><div class="code" style="font-size:20px;padding:12px 16px;display:block;text-align:center;letter-spacing:.1em">${esc(pw)}</div><p class="muted small">Mật khẩu chỉ hiển thị một lần. Hãy gửi cho nhân sự qua kênh nội bộ an toàn.</p>` }); },
};
