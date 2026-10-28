/* ==========================================================
   pages-manage.js — Phỏng vấn, Kết quả tuyển dụng, Khách hàng,
   Nhân sự, Tài khoản, Danh mục, Báo cáo, Cài đặt, Tìm kiếm
   ========================================================== */

/* ============ QUẢN LÝ PHỎNG VẤN (UC_10, UC_11) ============ */
Pages.interviews = {
  f: { st: '', ht: '', q: '', day: null }, month: null,
  render(v, p, query) {
    const f = this.f; if (query.f === 'can-ket-qua') { f.st = 'need'; history.replaceState(null, '', '#/phong-van'); }
    const ctIds = new Set(Q.visibleCts().map((c) => c.id));
    const all = DB.lich_phong_van.filter((l) => ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an));
    const t = todayStr(); const m0 = this.month || (() => { const d = new Date(now()); d.setDate(1); return d; })(); this.month = m0;
    let list = all.filter((l) => {
      const uv = Q.uv(Q.hs(l.ma_ho_so_ung_vien).ma_ung_vien);
      if (f.q && !norm(uv.ho_ten + ' ' + Code.ct(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an)).includes(norm(f.q))) return false;
      if (f.st === 'need') { if (!(l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_ket_thuc) < now())) return false; } else if (f.st && l.trang_thai !== f.st) return false;
      if (f.ht && l.hinh_thuc !== f.ht) return false; if (f.day && toDateStr(l.thoi_gian_bat_dau) !== f.day) return false;
      return true;
    }).sort((a, b) => a.thoi_gian_bat_dau.localeCompare(b.thoi_gian_bat_dau));
    const today = list.filter((l) => toDateStr(l.thoi_gian_bat_dau) === t);
    const upcoming = list.filter((l) => toDateStr(l.thoi_gian_bat_dau) > t);
    const past = list.filter((l) => toDateStr(l.thoi_gian_bat_dau) < t).reverse();
    const todayAll = all.filter((l) => toDateStr(l.thoi_gian_bat_dau) === t && l.trang_thai !== ST.LICH.HUY);
    const done = todayAll.filter((l) => l.trang_thai === ST.LICH.XONG).length;
    // Lịch tháng
    const y = m0.getFullYear(), mo = m0.getMonth(); const first = new Date(y, mo, 1).getDay(); const dim = new Date(y, mo + 1, 0).getDate();
    const has = new Set(all.filter((l) => l.trang_thai !== ST.LICH.HUY).map((l) => toDateStr(l.thoi_gian_bat_dau)));
    let cells = ''; for (let i = 0; i < first; i++) cells += '<span class="d other"></span>';
    for (let d = 1; d <= dim; d++) { const ds = `${y}-${pad(mo + 1)}-${pad(d)}`; cells += `<button class="d ${ds === t ? 'today' : ''} ${ds === f.day ? 'sel' : ''} ${has.has(ds) ? 'has' : ''}" data-day="${ds}">${d}</button>`; }
    const sec = (title, arr, n) => `<div class="row mt mb" style="margin-bottom:10px"><h3 style="font-size:16px">${title}</h3><span class="badge blue sm">${n ?? arr.length} buổi</span></div>${arr.map((l) => Comp.ivCard(l)).join('') || `<div class="card">${emptyState('Không có lịch')}</div>`}`;
    v.innerHTML = `<div class="page-head"><div><h1>Quản lý phỏng vấn</h1><p>Điều phối lịch phỏng vấn giữa ứng viên và khách hàng; nhân viên đi cùng khách hàng và ghi nhận kết quả, feedback.</p></div>
      <div class="actions"><div class="input-ico" style="min-width:220px">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên ứng viên, ID dự án…" value="${esc(f.q)}"></div><button class="btn primary" id="add">${icon('plus', 'sm')} Thêm lịch mới</button></div></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 320px" id="ivGrid">
        <div>${f.day ? `<div class="callout mb">${icon('calendar', 'sm')}<div>Đang xem ngày <b>${fmtDate(f.day)}</b> — <a href="#" id="clrDay">bỏ lọc ngày</a></div></div>` : ''}
          ${f.st === 'need' ? `<div class="callout amber mb">${icon('alert', 'sm')}<div>Đang lọc các buổi <b>đã diễn ra nhưng chưa ghi nhận kết quả</b>.</div></div>` : ''}
          ${f.day ? sec('Lịch trong ngày', list) : `${sec(`Hôm nay, ${fmtDate(now())}`, today)}${sec('Sắp tới', upcoming)}${sec('Đã diễn ra', past.slice(0, 8), past.length)}`}</div>
        <div class="stack" style="gap:14px">
          <div class="card card-pad"><h3 style="font-size:15px" class="mb">${icon('filter', 'sm')} Bộ lọc nhanh</h3>
            <div class="field"><label>Trạng thái</label><div class="chip-group">${[['', 'Tất cả'], ['need', 'Chờ ghi kết quả'], [ST.LICH.LEN, 'Đã lên lịch'], [ST.LICH.XONG, 'Đã phỏng vấn'], [ST.LICH.HUY, 'Đã hủy']].map(([a, b]) => `<button class="chip ${f.st === a ? 'active' : ''}" data-st="${a}">${b}</button>`).join('')}</div></div>
            <div class="field mt-sm"><label>Hình thức</label><div class="chip-group">${[['', 'Tất cả'], ['Trực tuyến', 'Online'], ['Trực tiếp', 'Offline']].map(([a, b]) => `<button class="chip ${f.ht === a ? 'active' : ''}" data-ht="${a}">${b}</button>`).join('')}</div></div></div>
          <div class="card card-pad" style="background:var(--primary-50);border-color:var(--primary-100)"><div class="strong">Thống kê hôm nay</div>
            <div class="row between mt-sm"><span>Tổng phỏng vấn</span><b>${todayAll.length}</b></div><div class="row between"><span style="color:var(--green)">Hoàn thành</span><b>${done}</b></div><div class="row between"><span style="color:var(--primary)">Đang chờ</span><b>${todayAll.length - done}</b></div>
            <div class="mt-sm">${progressBar(todayAll.length ? (done / todayAll.length) * 100 : 0)}</div></div>
          <div class="card" style="overflow:hidden"><div class="cal-head"><b>Tháng ${mo + 1}, ${y}</b><span><button id="pm">${icon('chevronLeft', 'sm')}</button><button id="nm">${icon('chevronRight', 'sm')}</button></span></div>
            <div class="cal"><div class="cal-grid">${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => `<span class="dow">${d}</span>`).join('')}${cells}</div></div></div>
        </div></div>`;
    if (innerWidth <= 1024) $('#ivGrid').style.gridTemplateColumns = 'minmax(0,1fr)';
    Comp.bindIv(v);
    $('#q').oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#q').focus(); $('#q').setSelectionRange(f.q.length, f.q.length); }, 300);
    $$('[data-st]', v).forEach((b) => (b.onclick = () => { f.st = b.dataset.st; UI.refresh(); }));
    $$('[data-ht]', v).forEach((b) => (b.onclick = () => { f.ht = b.dataset.ht; UI.refresh(); }));
    $$('[data-day]', v).forEach((b) => (b.onclick = () => { f.day = f.day === b.dataset.day ? null : b.dataset.day; UI.refresh(); }));
    $('#clrDay') && ($('#clrDay').onclick = (e) => { e.preventDefault(); f.day = null; UI.refresh(); });
    $('#pm').onclick = () => { this.month = new Date(y, mo - 1, 1); UI.refresh(); };
    $('#nm').onclick = () => { this.month = new Date(y, mo + 1, 1); UI.refresh(); };
    $('#add').onclick = () => {
      const ready = DB.ho_so_ung_tuyen.filter((h) => ctIds.has(h.ma_chi_tiet_du_an) && ((h.trang_thai === ST.HS.DECU && Q.latestDeCu(h.id)?.phan_hoi_khach_hang === 'Đồng ý phỏng vấn') || (h.trang_thai === ST.HS.PV && !Q.lichOfHs(h.id).some((l) => l.trang_thai === ST.LICH.LEN) && Q.kqPv(Q.lichOfHs(h.id).at(-1)?.id)?.ket_qua !== 'Đạt')));
      if (!ready.length) return toast('Chưa có hồ sơ nào được khách hàng đồng ý phỏng vấn hoặc cần phỏng vấn thêm.', 'warn');
      const m = modal({ size: 'sm', title: 'Chọn hồ sơ để lên lịch', foot: foot('Tiếp tục'), body: `<form novalidate>${Form.field('Hồ sơ ứng viên', 'hs', { req: true, opts: [['', '— Chọn —'], ...ready.map((h) => [h.id, `${Q.uv(h.ma_ung_vien).ho_ten} — ${Q.ct(h.ma_chi_tiet_du_an).vi_tri}`])] })}<p class="muted small">Chỉ hiển thị hồ sơ khách hàng đã đồng ý phỏng vấn hoặc cần phỏng vấn thêm.</p></form>` });
      submitForm(m, (x) => { if (!x.hs) return { ok: false, errors: { hs: 'Chọn hồ sơ.' } }; m.close(); Dlg.interview(Number(x.hs)); return { ok: true }; });
    };
  },
};

/* ============ KẾT QUẢ TUYỂN DỤNG (UC_09) ============ */
Pages.results = {
  tab: 'cho',
  render(v, p, query) {
    if (query.tab) { this.tab = query.tab; history.replaceState(null, '', '#/ket-qua'); }
    const ctIds = new Set(Q.visibleCts().map((c) => c.id));
    const hs = DB.ho_so_ung_tuyen.filter((h) => ctIds.has(h.ma_chi_tiet_du_an));
    const waiting = hs.filter((h) => h.trang_thai === ST.HS.PV && Q.lichOfHs(h.id).some((l) => Q.kqPv(l.id)?.ket_qua === 'Đạt') && !Q.kqTd(h.id));
    const kq = DB.ket_qua_tuyen_dung.filter((k) => ctIds.has(Q.hs(k.ma_ho_so_ung_vien).ma_chi_tiet_du_an));
    const acc = kq.filter((k) => k.ket_qua === 'Chấp nhận offer'); const rej = kq.filter((k) => k.ket_qua === 'Từ chối offer');
    const probation = hs.filter((h) => h.trang_thai === ST.HS.TV);
    const failed = hs.filter((h) => h.trang_thai === ST.HS.LOAI && Q.history(h.id).some((x) => x.trang_thai_moi === ST.HS.TV));
    v.innerHTML = `<div class="page-head"><div><h1>Kết quả tuyển dụng</h1><p>Offer do khách hàng gửi ứng viên qua email; hệ thống ghi nhận kết quả, email xác nhận và theo dõi đến khi ứng viên bắt đầu thử việc.</p></div></div>
      <div class="grid g-4 kpis mb">
        <div class="card kpi"><div><div class="label">Chờ kết quả từ KH</div><div class="value">${waiting.length}</div><div class="sub">Đã đạt phỏng vấn</div></div><div class="ico tone-amber">${icon('clock')}</div></div>
        <div class="card kpi"><div><div class="label">Chấp nhận offer</div><div class="value">${acc.length}</div><div class="sub">Đang thử việc: ${probation.length}</div></div><div class="ico tone-green">${icon('userCheck')}</div></div>
        <div class="card kpi"><div><div class="label">Từ chối offer</div><div class="value">${rej.length}</div></div><div class="ico tone-red">${icon('userX')}</div></div>
        <div class="card kpi"><div><div class="label">Tỷ lệ nhận offer</div><div class="value">${kq.length ? Math.round((acc.length / kq.length) * 100) : 0}%</div><div class="sub">${failed.length} thử việc không đạt → về kho</div></div><div class="ico tone-blue">${icon('chart')}</div></div></div>
      <div class="tabs">${[['cho', `Chờ ghi nhận (${waiting.length})`], ['tv', `Đang thử việc (${probation.length})`], ['tat-ca', `Đã ghi nhận (${kq.length})`], ['du-an', 'Theo dự án']].map(([k, l]) => `<button data-t="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="kb"></div>`;
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    const kb = $('#kb'); const row = (h, extra, action) => { const u = Q.uv(h.ma_ung_vien); const ct = Q.ct(h.ma_chi_tiet_du_an); return `<tr><td class="cell-main"><div class="person">${avatar(u.ho_ten, 'sm')}<div><div class="nm">${esc(u.ho_ten)}</div><div class="sb">${Code.hs(h.id)}</div></div></div></td><td data-label="Vị trí"><a href="#/du-an/${ct.id}">${esc(ct.vi_tri)}</a><div class="t-sub">${esc(Q.khOfCt(ct).ten_cong_ty)}</div></td>${extra}<td data-label="">${action}</td></tr>`; };
    if (this.tab === 'cho') kb.innerHTML = `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Ứng viên</th><th>Vị trí</th><th>Điểm PV</th><th>Đạt lúc</th><th></th></tr></thead><tbody>${waiting.map((h) => { const l = Q.lichOfHs(h.id).filter((x) => Q.kqPv(x.id)?.ket_qua === 'Đạt').at(-1); const k = Q.kqPv(l.id); return row(h, `<td data-label="Điểm PV"><b>${k.diem_danh_gia ?? '—'}</b>/10</td><td data-label="Đạt lúc">${fmtDate(k.ngay_ghi_nhan)} <span class="t-sub">(${relTime(k.ngay_ghi_nhan)})</span></td>`, `<button class="btn xs success" data-hire="${h.id}">${icon('checkCircle', 'sm')} Ghi nhận kết quả</button> <button class="btn xs" data-open="${h.id}">Hồ sơ</button>`); }).join('') || `<tr><td colspan="5">${emptyState('Không có ứng viên chờ kết quả', 'checkCircle')}</td></tr>`}</tbody></table></div></div>`;
    else if (this.tab === 'tv') kb.innerHTML = `<div class="callout mb">${icon('info', 'sm')}<div>Hệ thống ghi nhận đến khi ứng viên bắt đầu thử việc. Nếu khách hàng báo <b>thử việc không đạt</b>, dùng thao tác bên dưới để đưa ứng viên quay lại bể hồ sơ tìm việc; tiến độ vị trí được tính lại.</div></div>
      <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Ứng viên</th><th>Vị trí</th><th>Ngày nhận việc</th><th>Email xác nhận</th><th></th></tr></thead><tbody>${probation.map((h) => { const k = Q.kqTd(h.id); return row(h, `<td data-label="Nhận việc">${fmtDate(k?.ngay_nhan_viec)}</td><td data-label="Email">${icon('file', 'sm')} <span class="small">${esc(k?.email_xac_nhan || '—')}</span></td>`, `<button class="btn xs" data-prob="${h.id}" style="color:var(--red)">${icon('userX', 'sm')} Thử việc không đạt</button> <button class="btn xs" data-open="${h.id}">Hồ sơ</button>`); }).join('') || `<tr><td colspan="5">${emptyState('Chưa có')}</td></tr>`}</tbody></table></div></div>`;
    else if (this.tab === 'tat-ca') kb.innerHTML = `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Ứng viên</th><th>Vị trí</th><th>Kết quả</th><th>KH báo</th><th>Chi tiết</th><th></th></tr></thead><tbody>${kq.sort((a, b) => b.ngay_ghi_nhan.localeCompare(a.ngay_ghi_nhan)).map((k) => { const h = Q.hs(k.ma_ho_so_ung_vien); return row(h, `<td data-label="Kết quả">${badge(k.ket_qua)}</td><td data-label="KH báo">${fmtDate(k.ngay_khach_hang_bao)}</td><td data-label="Chi tiết" class="small">${k.ngay_nhan_viec ? 'Nhận việc ' + fmtDate(k.ngay_nhan_viec) : esc(k.ly_do_tu_choi || '')}${h.trang_thai === ST.HS.LOAI && k.ket_qua === 'Chấp nhận offer' ? '<br><span class="badge sm red">Thử việc không đạt</span>' : ''}</td>`, `<button class="btn xs" data-open="${h.id}">Hồ sơ</button>`); }).join('') || `<tr><td colspan="6">${emptyState('Chưa có kết quả')}</td></tr>`}</tbody></table></div></div>`;
    else kb.innerHTML = `<div class="grid g-2">${Q.visibleCts().filter((c) => c.trang_thai !== ST.CT.MOI).map((c) => { const h = Q.hired(c.id); const pct = Math.min(100, Math.round((h / c.so_luong) * 100)); return `<a class="card card-pad" href="#/du-an/${c.id}" style="color:inherit;text-decoration:none"><div class="row between"><div><div class="strong">${esc(c.vi_tri)}</div><div class="muted small">${esc(Q.khOfCt(c).ten_cong_ty)}</div></div>${badge(c.trang_thai)}</div><div class="prog-meta mt-sm"><span>${h}/${c.so_luong} nhận việc</span><span>${pct}%</span></div>${progressBar(pct, pct >= 100 ? 'green' : '')}<div class="row mt-sm small t2" style="gap:14px"><span>Từ chối offer: <b>${Q.hsOfCt(c.id).filter((x) => Q.kqTd(x.id)?.ket_qua === 'Từ chối offer').length}</b></span><span>Đang PV: <b>${Q.hsOfCt(c.id).filter((x) => x.trang_thai === ST.HS.PV).length}</b></span></div></a>`; }).join('')}</div>`;
    $$('[data-hire]', kb).forEach((b) => (b.onclick = () => Dlg.hiring(Number(b.dataset.hire))));
    $$('[data-prob]', kb).forEach((b) => (b.onclick = () => Dlg.probation(Number(b.dataset.prob))));
    $$('[data-open]', kb).forEach((b) => (b.onclick = () => Comp.hsDrawer(Number(b.dataset.open))));
  },
};

/* ============ KHÁCH HÀNG (UC_03) ============ */
Pages.customers = {
  f: { q: '', lv: '', tt: '' },
  render(v) {
    const f = this.f;
    const rows = DB.khach_hang.filter((k) => (!f.q || norm(k.ten_cong_ty + ' ' + k.nguoi_lien_he + ' ' + k.email).includes(norm(f.q))) && (!f.lv || k.ma_linh_vuc === Number(f.lv)) && (!f.tt || k.trang_thai_hop_tac === f.tt));
    v.innerHTML = `<div class="page-head"><div><h1>Khách hàng</h1><p>Dữ liệu nền để tạo dự án tuyển dụng — theo dõi số dự án và vị trí đang triển khai của từng khách hàng.</p></div><div class="actions"><button class="btn primary" id="add">${icon('plus', 'sm')} Thêm khách hàng</button></div></div>
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên công ty, người liên hệ, email…" value="${esc(f.q)}"></div>
        <select class="select" id="lv" style="width:auto">${Form.opts('linh_vuc', { blank: 'Mọi lĩnh vực' }).map(([a, b]) => `<option value="${a}" ${String(f.lv) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>
        <select class="select" id="tt" style="width:auto">${[['', 'Mọi trạng thái'], ['Đang hợp tác', 'Đang hợp tác'], ['Ngừng hợp tác', 'Ngừng hợp tác']].map(([a, b]) => `<option value="${a}" ${f.tt === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="table responsive"><thead><tr><th>Khách hàng</th><th>Lĩnh vực</th><th>Liên hệ</th><th class="num">Dự án</th><th class="num">Vị trí đang mở</th><th>Trạng thái</th></tr></thead><tbody>
      ${rows.map((k) => { const das = DB.du_an_tuyen_dung.filter((d) => d.ma_khach_hang === k.id); const open = DB.chi_tiet_du_an.filter((c) => das.some((d) => d.id === c.ma_du_an) && !CT_CLOSED.includes(c.trang_thai)).length;
        return `<tr class="clickable" data-kh="${k.id}"><td class="cell-main"><div class="person"><span class="avatar" style="background:var(--navy);border-radius:10px">${esc(initials(k.ten_cong_ty.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, '')))}</span><div><div class="nm">${esc(k.ten_cong_ty)}</div><div class="sb">${Code.kh(k.id)} · ${esc(k.dia_chi || '')}</div></div></div></td>
        <td data-label="Lĩnh vực">${esc(Store.name('linh_vuc', k.ma_linh_vuc))}</td><td data-label="Liên hệ">${esc(k.nguoi_lien_he)}<div class="t-sub">${esc(k.email)} · ${esc(k.so_dien_thoai)}</div></td>
        <td data-label="Dự án" class="num">${das.length}</td><td data-label="Vị trí mở" class="num">${open}</td><td data-label="Trạng thái">${badge(k.trang_thai_hop_tac)}</td></tr>`; }).join('') || `<tr><td colspan="6">${emptyState('Không có khách hàng')}</td></tr>`}</tbody></table></div></div>`;
    $('#add').onclick = () => Dlg.customer();
    $('#q').oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#q').focus(); $('#q').setSelectionRange(f.q.length, f.q.length); }, 300);
    $('#lv').onchange = (e) => { f.lv = e.target.value; UI.refresh(); }; $('#tt').onchange = (e) => { f.tt = e.target.value; UI.refresh(); };
    $$('[data-kh]', v).forEach((tr) => (tr.onclick = () => Router.go('#/khach-hang/' + tr.dataset.kh)));
  },
};
Pages.customerDetail = {
  render(v, { id }) {
    const k = Q.kh(id); if (!k) return (v.innerHTML = emptyState('Không tìm thấy khách hàng'));
    const das = DB.du_an_tuyen_dung.filter((d) => d.ma_khach_hang === k.id);
    v.innerHTML = `<div class="crumbs"><a href="#/khach-hang">Khách hàng</a>${icon('chevronRight', 'sm')}<b>${esc(k.ten_cong_ty)}</b></div>
      <div class="page-head"><div><h1>${esc(k.ten_cong_ty)} ${badge(k.trang_thai_hop_tac)}</h1><p>${Code.kh(k.id)} · ${esc(Store.name('linh_vuc', k.ma_linh_vuc))}</p></div><div class="actions"><button class="btn" id="ed">${icon('edit', 'sm')} Cập nhật</button>${k.trang_thai_hop_tac === 'Đang hợp tác' ? `<button class="btn primary" id="nda">${icon('plus', 'sm')} Tạo dự án tuyển dụng</button>` : ''}</div></div>
      <div class="grid g-side"><div class="card card-pad"><dl class="kv" style="grid-template-columns:110px 1fr"><dt>Người liên hệ</dt><dd>${esc(k.nguoi_lien_he)}</dd><dt>Email</dt><dd>${esc(k.email)}</dd><dt>Điện thoại</dt><dd>${esc(k.so_dien_thoai)}</dd><dt>Địa chỉ</dt><dd>${esc(k.dia_chi || '—')}</dd><dt>Ngày tạo</dt><dd>${fmtDate(k.ngay_tao)}</dd></dl></div>
      <div class="card"><div class="card-head"><h3>Lịch sử dự án tuyển dụng</h3></div><div class="card-body">${das.map((d) => { const cts = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === d.id); return `<div class="card card-pad mb" style="box-shadow:none"><div class="row between"><div><div class="strong">${esc(d.ten_du_an)}</div><div class="muted small">${Code.da(d.id)} · bắt đầu ${fmtDate(d.ngay_bat_dau)}</div></div><div class="row">${badge(d.trang_thai)}<b>${d.tien_do}%</b></div></div>
        ${cts.map((c) => `<a class="row between small" href="#/du-an/${c.id}" style="padding:8px 0;border-top:1px solid var(--border);color:inherit;text-decoration:none"><span>${esc(c.vi_tri)} <span class="code">${Code.ct(c.id)}</span></span><span class="row">${Q.hired(c.id)}/${c.so_luong} ${badge(c.trang_thai, 'sm')}</span></a>`).join('')}</div>`; }).join('') || emptyState('Chưa có dự án tuyển dụng')}</div></div></div>`;
    $('#ed').onclick = () => Dlg.customer(k.id);
    $('#nda') && ($('#nda').onclick = () => { Dlg.project(null); setTimeout(() => { const s = $('.overlay [name=ma_khach_hang]'); if (s) s.value = k.id; }, 30); });
  },
};

/* ============ NHÂN SỰ (Trưởng nhóm / BGĐ xem khối lượng công việc) ============ */
Pages.staff = {
  render(v) {
    const ns = DB.nhan_su.filter((n) => n.vai_tro !== ROLES.ADMIN);
    v.innerHTML = `<div class="page-head"><div><h1>Nhân sự tư vấn tuyển dụng</h1><p>Khối lượng công việc & khu vực công tác — hỗ trợ điều phối phân công (nhân sự cần ở cùng khu vực để đi phỏng vấn trực tiếp cùng khách hàng).</p></div>${Auth.isAdmin() ? '' : ''}</div>
      <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Nhân sự</th><th>Vai trò</th><th>Khu vực</th><th class="num">Vị trí đang phụ trách</th><th class="num">Đề cử (30 ngày)</th><th class="num">PV sắp tới</th><th>Trạng thái</th></tr></thead><tbody>
      ${ns.map((n) => { const load = DB.phan_cong.filter((p) => p.ma_nhan_su === n.id && p.trang_thai === 'Đang phụ trách' && !CT_CLOSED.includes(Q.ct(p.ma_chi_tiet_du_an).trang_thai)).length;
        return `<tr><td class="cell-main"><div class="person">${avatar(n.ho_ten)}<div><div class="nm">${esc(n.ho_ten)}</div><div class="sb">${esc(n.chuc_vu)} · ${esc(n.email)}</div></div></div></td><td data-label="Vai trò">${esc(n.vai_tro)}</td><td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td>
        <td data-label="Đang phụ trách" class="num"><span class="badge ${load >= 3 ? 'amber' : 'blue'}">${load}</span></td><td data-label="Đề cử 30 ngày" class="num">${DB.de_cu.filter((d) => d.ma_nguoi_tao === n.id && now() - new Date(d.ngay_tao) < 30 * DAY).length}</td>
        <td data-label="PV sắp tới" class="num">${DB.lich_phong_van.filter((l) => l.ma_nhan_su === n.id && l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_bat_dau) > now()).length}</td><td data-label="Trạng thái">${badge(n.trang_thai_lam_viec)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  },
};

/* ============ TÀI KHOẢN & PHÂN QUYỀN (UC_02) ============ */
Pages.accounts = {
  f: { q: '', role: '', kv: '' },
  render(v) {
    const f = this.f;
    const rows = DB.nhan_su.filter((n) => (!f.q || norm(n.ho_ten + ' ' + n.ten_dang_nhap + ' ' + n.email).includes(norm(f.q))) && (!f.role || n.vai_tro === f.role) && (!f.kv || n.ma_khu_vuc === Number(f.kv)));
    v.innerHTML = `<div class="page-head"><div><h1>Tài khoản & phân quyền</h1><p>Mỗi tài khoản gắn với một vai trò; quyền truy cập chức năng xác định theo vai trò (BR2-2).</p></div><div class="actions"><button class="btn primary" id="add">${icon('plus', 'sm')} Thêm tài khoản</button></div></div>
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo họ tên, tên đăng nhập, email…" value="${esc(f.q)}"></div>
        <select class="select" id="role" style="width:auto">${[['', 'Mọi vai trò'], ...Object.values(ROLES).map((r) => [r, r])].map(([a, b]) => `<option value="${a}" ${f.role === a ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <select class="select" id="kv" style="width:auto">${Form.opts('khu_vuc', { blank: 'Mọi khu vực' }).map(([a, b]) => `<option value="${a}" ${String(f.kv) === String(a) ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="table responsive"><thead><tr><th>Nhân sự</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Khu vực</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${rows.map((n) => `<tr><td class="cell-main"><div class="person">${avatar(n.ho_ten, 'sm')}<div><div class="nm">${esc(n.ho_ten)}</div><div class="sb">${esc(n.email)} · ${esc(n.chuc_vu)}</div></div></div></td><td data-label="Tên đăng nhập"><span class="code">${esc(n.ten_dang_nhap)}</span></td>
        <td data-label="Vai trò"><select class="select" data-role="${n.id}" style="height:32px;width:auto" ${n.id === Auth.user.id ? 'disabled' : ''}>${Object.values(ROLES).map((r) => `<option ${n.vai_tro === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
        <td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td><td data-label="Trạng thái">${badge(n.trang_thai_lam_viec)}</td>
        <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end"><button class="btn xs" data-ed="${n.id}">${icon('edit', 'sm')} Sửa</button><button class="btn xs" data-pw="${n.id}">${icon('lock', 'sm')} Đặt lại MK</button>${n.trang_thai_lam_viec === 'Đang làm việc' && n.id !== Auth.user.id ? `<button class="btn xs" data-off="${n.id}" style="color:var(--red)">Nghỉ việc</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card card-pad mt"><h3 style="font-size:15px" class="mb">Ma trận phân quyền theo vai trò</h3><div class="table-wrap"><table class="table"><thead><tr><th>Chức năng</th>${Object.values(ROLES).map((r) => `<th style="text-align:center">${r}</th>`).join('')}</tr></thead><tbody>
      ${[['Quản lý tài khoản, phân quyền', 1, 0, 0, 0], ['Quản lý khách hàng', 0, 1, 1, 1], ['Tạo dự án / tiếp nhận yêu cầu, gắn mã tin', 0, 1, 1, 1], ['Phân công nhân viên phụ trách', 0, 1, 1, 0], ['Chuẩn hóa & gắn thẻ hồ sơ ứng viên', 0, 1, 1, 1], ['Lọc & tạo đề cử', 0, 1, 1, 1], ['Duyệt / yêu cầu chỉnh sửa đề cử', 0, 1, 1, 0], ['Gửi đề cử, ghi nhận phản hồi KH', 0, 1, 1, 1], ['Lịch & kết quả phỏng vấn, kết quả tuyển dụng', 0, 1, 1, 1], ['Báo cáo - thống kê, xuất Excel/PDF', 0, 1, 1, 0], ['Phạm vi dữ liệu dự án', '—', 'Toàn bộ', 'Toàn bộ', 'Được phân công / tự tạo']]
        .map(([fn, ...c]) => `<tr><td>${fn}</td>${c.map((x) => `<td style="text-align:center">${x === 1 ? `<span style="color:var(--green)">${icon('check', 'sm')}</span>` : x === 0 ? '<span class="muted">—</span>' : `<span class="small">${x}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    $('#add').onclick = () => Dlg.account();
    $('#q').oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#q').focus(); $('#q').setSelectionRange(f.q.length, f.q.length); }, 300);
    $('#role').onchange = (e) => { f.role = e.target.value; UI.refresh(); }; $('#kv').onchange = (e) => { f.kv = e.target.value; UI.refresh(); };
    $$('[data-ed]', v).forEach((b) => (b.onclick = () => Dlg.account(Number(b.dataset.ed))));
    $$('[data-pw]', v).forEach((b) => (b.onclick = () => confirmBox({ title: 'Đặt lại mật khẩu', message: 'Hệ thống sinh mật khẩu mới, mã hóa và lưu (1c).', okText: 'Đặt lại', onOk: () => { const n = Q.ns(b.dataset.pw); const r = Svc.resetPassword(n.id); Dlg.showPassword(n, r.password); } })));
    $$('[data-off]', v).forEach((b) => (b.onclick = () => confirmBox({ title: 'Chuyển trạng thái “Đã nghỉ việc”', danger: true, okText: 'Xác nhận', message: 'Tài khoản đã phát sinh dữ liệu không bị xóa (BR2-4). Tài khoản sẽ không đăng nhập được; các phân công đang phụ trách chuyển “Đã chuyển”.', onOk: () => after(Svc.deactivateAccount(Number(b.dataset.off)), 'Đã cập nhật trạng thái') })));
    $$('[data-role]', v).forEach((s) => (s.onchange = () => after(Svc.setRole(Number(s.dataset.role), s.value), 'Đã gán vai trò ' + s.value)));
  },
};

/* ============ DANH MỤC DÙNG CHUNG ============ */
Pages.catalog = {
  render(v) {
    const cats = [['khu_vuc', 'Khu vực', 'pin'], ['linh_vuc', 'Lĩnh vực', 'building'], ['cap_bac', 'Cấp bậc', 'layers'], ['chuyen_mon', 'Chuyên môn', 'tag']];
    v.innerHTML = `<div class="page-head"><div><h1>Danh mục dùng chung</h1><p>Dùng cho khách hàng, chi tiết dự án và thẻ phân loại ứng viên.</p></div></div>
      <div class="grid g-2">${cats.map(([t, l, ic]) => `<div class="card"><div class="card-head"><h3>${icon(ic)} ${l}</h3><button class="btn sm" data-add="${t}">${icon('plus', 'sm')} Thêm</button></div><div class="card-body">${DB[t].map((r) => `<span class="tag" style="font-size:13px;padding:5px 10px">${esc(r.ten)}</span>`).join('')}</div></div>`).join('')}
      <div class="card" style="grid-column:1/-1"><div class="card-head"><h3>${icon('globe')} Kênh đăng tuyển</h3></div><div class="table-wrap"><table class="table responsive"><thead><tr><th>Kênh</th><th>Tên miền</th><th>Tiền tố mã tin</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${DB.kenh_dang_tuyen.map((k) => `<tr><td class="cell-main"><b>${esc(k.ten_kenh)}</b><div class="t-sub">${esc(k.mo_ta)}</div></td><td data-label="Tên miền">${esc(k.ten_mien || '—')}</td><td data-label="Tiền tố"><span class="code">${esc(k.tien_to)}</span></td><td data-label="Trạng thái">${badge(k.trang_thai)}</td><td data-label=""><button class="btn xs" data-tg="${k.id}">${k.trang_thai === 'Hoạt động' ? 'Ngừng' : 'Kích hoạt'}</button></td></tr>`).join('')}</tbody></table></div></div></div>`;
    $$('[data-add]', v).forEach((b) => (b.onclick = () => confirmBox({ title: 'Thêm danh mục', okText: 'Thêm', message: '', input: { label: 'Tên', required: true }, onOk: (ten) => { const r = Svc.addCatalog(b.dataset.add, ten); if (!r.ok) { toast(r.error, 'err'); return false; } toast('Đã thêm'); UI.refresh(); } })));
    $$('[data-tg]', v).forEach((b) => (b.onclick = () => after(Svc.toggleChannel(Number(b.dataset.tg)), 'Đã cập nhật kênh')));
  },
};

/* ============ BÁO CÁO - THỐNG KÊ (UC_12) ============ */
Pages.reports = {
  type: 'tien-do', f: { from: '', to: '', kh: '', vt: '', ns: '' },
  TYPES: [['tien-do', 'Tiến độ dự án', 'briefcase'], ['tre-han', 'Dự án trễ hạn', 'clock'], ['khach-hang', 'Dự án theo khách hàng', 'building'], ['ket-qua', 'Kết quả tuyển dụng', 'checkCircle'], ['chuyen-doi', 'Tỷ lệ chuyển đổi hồ sơ', 'layers'], ['hieu-suat', 'Hiệu suất đề cử nhân viên', 'users']],
  render(v) {
    const f = this.f; const t = this.TYPES.find((x) => x[0] === this.type);
    v.innerHTML = `<div class="page-head"><div><h1>Báo cáo - Thống kê</h1><p>Tổng hợp tự động từ dữ liệu hệ thống (không làm thay đổi dữ liệu gốc — BR12-5), thay cho việc gom thủ công từ nhiều tệp Excel.</p></div>
      <div class="actions"><button class="btn" id="xls">${icon('download', 'sm')} Xuất Excel</button><button class="btn" id="pdf">${icon('printer', 'sm')} Xuất PDF</button></div></div>
      <div class="chip-group mb no-print">${this.TYPES.map(([k, l, ic]) => `<button class="chip ${this.type === k ? 'active' : ''}" data-type="${k}" style="height:36px;display:inline-flex;align-items:center;gap:6px">${icon(ic, 'sm')} ${l}</button>`).join('')}</div>
      <div class="card no-print mb"><form class="filter-panel" style="padding:14px;grid-template-columns:repeat(5,minmax(0,1fr))" id="rf" onsubmit="return false">
        ${Form.field('Từ ngày', 'from', { type: 'date', value: f.from })}${Form.field('Đến ngày', 'to', { type: 'date', value: f.to })}
        ${Form.field('Khách hàng', 'kh', { opts: Form.opts('khach_hang', { blank: 'Tất cả' }), value: f.kh })}${Form.field('Vị trí', 'vt', { value: f.vt, ph: 'Từ khóa vị trí' })}
        ${Form.field('Nhân viên', 'ns', { opts: [['', 'Tất cả'], ...DB.nhan_su.filter((n) => n.vai_tro === ROLES.NV).map((n) => [n.id, n.ho_ten])], value: f.ns })}</form></div>
      <div class="print-only"><h2>${t[1].toUpperCase()}</h2><p>Navigos Group Việt Nam — xuất lúc ${fmtDT(new Date())} — ${esc(Auth.user.ho_ten)}${f.from || f.to ? ` — kỳ ${fmtDate(f.from) } → ${fmtDate(f.to)}` : ''}</p></div>
      <div id="rbody"></div>`;
    if (innerWidth <= 720) $('#rf').style.gridTemplateColumns = '1fr 1fr';
    $$('[data-type]', v).forEach((b) => (b.onclick = () => { this.type = b.dataset.type; UI.refresh(); }));
    $$('#rf [name]').forEach((el) => (el.onchange = () => { Object.assign(f, Form.values($('#rf'))); this.body(); }));
    $('#pdf').onclick = () => Export.pdf();
    $('#xls').onclick = () => { const x = this._export; if (!x || !x.rows.length) return toast('Không có dữ liệu để xuất', 'warn'); Export.excel(`BaoCao_${this.type}_${todayStr()}`, t[1], x.headers, x.rows); };
    this.body();
  },
  body() {
    const f = this.f; const b = $('#rbody'); const pct = (a, c) => (c ? Math.round((a / c) * 100) : 0);
    const tbl = (headers, rows, numCols = []) => `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr>${headers.map((h, i) => `<th class="${numCols.includes(i) ? 'num' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${esc(headers[i])}" class="${i === 0 ? 'cell-main' : ''} ${numCols.includes(i) ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    const none = () => { b.innerHTML = `<div class="card">${emptyState('Không có dữ liệu trong bộ lọc đã chọn — hãy chọn lại bộ lọc (5a).', 'search')}</div>`; this._export = null; };
    if (this.type === 'tien-do' || this.type === 'tre-han') {
      const rows = this.type === 'tien-do' ? Reports.progress(f) : Reports.overdue(f); if (!rows.length) return none();
      const st = groupBy(rows, (r) => r.ct.trang_thai);
      b.innerHTML = `<div class="grid g-4 kpis mb">${[['Vị trí', rows.length], ['Cần tuyển', sum(rows.map((r) => r.ct.so_luong))], ['Đã nhận việc', sum(rows.map((r) => r.hired))], [this.type === 'tien-do' ? 'Sắp/quá hạn' : 'Số ngày trễ TB', this.type === 'tien-do' ? rows.filter((r) => r.dl).length : Math.round(sum(rows.map((r) => -daysUntil(r.ct.han_hoan_thanh))) / rows.length)]].map(([l, n]) => `<div class="card kpi"><div><div class="label">${l}</div><div class="value">${n}</div></div></div>`).join('')}</div>
        ${this.type === 'tien-do' ? `<div class="grid g-2 mb"><div class="card"><div class="card-head"><h3>Vị trí theo trạng thái</h3></div><div class="card-body">${Charts.donut({ data: Object.values(ST.CT).map((s, i) => ({ label: s, value: (st[s] || []).length, color: ['#22b4e6', '#0a6cff', '#12a150', '#94a3b8', '#e5383b'][i] })), center: 'vị trí', size: 180 })}</div></div>
          <div class="card"><div class="card-head"><h3>Tiến độ các vị trí đang thực hiện</h3></div><div class="card-body">${rows.filter((r) => r.ct.trang_thai === ST.CT.DANG).map((r) => `<div class="mb" style="margin-bottom:10px"><div class="prog-meta"><span class="strong" style="font-size:12px">${esc(r.ct.vi_tri)}</span><span>${r.hired}/${r.ct.so_luong}</span></div>${progressBar(r.pct, r.dl?.level === 'red' ? 'red' : r.dl ? 'amber' : '')}</div>`).join('') || emptyState('Không có')}</div></div></div>` : `<div class="callout red mb">${icon('alert', 'sm')}<div>Dự án trễ hạn: đã quá hạn hoàn thành mà chưa Hoàn thành / Đã đóng / Đã hủy (BR12-3).</div></div>`}
        ${tbl(['Vị trí', 'Khách hàng', 'Phụ trách', 'Hạn', 'Cần', 'Nhận việc', 'Tiến độ', 'Đề cử', 'Phỏng vấn', 'Trạng thái'], rows.map((r) => [`<a href="#/du-an/${r.ct.id}">${esc(r.ct.vi_tri)}</a><div class="t-sub">${Code.ct(r.ct.id)}</div>`, esc(r.kh.ten_cong_ty), esc(r.staff || '—'), `${fmtDate(r.ct.han_hoan_thanh)}${r.dl ? `<div><span class="badge sm ${r.dl.level}">${r.dl.text}</span></div>` : ''}`, r.ct.so_luong, r.hired, r.pct + '%', r.decu, r.pv, badge(r.ct.trang_thai)]), [4, 5, 6, 7, 8])}`;
      this._export = { headers: ['ID', 'Vị trí', 'Khách hàng', 'Phụ trách', 'Hạn hoàn thành', 'Cảnh báo', 'Cần tuyển', 'Đã nhận việc', 'Tiến độ %', 'Số đề cử', 'Số phỏng vấn', 'Trạng thái'], rows: rows.map((r) => [Code.ct(r.ct.id), r.ct.vi_tri, r.kh.ten_cong_ty, r.staff, fmtDate(r.ct.han_hoan_thanh), r.dl?.text || '', r.ct.so_luong, r.hired, r.pct, r.decu, r.pv, r.ct.trang_thai]) };
    } else if (this.type === 'khach-hang') {
      const rows = Reports.byCustomer(f); if (!rows.length) return none();
      b.innerHTML = `<div class="card mb"><div class="card-head"><h3>Số vị trí & nhận việc theo khách hàng</h3></div><div class="card-body">${Charts.bars({ data: rows.map((r) => ({ label: r.kh.ten_cong_ty.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, ''), value: r.vitri })), h: 200 })}</div></div>
        ${tbl(['Khách hàng', 'Dự án TD', 'Vị trí', 'Đang mở', 'Hoàn thành', 'Trễ hạn', 'Cần tuyển', 'Đã nhận việc', 'Tỷ lệ'], rows.map((r) => [`<a href="#/khach-hang/${r.kh.id}">${esc(r.kh.ten_cong_ty)}</a>`, r.duan, r.vitri, r.dang, r.xong, r.tre ? `<span class="badge red sm">${r.tre}</span>` : 0, r.can, r.nhan, pct(r.nhan, r.can) + '%']), [1, 2, 3, 4, 5, 6, 7, 8])}`;
      this._export = { headers: ['Khách hàng', 'Số dự án tuyển dụng', 'Số vị trí', 'Đang mở', 'Hoàn thành', 'Trễ hạn', 'Cần tuyển', 'Đã nhận việc', 'Tỷ lệ %'], rows: rows.map((r) => [r.kh.ten_cong_ty, r.duan, r.vitri, r.dang, r.xong, r.tre, r.can, r.nhan, pct(r.nhan, r.can)]) };
    } else if (this.type === 'ket-qua') {
      const rows = Reports.hiring(f); if (!rows.length) return none();
      const acc = rows.filter((r) => r.k.ket_qua === 'Chấp nhận offer');
      b.innerHTML = `<div class="grid g-4 kpis mb">${[['Kết quả ghi nhận', rows.length], ['Chấp nhận offer', acc.length], ['Từ chối offer', rows.length - acc.length], ['Tỷ lệ nhận offer', pct(acc.length, rows.length) + '%']].map(([l, n]) => `<div class="card kpi"><div><div class="label">${l}</div><div class="value">${n}</div></div></div>`).join('')}</div>
        ${tbl(['Ứng viên', 'Vị trí', 'Khách hàng', 'Kết quả', 'Ngày nhận việc / Lý do', 'KH báo', 'Hồ sơ hiện tại'], rows.map((r) => [esc(r.uv.ho_ten), esc(r.ct.vi_tri), esc(r.kh.ten_cong_ty), badge(r.k.ket_qua), r.k.ngay_nhan_viec ? fmtDate(r.k.ngay_nhan_viec) : esc(r.k.ly_do_tu_choi || ''), fmtDate(r.k.ngay_khach_hang_bao), badge(r.hs.trang_thai)]))}`;
      this._export = { headers: ['Ứng viên', 'Vị trí', 'Khách hàng', 'Kết quả', 'Ngày nhận việc', 'Lý do từ chối', 'Ngày KH báo', 'Trạng thái hồ sơ'], rows: rows.map((r) => [r.uv.ho_ten, r.ct.vi_tri, r.kh.ten_cong_ty, r.k.ket_qua, fmtDate(r.k.ngay_nhan_viec), r.k.ly_do_tu_choi || '', fmtDate(r.k.ngay_khach_hang_bao), r.hs.trang_thai]) };
    } else if (this.type === 'chuyen-doi') {
      const steps = Reports.conversion(f); if (!steps[0].value) return none();
      b.innerHTML = `<div class="grid g-main"><div class="card"><div class="card-head"><div><h3>Phễu chuyển đổi theo trạng thái hồ sơ</h3><p>Tỷ lệ = số hồ sơ đạt tới trạng thái sau / số hồ sơ ở trạng thái trước × 100 (BR12-2)</p></div></div><div class="card-body">${Charts.funnel(steps)}</div></div>
        <div class="card card-pad"><div class="strong mb">Diễn giải</div>${steps.slice(1).map((s, i) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>${steps[i].label} → ${s.label}</span><b>${pct(s.value, steps[i].value)}%</b></div>`).join('')}
          <div class="row between" style="padding:8px 0"><span>Apply → Nhận việc (tổng thể)</span><b>${pct(steps[3].value, steps[0].value)}%</b></div>
          <p class="muted small">Đếm theo các mốc trong bảng Lịch sử trạng thái — một hồ sơ được tính ở mọi trạng thái nó từng đạt tới, kể cả sau đó bị loại.</p></div></div>
        <div class="mt">${tbl(['Vị trí', 'Mới apply', 'Đề cử', 'Phỏng vấn', 'Thử việc', 'Apply → Thử việc'], Reports.scopeCts(f).map((ct) => { const s = Reports.conversion({ ...f, ctId: ct.id }); return s[0].value ? [esc(ct.vi_tri), s[0].value, s[1].value, s[2].value, s[3].value, pct(s[3].value, s[0].value) + '%'] : null; }).filter(Boolean), [1, 2, 3, 4, 5])}</div>`;
      this._export = { headers: ['Giai đoạn', 'Số hồ sơ', 'Tỷ lệ so với giai đoạn trước %'], rows: steps.map((s, i) => [s.label, s.value, i ? pct(s.value, steps[i - 1].value) : 100]) };
    } else {
      const rows = Reports.staffPerf(f); if (!rows.length) return none();
      b.innerHTML = `<div class="callout mb">${icon('info', 'sm')}<div>Đánh giá <b>hiệu suất lọc CV</b> của nhân viên: tỷ lệ đề cử được Trưởng nhóm duyệt, tỷ lệ khách hàng đồng ý phỏng vấn, số ứng viên nhận việc (BR12-4). Bấm “In danh sách” để in danh sách đề cử của từng nhân viên.</div></div>
        <div class="card mb"><div class="card-head"><h3>Số đề cử & nhận việc theo nhân viên</h3></div><div class="card-body">${Charts.bars({ data: rows.map((r) => ({ label: r.n.ho_ten.split(' ').slice(-2).join(' '), value: r.decu })), h: 190 })}</div></div>
        ${tbl(['Nhân viên', 'Vị trí phụ trách', 'Đề cử', 'Được duyệt', 'Bị yêu cầu sửa', 'Đã gửi KH', 'KH đồng ý PV', 'Lượt PV', 'Nhận việc', 'Tỷ lệ duyệt', 'Tỷ lệ KH chấp nhận', ''], rows.map((r) => [`<div class="person">${avatar(r.n.ho_ten, 'sm')}<span class="nm">${esc(r.n.ho_ten)}</span></div>`, r.duan, r.decu, r.approved, r.sua, r.sent, r.accepted, r.pv, `<b>${r.hired}</b>`, r.rateApprove + '%', r.rateClient + '%', `<button class="btn xs no-print" data-prn="${r.n.id}">${icon('printer', 'sm')} In danh sách</button>`]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}`;
      $$('[data-prn]', b).forEach((x) => (x.onclick = () => { const r = rows.find((y) => y.n.id === Number(x.dataset.prn)); if (!r.dcs.length) return toast('Nhân viên chưa có đề cử trong kỳ', 'warn'); Dlg.printRecs(r.dcs); }));
      this._export = { headers: ['Nhân viên', 'Vị trí phụ trách', 'Số đề cử', 'Được duyệt', 'Bị yêu cầu sửa', 'Đã gửi KH', 'KH đồng ý PV', 'Lượt PV', 'Nhận việc', 'Tỷ lệ duyệt %', 'Tỷ lệ KH chấp nhận %'], rows: rows.map((r) => [r.n.ho_ten, r.duan, r.decu, r.approved, r.sua, r.sent, r.accepted, r.pv, r.hired, r.rateApprove, r.rateClient]) };
    }
  },
};

/* ============ CÀI ĐẶT ============ */
Pages.settings = {
  render(v) {
    v.innerHTML = `<div class="page-head"><div><h1>Cài đặt</h1><p>Thông tin tài khoản và dữ liệu demo.</p></div></div>
      <div class="grid g-2"><div class="card card-pad"><div class="person">${avatar(Auth.user.ho_ten, 'lg')}<div><div class="strong" style="font-size:18px">${esc(Auth.user.ho_ten)}</div><div class="muted">${esc(Auth.user.vai_tro)} · ${esc(Auth.user.chuc_vu)}</div></div></div>
        <dl class="kv mt"><dt>Tên đăng nhập</dt><dd>${esc(Auth.user.ten_dang_nhap)}</dd><dt>Email</dt><dd>${esc(Auth.user.email)}</dd><dt>Khu vực</dt><dd>${esc(Store.name('khu_vuc', Auth.user.ma_khu_vuc))}</dd></dl></div>
      <div class="card card-pad"><h3 style="font-size:16px">Dữ liệu demo</h3><p class="t2 small">Dữ liệu lưu trong CSDL <b>MySQL</b> (${esc(App.server?.db || 'navigos_talent')}). Khôi phục để xóa toàn bộ dữ liệu và nạp lại bộ dữ liệu mẫu ban đầu — hữu ích trước buổi demo/bảo vệ.</p>
        <div class="row"><button class="btn danger" id="reset">${icon('refresh', 'sm')} Khôi phục dữ liệu mẫu</button><button class="btn" id="dl">${icon('download', 'sm')} Tải bản sao lưu (JSON)</button></div>
        <div class="callout mt">${icon('info', 'sm')}<div>Kiến trúc: trình duyệt → API Node.js (<span class="code">server/</span>) → MySQL 8 (lược đồ <span class="code">database/schema.sql</span>). Quy tắc nghiệp vụ trong <span class="code">js/services.js</span> được <b>thực thi trên máy chủ</b>; mỗi thao tác ghi vào MySQL trong một giao dịch (transaction).</div></div></div></div>`;
    $('#reset').onclick = () => confirmBox({ title: 'Khôi phục dữ liệu mẫu', danger: true, okText: 'Khôi phục', message: 'Toàn bộ thay đổi trên trình duyệt này sẽ bị thay bằng bộ dữ liệu mẫu ban đầu.', onOk: () => { const r = Store.reset(); if (r && r.ok === false) { toast(r.error, 'err'); return false; } toast('Đã khôi phục dữ liệu mẫu'); Router.go('#/'); Router.resolve(); } });
    $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Store.db, null, 1)], { type: 'application/json' })); a.download = 'navigos_talent_backup_' + todayStr() + '.json'; a.click(); };
  },
};

/* ============ TÌM KIẾM TOÀN CỤC ============ */
Pages.search = {
  render(v, p, { q = '' }) {
    const k = norm(q); const cts = Q.visibleCts().filter((c) => norm(c.vi_tri + ' ' + Code.ct(c.id) + ' ' + Q.khOfCt(c).ten_cong_ty).includes(k));
    const uvs = DB.ung_vien.filter((u) => norm(u.ho_ten + ' ' + u.email + ' ' + u.so_dien_thoai + ' ' + Code.uv(u.id) + ' ' + u.ky_nang).includes(k)).slice(0, 20);
    const khs = DB.khach_hang.filter((x) => norm(x.ten_cong_ty + ' ' + x.nguoi_lien_he).includes(k));
    $('#gsearch') && ($('#gsearch').value = q);
    v.innerHTML = `<div class="page-head"><div><h1>Kết quả tìm kiếm “${esc(q)}”</h1><p>${cts.length + uvs.length + khs.length} kết quả</p></div></div>
      <div class="grid g-3">
      <div class="card"><div class="card-head"><h3>${icon('briefcase')} Vị trí (${cts.length})</h3></div><div class="card-body">${cts.map((c) => `<a class="alert" href="#/du-an/${c.id}" style="color:inherit;text-decoration:none"><div><div class="tt">${esc(c.vi_tri)}</div><div class="ds">${Code.ct(c.id)} · ${esc(Q.khOfCt(c).ten_cong_ty)}</div></div></a>`).join('') || emptyState('Không có')}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('users')} Ứng viên (${uvs.length})</h3></div><div class="card-body">${uvs.map((u) => `<a class="alert" href="#/ung-vien/${u.id}" style="color:inherit;text-decoration:none">${avatar(u.ho_ten, 'sm')}<div><div class="tt">${esc(u.ho_ten)}</div><div class="ds">${Code.uv(u.id)} · ${esc(u.trang_thai)}</div></div></a>`).join('') || emptyState('Không có')}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('building')} Khách hàng (${khs.length})</h3></div><div class="card-body">${khs.map((x) => `<a class="alert" href="#/khach-hang/${x.id}" style="color:inherit;text-decoration:none"><div><div class="tt">${esc(x.ten_cong_ty)}</div><div class="ds">${esc(x.nguoi_lien_he)}</div></div></a>`).join('') || emptyState('Không có')}</div></div></div>`;
  },
};
