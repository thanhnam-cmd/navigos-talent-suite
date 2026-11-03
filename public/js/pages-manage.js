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
    const all = DB.lich_phong_van.filter((l) => ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an) && Q.lichVisible(l));
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
      <div class="actions"><div class="input-ico" style="min-width:220px">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên ứng viên, ID vị trí…" value="${esc(f.q)}"></div>${Auth.canOperate() && Q.handledCts().length ? `<button class="btn primary" id="add">${icon('plus', 'sm')} Thêm lịch mới</button>` : ''}</div></div>
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
    $('#add') && ($('#add').onclick = () => {
      const mine = new Set(Q.handledCts().map((c) => c.id));
      const ready = DB.ho_so_ung_tuyen.filter((h) => mine.has(h.ma_chi_tiet_du_an) && Q.canSchedule(h));
      if (!ready.length) return toast('Chưa có hồ sơ sẵn sàng lên lịch: khách hàng đồng ý phỏng vấn, hoặc đã phỏng vấn xong và cần thêm buổi.', 'warn');
      Dlg.pickHsForInterview(ready);
    });
  },
};

/* ============ KẾT QUẢ TUYỂN DỤNG (UC_09, UC_11 — Fix Demo lần 1) ============
   Tab "Kết quả phỏng vấn": Nhân viên thao tác (ghi nhận / sửa / tạo lịch vòng tiếp); Quản lý & BGĐ chỉ xem. */
Pages.results = {
  tab: 'chua', f: { q: '', ns: '', kq: '' },
  render(v, p, query) {
    if (query.tab) { this.tab = query.tab; history.replaceState(null, '', '#/ket-qua'); }
    const op = Auth.canOperate();
    const ctIds = new Set(Q.visibleCts().map((c) => c.id));
    // Nhân viên vai trò Hỗ trợ chỉ thấy buổi phỏng vấn của mình; kết quả tuyển dụng thuộc người phụ trách
    const hsCtIds = Auth.isStaff() ? new Set(Q.handledCts().map((c) => c.id)) : ctIds;
    const hs = DB.ho_so_ung_tuyen.filter((h) => hsCtIds.has(h.ma_chi_tiet_du_an));
    const passLich = (h) => Q.lichOfHs(h.id).filter((x) => Q.kqPv(x.id)?.ket_qua === 'Đạt').at(-1);
    const waiting = hs.filter((h) => h.trang_thai === ST.HS.PV && passLich(h) && !Q.kqTd(h.id));
    const kq = DB.ket_qua_tuyen_dung.filter((k) => hsCtIds.has(Q.hs(k.ma_ho_so_ung_vien).ma_chi_tiet_du_an));
    const acc = kq.filter((k) => k.ket_qua === 'Chấp nhận offer'); const rej = kq.filter((k) => k.ket_qua === 'Từ chối offer');
    const probation = hs.filter((h) => h.trang_thai === ST.HS.TV);
    const failed = hs.filter((h) => h.trang_thai === ST.HS.LOAI && Q.history(h.id).some((x) => x.trang_thai_moi === ST.HS.TV));
    const seen = DB.lich_phong_van.filter((l) => l.trang_thai !== ST.LICH.HUY && ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an) && Q.lichVisible(l));
    const chua = seen.filter((l) => !Q.kqPv(l.id) && l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_ket_thuc) < now()).sort((a, b) => b.thoi_gian_bat_dau.localeCompare(a.thoi_gian_bat_dau));
    const ivs = seen.filter((l) => Q.kqPv(l.id));
    v.innerHTML = `<div class="page-head"><div><h1>Kết quả tuyển dụng</h1></div></div>
      <div class="grid g-4 kpis mb">
        <div class="card kpi"><div><div class="label">Chờ kết quả từ KH</div><div class="value">${waiting.length}</div><div class="sub">Đã đạt phỏng vấn</div></div><div class="ico tone-amber">${icon('clock')}</div></div>
        <div class="card kpi"><div><div class="label">Chấp nhận offer</div><div class="value">${acc.length}</div><div class="sub">Đang thử việc: ${probation.length}</div></div><div class="ico tone-green">${icon('userCheck')}</div></div>
        <div class="card kpi"><div><div class="label">Từ chối offer</div><div class="value">${rej.length}</div></div><div class="ico tone-red">${icon('userX')}</div></div>
        <div class="card kpi"><div><div class="label">Tỷ lệ nhận offer</div><div class="value">${kq.length ? Math.round((acc.length / kq.length) * 100) : 0}%</div><div class="sub">${failed.length} thử việc không đạt → về kho</div></div><div class="ico tone-blue">${icon('chart')}</div></div></div>
      <div class="tabs">${[['chua', `Chưa có kết quả PV (${chua.length})`], ['pv', `Kết quả phỏng vấn (${ivs.length})`], ['cho', `Chờ ghi nhận (${waiting.length})`], ['tat-ca', `Đã ghi nhận (${kq.length})`], ['tv', `Đang thử việc (${probation.length})`], ['du-an', 'Theo vị trí']].map(([k, l]) => `<button data-t="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="kb"></div>`;
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    const kb = $('#kb');
    const who = (h) => { const u = Q.uv(h.ma_ung_vien); return `<td class="cell-main"><div class="person">${avatar(u.ho_ten, 'sm')}<div><div class="nm">${esc(u.ho_ten)}</div><div class="sb">${Code.hs(h.id)}</div></div></div></td>`; };
    const pos = (h) => { const ct = Q.ct(h.ma_chi_tiet_du_an); return `<td data-label="Vị trí"><a href="#/du-an/${ct.id}">${esc(ct.vi_tri)}</a><div class="t-sub">${esc(Q.khOfCt(ct).ten_cong_ty)}</div></td>`; };
    const fbText = (l) => { const f = Q.feedbacks(l.id).at(-1); return f ? `<span title="${esc(f.noi_dung)}">${esc(f.noi_dung.slice(0, 70))}${f.noi_dung.length > 70 ? '…' : ''}</span>` : '<span class="muted">Chưa có feedback</span>'; };
    const table = (head, rows, empty) => `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th>${head.map((h) => `<th${h.startsWith('!') ? ' class="num"' : ''}>${h.replace(/^!/, '')}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length + 1}">${emptyState(empty, 'checkCircle')}</td></tr>`}</tbody></table></div></div>`;

    if (this.tab === 'chua') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', 'Ngày phỏng vấn', 'Vòng', 'Nhân viên PV', 'Trạng thái', '!Thao tác'],
        chua.map((l, i) => { const h = Q.hs(l.ma_ho_so_ung_vien); const ns = Q.ns(l.ma_nhan_su);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Ngày PV" class="nowrap">${fmtDate(l.thoi_gian_bat_dau)}<div class="t-sub">${fmtTime(l.thoi_gian_bat_dau)} – ${fmtTime(l.thoi_gian_ket_thuc)}</div></td>
            <td data-label="Vòng">Vòng ${l.vong}</td><td data-label="NV PV">${esc(ns.ho_ten)}</td><td data-label="Trạng thái"><span class="badge amber">Chưa có kết quả</span></td>
            <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${op && Q.canRecordIv(l) ? `${act('checkCircle', 'Ghi nhận kết quả phỏng vấn', `data-ghi="${l.id}"`, 'primary', 'Nhập kết quả, điểm và feedback của buổi này')}` : `${act('eye', 'Xem chi tiết phỏng vấn', `data-ivview="${l.id}"`, '', 'Thông tin buổi, kết quả và feedback')}`}${act('file', 'Mở hồ sơ', `data-open="${h.id}"`, '', 'Xem hồ sơ ứng tuyển của ứng viên')}</div></td></tr>`; }), 'Không có buổi phỏng vấn nào chờ ghi nhận kết quả');
    } else if (this.tab === 'pv') {
      const f = this.f; const staffIds = [...new Set(ivs.map((l) => l.ma_nhan_su))];
      const status = (l) => Q.kqPv(l.id)?.ket_qua;
      const list = ivs.filter((l) => { const h = Q.hs(l.ma_ho_so_ung_vien); const u = Q.uv(h.ma_ung_vien); const c = Q.ct(h.ma_chi_tiet_du_an);
        return (!f.q || norm(`${u.ho_ten} ${c.vi_tri}`).includes(norm(f.q))) && (!f.ns || l.ma_nhan_su === Number(f.ns)) && (!f.kq || status(l) === f.kq); })
        .sort((a, b) => b.thoi_gian_bat_dau.localeCompare(a.thoi_gian_bat_dau));
      const chips = ['', 'Đạt', 'Không đạt', 'Cần phỏng vấn thêm'];
      const actions = (l) => {
        const h = Q.hs(l.ma_ho_so_ung_vien); const k = Q.kqPv(l.id);
        if (!op || !Q.canRecordIv(l)) return `${act('eye', 'Xem chi tiết phỏng vấn', `data-ivview="${l.id}"`, '', 'Thông tin buổi, kết quả và feedback')}`;
        const b = [];
        if (!k) b.push(`${act('checkCircle', 'Ghi nhận kết quả phỏng vấn', `data-ghi="${l.id}"`, 'primary', 'Nhập kết quả, điểm và feedback của buổi này')}`); else b.push(`${act('edit', 'Sửa kết quả phỏng vấn', `data-sua="${l.id}"`, '', 'Chỉnh sửa kết quả đã ghi nhận')}`);
        const latest = Q.lichOfHs(h.id).filter((x) => x.trang_thai !== ST.LICH.HUY).at(-1)?.id === l.id;
        if (k?.ket_qua === 'Cần phỏng vấn thêm' && latest && h.trang_thai === ST.HS.PV && Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an))) b.push(`${act('calendar', `Tạo lịch vòng ${l.vong + 1}`, `data-vong="${h.id}"`, 'primary', 'Khách hàng yêu cầu phỏng vấn thêm')}`);
        b.push(`${act('file', 'Mở hồ sơ', `data-open="${h.id}"`, '', 'Xem hồ sơ ứng tuyển của ứng viên')}`);
        return `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${b.join('')}</div>`;
      };
      kb.innerHTML = `<div class="card mb"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="fq" placeholder="Tìm theo tên ứng viên, vị trí…" value="${esc(f.q)}"></div>
          <select class="select" id="fns" style="width:auto">${[['', 'Mọi nhân viên'], ...staffIds.map((id) => [id, Q.ns(id).ho_ten])].map(([a, b]) => `<option value="${a}" ${String(f.ns) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>
          <div class="chip-group">${chips.map((c) => `<button class="chip ${f.kq === c ? 'active' : ''}" data-kq="${c}">${c || 'Tất cả'} ${ivs.filter((l) => !c || status(l) === c).length}</button>`).join('')}</div></div></div>`
        + table(['Ứng viên', 'Vị trí', 'Ngày phỏng vấn', 'Nhân viên PV', 'Kết quả PV', '!Điểm', 'Feedback khách hàng', '!Thao tác'],
          list.map((l, i) => { const h = Q.hs(l.ma_ho_so_ung_vien); const k = Q.kqPv(l.id); const ns = Q.ns(l.ma_nhan_su);
            return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Ngày PV" class="nowrap">${fmtDate(l.thoi_gian_bat_dau)}<div class="t-sub">Vòng ${l.vong}</div></td>
              <td data-label="NV PV">${esc(ns.ho_ten)}<div class="t-sub">${esc(Store.name('khu_vuc', ns.ma_khu_vuc))}</div></td>
              <td data-label="Kết quả PV">${badge(k.ket_qua)}<div class="t-sub">${k?.ket_qua === 'Đạt' ? (Q.kqTd(h.id) ? 'Đã có kết quả TD' : '→ Chờ ghi nhận') : k?.ket_qua === 'Không đạt' ? 'Hồ sơ Bị loại' : k ? 'Giữ ở Phỏng vấn' : ''}</div></td>
              <td data-label="Điểm" class="num">${k?.diem_danh_gia != null ? `<b>${k.diem_danh_gia}</b>/10` : '—'}</td>
              <td data-label="Feedback KH" class="small" style="max-width:240px">${fbText(l)}</td><td data-label="">${actions(l)}</td></tr>`; }), 'Chưa có kết quả phỏng vấn nào');
      $('#fq', kb).oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#fq').focus(); $('#fq').setSelectionRange(f.q.length, f.q.length); }, 300);
      $('#fns', kb).onchange = (e) => { f.ns = e.target.value; UI.refresh(); };
      $$('[data-kq]', kb).forEach((b) => (b.onclick = () => { f.kq = b.dataset.kq; UI.refresh(); }));
    } else if (this.tab === 'cho') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', '!Điểm PV', 'Ngày đạt PV', 'Feedback (phỏng vấn)', '!Thao tác'],
        waiting.map((h, i) => { const l = passLich(h); const k = Q.kqPv(l.id);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Điểm PV" class="num"><b>${k.diem_danh_gia ?? '—'}</b>/10</td>
            <td data-label="Ngày đạt PV" class="nowrap" title="Ngày ghi nhận ứng viên ĐẠT phỏng vấn">${fmtDate(k.ngay_ghi_nhan)}<div class="t-sub">${relTime(k.ngay_ghi_nhan)} · vòng ${l.vong}</div></td>
            <td data-label="Feedback" class="small" style="max-width:260px">${fbText(l)}</td>
            <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${op && Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an)) ? `${act('checkCircle', 'Ghi nhận kết quả tuyển dụng', `data-hire="${h.id}"`, 'success', 'Khách hàng báo nhận hoặc từ chối offer')}` : ''}${act('file', 'Mở hồ sơ', `data-open="${h.id}"`, '', 'Xem hồ sơ ứng tuyển của ứng viên')}</div></td></tr>`; }), 'Không có ứng viên chờ kết quả');
    } else if (this.tab === 'tv') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', 'Ngày nhận việc', 'Email xác nhận', '!Thao tác'],
        probation.map((h, i) => { const k = Q.kqTd(h.id);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Nhận việc">${fmtDate(k?.ngay_nhan_viec)}</td><td data-label="Email">${icon('file', 'sm')} <span class="small">${esc(k?.email_xac_nhan || '—')}</span></td>
            <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${op && Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an)) ? `${act('userX', 'Thử việc không đạt', `data-prob="${h.id}"`, 'danger', 'Trả ứng viên về kho hồ sơ')}` : ''}${act('file', 'Mở hồ sơ', `data-open="${h.id}"`, '', 'Xem hồ sơ ứng tuyển của ứng viên')}</div></td></tr>`; }), 'Chưa có');
    } else if (this.tab === 'tat-ca') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', 'Kết quả', 'KH báo', 'Chi tiết', '!Thao tác'],
        kq.sort((a, b) => b.ngay_ghi_nhan.localeCompare(a.ngay_ghi_nhan)).map((k, i) => { const h = Q.hs(k.ma_ho_so_ung_vien);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Kết quả">${badge(k.ket_qua)}</td><td data-label="KH báo">${fmtDate(k.ngay_khach_hang_bao)}</td><td data-label="Chi tiết" class="small">${k.ngay_nhan_viec ? 'Nhận việc ' + fmtDate(k.ngay_nhan_viec) : esc(k.ly_do_tu_choi || '')}${h.trang_thai === ST.HS.LOAI && k.ket_qua === 'Chấp nhận offer' ? '<br><span class="badge sm red">Thử việc không đạt</span>' : ''}</td><td data-label="">${act('file', 'Mở hồ sơ', `data-open="${h.id}"`, '', 'Xem hồ sơ ứng tuyển của ứng viên')}</td></tr>`; }), 'Chưa có kết quả');
    } else {
      kb.innerHTML = `<div class="grid g-2">${Q.visibleCts().filter((c) => c.trang_thai !== ST.CT.MOI).map((c) => { const h = Q.hired(c.id); const pct = Math.min(100, Math.round((h / c.so_luong) * 100)); return `<a class="card card-pad" href="#/du-an/${c.id}" style="color:inherit;text-decoration:none"><div class="row between"><div><div class="strong">${esc(c.vi_tri)}</div><div class="muted small">${Code.ct(c.id)} · ${esc(Q.khOfCt(c).ten_cong_ty)}</div></div>${badge(c.trang_thai)}</div><div class="prog-meta mt-sm"><span>${h}/${c.so_luong} nhận việc</span><span>${pct}%</span></div>${progressBar(pct, pct >= 100 ? 'green' : '')}<div class="row mt-sm small t2" style="gap:14px"><span>Từ chối offer: <b>${Q.hsOfCt(c.id).filter((x) => Q.kqTd(x.id)?.ket_qua === 'Từ chối offer').length}</b></span><span>Đang PV: <b>${Q.hsOfCt(c.id).filter((x) => x.trang_thai === ST.HS.PV).length}</b></span></div></a>`; }).join('')}</div>`;
    }
    $$('[data-hire]', kb).forEach((b) => (b.onclick = () => Dlg.hiring(Number(b.dataset.hire))));
    $$('[data-prob]', kb).forEach((b) => (b.onclick = () => Dlg.probation(Number(b.dataset.prob))));
    $$('[data-open]', kb).forEach((b) => (b.onclick = () => Comp.hsDrawer(Number(b.dataset.open))));
    $$('[data-ivview]', kb).forEach((b) => (b.onclick = () => Dlg.interviewDetail(Number(b.dataset.ivview))));
    $$('[data-ghi]', kb).forEach((b) => (b.onclick = () => Dlg.interviewResult(Number(b.dataset.ghi))));
    $$('[data-sua]', kb).forEach((b) => (b.onclick = () => Dlg.interviewResult(Number(b.dataset.sua), null, { edit: true })));
    $$('[data-vong]', kb).forEach((b) => (b.onclick = () => Dlg.interview(Number(b.dataset.vong))));
  },
};

/* ============ KHÁCH HÀNG (UC_03) ============ */
Pages.customers = {
  f: { q: '', lv: '', tt: '' },
  render(v) {
    const f = this.f;
    const rows = DB.khach_hang.filter((k) => (!f.q || norm(k.ten_cong_ty + ' ' + k.nguoi_lien_he + ' ' + k.email).includes(norm(f.q))) && (!f.lv || k.ma_linh_vuc === Number(f.lv)) && (!f.tt || k.trang_thai_hop_tac === f.tt));
    v.innerHTML = `<div class="page-head"><div><h1>Danh sách khách hàng</h1><p>Dữ liệu nền để tạo dự án tuyển dụng — theo dõi số dự án và vị trí đang triển khai của từng khách hàng.</p></div><div class="actions">${Auth.canOperate() ? `<button class="btn primary" id="add">${icon('plus', 'sm')} Thêm khách hàng</button>` : ''}</div></div>
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên công ty, người liên hệ, email…" value="${esc(f.q)}"></div>
        <select class="select" id="lv" style="width:auto">${Form.opts('linh_vuc', { blank: 'Mọi lĩnh vực' }).map(([a, b]) => `<option value="${a}" ${String(f.lv) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>
        <select class="select" id="tt" style="width:auto">${[['', 'Mọi trạng thái'], ['Đang hợp tác', 'Đang hợp tác'], ['Ngừng hợp tác', 'Ngừng hợp tác']].map(([a, b]) => `<option value="${a}" ${f.tt === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th><th>Khách hàng</th><th>Lĩnh vực</th><th>Liên hệ</th><th class="num">Dự án</th><th class="num">Vị trí đang mở</th><th>Trạng thái</th></tr></thead><tbody>
      ${rows.map((k, i) => { const das = DB.du_an_tuyen_dung.filter((d) => d.ma_khach_hang === k.id); const open = DB.chi_tiet_du_an.filter((c) => das.some((d) => d.id === c.ma_du_an) && !CT_CLOSED.includes(c.trang_thai)).length;
        return `<tr class="clickable" data-kh="${k.id}"><td class="stt">${i + 1}</td><td class="cell-main"><div class="person"><span class="avatar" style="background:var(--navy);border-radius:10px">${esc(initials(k.ten_cong_ty.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, '')))}</span><div><div class="nm">${esc(k.ten_cong_ty)}</div><div class="sb">${Code.kh(k.id)} · ${esc(k.dia_chi || '')}</div></div></div></td>
        <td data-label="Lĩnh vực">${esc(Store.name('linh_vuc', k.ma_linh_vuc))}</td><td data-label="Liên hệ">${esc(k.nguoi_lien_he)}<div class="t-sub">${esc(k.email)} · ${esc(k.so_dien_thoai)}</div></td>
        <td data-label="Dự án" class="num">${das.length}</td><td data-label="Vị trí mở" class="num">${open}</td><td data-label="Trạng thái">${badge(k.trang_thai_hop_tac)}</td></tr>`; }).join('') || `<tr><td colspan="7">${emptyState('Không có khách hàng')}</td></tr>`}</tbody></table></div></div>`;
    $('#add') && ($('#add').onclick = () => Dlg.customer());
    $('#q').oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#q').focus(); $('#q').setSelectionRange(f.q.length, f.q.length); }, 300);
    $('#lv').onchange = (e) => { f.lv = e.target.value; UI.refresh(); }; $('#tt').onchange = (e) => { f.tt = e.target.value; UI.refresh(); };
    $$('[data-kh]', v).forEach((tr) => (tr.onclick = () => Router.go('#/khach-hang/' + tr.dataset.kh)));
  },
};
Pages.customerDetail = {
  render(v, { id }) {
    const k = Q.kh(id); if (!k) return (v.innerHTML = emptyState('Không tìm thấy khách hàng'));
    const das = DB.du_an_tuyen_dung.filter((d) => d.ma_khach_hang === k.id);
    v.innerHTML = `<div class="crumbs"><a href="#/khach-hang">Danh sách khách hàng</a>${icon('chevronRight', 'sm')}<b>${esc(k.ten_cong_ty)}</b></div>
      <div class="page-head"><div><h1>${esc(k.ten_cong_ty)} ${badge(k.trang_thai_hop_tac)}</h1><p class="sub">${Code.kh(k.id)} · ${esc(Store.name('linh_vuc', k.ma_linh_vuc))}</p></div><div class="actions">${Auth.canOperate() ? `<button class="btn" id="ed">${icon('edit', 'sm')} Cập nhật</button>` : ''}${Auth.canOperate() && k.trang_thai_hop_tac === 'Đang hợp tác' ? `<button class="btn primary" id="nda">${icon('plus', 'sm')} Tạo dự án tuyển dụng</button>` : ''}</div></div>
      <div class="grid g-side"><div class="card card-pad"><dl class="kv" style="grid-template-columns:110px 1fr"><dt>Người liên hệ</dt><dd>${esc(k.nguoi_lien_he)}</dd><dt>Email</dt><dd>${esc(k.email)}</dd><dt>Điện thoại</dt><dd>${esc(k.so_dien_thoai)}</dd><dt>Địa chỉ</dt><dd>${esc(k.dia_chi || '—')}</dd><dt>Ngày tạo</dt><dd>${fmtDate(k.ngay_tao)}</dd></dl></div>
      <div class="card"><div class="card-head"><h3>Lịch sử dự án tuyển dụng</h3></div><div class="card-body">${das.map((d) => { const cts = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === d.id); return `<div class="card card-pad mb" style="box-shadow:none"><div class="row between"><div><div class="strong">${esc(d.ten_du_an)}</div><div class="muted small">${Code.da(d.id)} · bắt đầu ${fmtDate(d.ngay_bat_dau)}</div></div><div class="row">${badge(d.trang_thai)}<b>${d.tien_do}%</b></div></div>
        ${cts.map((c) => `<a class="row between small" href="#/du-an/${c.id}" style="padding:8px 0;border-top:1px solid var(--border);color:inherit;text-decoration:none"><span>${esc(c.vi_tri)} <span class="code">${Code.ct(c.id)}</span></span><span class="row">${Q.hired(c.id)}/${c.so_luong} ${badge(c.trang_thai, 'sm')}</span></a>`).join('')}</div>`; }).join('') || emptyState('Chưa có dự án tuyển dụng')}</div></div></div>`;
    $('#ed') && ($('#ed').onclick = () => Dlg.customer(k.id));
    $('#nda') && ($('#nda').onclick = () => { Dlg.project(null); setTimeout(() => { const s = $('.overlay [name=ma_khach_hang]'); if (s) s.value = k.id; }, 30); });
  },
};

/* ============ NHÂN SỰ (Quản lý / BGĐ xem khối lượng công việc) ============ */
Pages.staff = {
  render(v) {
    const ns = DB.nhan_su.filter((n) => n.vai_tro !== ROLES.ADMIN);
    v.innerHTML = `<div class="page-head"><div><h1>Nhân sự tư vấn tuyển dụng</h1><p>Khối lượng công việc & khu vực công tác — hỗ trợ điều phối phân công (nhân sự cần ở cùng khu vực để đi phỏng vấn trực tiếp cùng khách hàng).</p></div>${Auth.isAdmin() ? '' : ''}</div>
      <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th><th>Nhân sự</th><th>Vai trò</th><th>Khu vực</th><th class="num">Vị trí đang phụ trách</th><th class="num">Đề cử (30 ngày)</th><th class="num">PV sắp tới</th><th>Trạng thái</th></tr></thead><tbody>
      ${ns.map((n, i) => { const load = DB.phan_cong.filter((p) => p.ma_nhan_su === n.id && p.trang_thai === 'Đang phụ trách' && !CT_CLOSED.includes(Q.ct(p.ma_chi_tiet_du_an).trang_thai)).length;
        return `<tr><td class="stt">${i + 1}</td><td class="cell-main"><div class="person">${avatar(n.ho_ten)}<div><div class="nm">${esc(n.ho_ten)}</div><div class="sb">${esc(n.chuc_vu)} · ${esc(n.email)}</div></div></div></td><td data-label="Vai trò">${esc(n.vai_tro)}</td><td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td>
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
    const reqs = (DB.yeu_cau_mat_khau || []).filter((y) => y.trang_thai === 'Chờ xử lý').sort((a, b) => b.ngay_gui.localeCompare(a.ngay_gui));
    v.innerHTML = `<div class="page-head"><div><h1>Tài khoản & phân quyền</h1><p>Mỗi tài khoản gắn với một vai trò; quyền truy cập chức năng xác định theo vai trò.</p></div><div class="actions"><button class="btn primary" id="add">${icon('plus', 'sm')} Thêm tài khoản</button></div></div>
      ${reqs.length ? `<div class="card mb" style="border-color:var(--amber)"><div class="card-head"><div><h3>${icon('lock', 'sm')} Yêu cầu cấp lại mật khẩu <span class="badge amber sm">${reqs.length}</span></h3><p>Người dùng bấm “Quên mật khẩu” ở trang đăng nhập. Đặt lại rồi gửi mật khẩu mới cho họ qua kênh liên hệ.</p></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Tài khoản</th><th>Liên hệ lại</th><th>Ghi chú</th><th>Gửi lúc</th><th></th></tr></thead><tbody>
        ${reqs.map((y) => { const n = y.ma_nhan_su ? Q.ns(y.ma_nhan_su) : null; return `<tr><td>${n ? `<div class="person">${avatar(n.ho_ten, 'sm')}<div><div class="nm small">${esc(n.ho_ten)}</div><div class="sb"><span class="code">${esc(n.ten_dang_nhap)}</span> · ${esc(n.vai_tro)}${n.trang_thai_lam_viec !== 'Đang làm việc' ? ' · <span style="color:var(--red)">Đã nghỉ việc</span>' : ''}</div></div></div>` : `<span class="code">${esc(y.ten_dang_nhap)}</span> <span class="badge sm red">Không có tài khoản này</span>`}</td>
          <td class="small">${esc(y.lien_he || '—')}${n ? `<div class="t-sub">${esc(n.email)}${n.so_dien_thoai ? ' · ' + esc(n.so_dien_thoai) : ''}</div>` : ''}</td><td class="small">${esc(y.ghi_chu || '—')}</td><td class="small nowrap">${fmtDT(y.ngay_gui)}</td>
          <td><div class="row" style="gap:4px;justify-content:flex-end">${n && n.trang_thai_lam_viec === 'Đang làm việc' ? `${act('lock', 'Đặt lại mật khẩu', `data-rq-pw="${n.id}"`, 'primary', 'Sinh mật khẩu mới cho người gửi yêu cầu')}` : ''}${act('x', 'Đóng yêu cầu', `data-rq-close="${y.id}"`, '', 'Không cấp lại mật khẩu cho yêu cầu này')}</div></td></tr>`; }).join('')}</tbody></table></div></div>` : ''}
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo họ tên, tên đăng nhập, email…" value="${esc(f.q)}"></div>
        <select class="select" id="role" style="width:auto">${[['', 'Mọi vai trò'], ...Object.values(ROLES).map((r) => [r, r])].map(([a, b]) => `<option value="${a}" ${f.role === a ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <select class="select" id="kv" style="width:auto">${Form.opts('khu_vuc', { blank: 'Mọi khu vực' }).map(([a, b]) => `<option value="${a}" ${String(f.kv) === String(a) ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th><th>Nhân sự</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Khu vực</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${rows.map((n, i) => `<tr><td class="stt">${i + 1}</td><td class="cell-main"><div class="person">${avatar(n.ho_ten, 'sm')}<div><div class="nm">${esc(n.ho_ten)}</div><div class="sb">${esc(n.email)} · ${esc(n.chuc_vu)}</div></div></div></td><td data-label="Tên đăng nhập"><span class="code">${esc(n.ten_dang_nhap)}</span></td>
        <td data-label="Vai trò"><select class="select" data-role="${n.id}" style="height:32px;width:auto" ${n.id === Auth.user.id ? 'disabled' : ''}>${Object.values(ROLES).map((r) => `<option ${n.vai_tro === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
        <td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td><td data-label="Trạng thái">${badge(n.trang_thai_lam_viec)}</td>
        <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end">${act('edit', 'Sửa tài khoản', `data-ed="${n.id}"`, '', 'Cập nhật thông tin, khu vực, trạng thái')}${act('lock', 'Đặt lại mật khẩu', `data-pw="${n.id}"`, '', 'Sinh mật khẩu mới, chỉ hiện một lần')}${n.trang_thai_lam_viec === 'Đang làm việc' && n.id !== Auth.user.id ? `${act('userX', 'Chuyển nghỉ việc', `data-off="${n.id}"`, 'danger', 'Tài khoản không đăng nhập được nữa; dữ liệu vẫn được giữ')}` : ''}</div></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card card-pad mt"><h3 style="font-size:15px" class="mb">Ma trận phân quyền theo vai trò</h3><div class="table-wrap"><table class="table"><thead><tr><th>Chức năng</th>${Object.values(ROLES).map((r) => `<th style="text-align:center">${r}</th>`).join('')}</tr></thead><tbody>
      ${[['Đăng nhập, hồ sơ cá nhân, đổi mật khẩu', 1, 1, 1, 1], ['Tài khoản, phân quyền, đặt lại mật khẩu, danh mục', 1, 0, 0, 0], ['Khách hàng', 0, 'Xem', 'Xem', 1], ['Xem dự án', 0, 'Tất cả', 'Tất cả', 'Tự tạo / được phân công'], ['Tạo dự án, tiếp nhận yêu cầu', 0, 0, 0, 1], ['Sửa, gắn mã tin, đóng / hủy dự án', 0, 0, 0, 'Dự án do mình tạo'], ['Phân công nhân viên phụ trách', 0, 0, 1, 0], ['Hồ sơ ứng viên (chuẩn hóa, gắn thẻ, lưu trữ)', 0, 'Xem', 'Xem', 1], ['Lọc ứng viên, tạo / gỡ đề cử', 0, 'Xem', 'Xem', 1], ['Duyệt / yêu cầu chỉnh sửa đề cử', 0, 0, 1, 0], ['Góp ý đề cử đã xử lý', 0, 'Xem & góp ý', 'Nhận góp ý', 0], ['Gửi đề cử cho KH, ghi nhận phản hồi', 0, 'Xem', 'Xem', 1], ['Lịch phỏng vấn, chọn / đổi NV phỏng vấn', 0, 'Xem', 'Xem', 1], ['Kết quả phỏng vấn, feedback, kết quả tuyển dụng', 0, 'Xem', 'Xem', 1], ['Báo cáo - thống kê, xuất Excel / PDF', 0, 1, 1, 0]]
        .map(([fn, ...c]) => `<tr><td>${fn}</td>${c.map((x) => `<td style="text-align:center">${x === 1 ? `<span style="color:var(--green)">${icon('check', 'sm')}</span>` : x === 0 ? '<span class="muted">—</span>' : `<span class="small">${x}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    $('#add').onclick = () => Dlg.account();
    $('#q').oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#q').focus(); $('#q').setSelectionRange(f.q.length, f.q.length); }, 300);
    $('#role').onchange = (e) => { f.role = e.target.value; UI.refresh(); }; $('#kv').onchange = (e) => { f.kv = e.target.value; UI.refresh(); };
    $$('[data-ed]', v).forEach((b) => (b.onclick = () => Dlg.account(Number(b.dataset.ed))));
    const resetPw = (id) => confirmBox({ title: 'Đặt lại mật khẩu', message: `Hệ thống sinh mật khẩu mới cho <b>${esc(Q.ns(id).ho_ten)}</b>, mã hóa và lưu. Mật khẩu cũ không dùng được nữa.`, okText: 'Đặt lại', onOk: () => { const n = Q.ns(id); const r = Svc.resetPassword(n.id); if (!r.ok) return toast(r.error, 'err'); UI.refresh(); Dlg.showPassword(n, r.password); } });
    $$('[data-pw]', v).forEach((b) => (b.onclick = () => resetPw(Number(b.dataset.pw))));
    $$('[data-rq-pw]', v).forEach((b) => (b.onclick = () => resetPw(Number(b.dataset.rqPw))));
    $$('[data-rq-close]', v).forEach((b) => (b.onclick = () => after(Svc.closePasswordRequest(Number(b.dataset.rqClose)), 'Đã đóng yêu cầu')));
    $$('[data-off]', v).forEach((b) => (b.onclick = () => confirmBox({ title: 'Chuyển trạng thái “Đã nghỉ việc”', danger: true, okText: 'Xác nhận', message: 'Tài khoản đã phát sinh dữ liệu không bị xóa. Tài khoản sẽ không đăng nhập được; các phân công đang phụ trách chuyển “Đã chuyển”.', onOk: () => after(Svc.deactivateAccount(Number(b.dataset.off)), 'Đã cập nhật trạng thái') })));
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
      ${DB.kenh_dang_tuyen.map((k) => `<tr><td class="cell-main"><b>${esc(k.ten_kenh)}</b><div class="t-sub">${esc(k.mo_ta)}</div></td><td data-label="Tên miền">${esc(k.ten_mien || '—')}</td><td data-label="Tiền tố"><span class="code">${esc(k.tien_to)}</span></td><td data-label="Trạng thái">${badge(k.trang_thai)}</td><td data-label="">${act(k.trang_thai === 'Hoạt động' ? 'x' : 'check', k.trang_thai === 'Hoạt động' ? 'Ngừng kênh' : 'Kích hoạt kênh', `data-tg="${k.id}"`, k.trang_thai === 'Hoạt động' ? 'danger' : 'success', 'Bật / tắt thu thập hồ sơ từ kênh này')}</td></tr>`).join('')}</tbody></table></div></div></div>`;
    $$('[data-add]', v).forEach((b) => (b.onclick = () => confirmBox({ title: 'Thêm danh mục', okText: 'Thêm', message: '', input: { label: 'Tên', required: true }, onOk: (ten) => { const r = Svc.addCatalog(b.dataset.add, ten); if (!r.ok) { toast(r.error, 'err'); return false; } toast('Đã thêm'); UI.refresh(); } })));
    $$('[data-tg]', v).forEach((b) => (b.onclick = () => after(Svc.toggleChannel(Number(b.dataset.tg)), 'Đã cập nhật kênh')));
  },
};

/* ============ BÁO CÁO - THỐNG KÊ (UC_12 — trình bày theo mẫu báo cáo chính thức, Fix Demo lần 1) ============ */
Pages.reports = {
  type: 'tien-do', f: { from: '', to: '', kh: '', vt: '', ns: '' },
  TYPES: [['tien-do', 'Tiến độ dự án', 'briefcase', 'TDDA'], ['tre-han', 'Dự án trễ hạn', 'clock', 'DATH'], ['khach-hang', 'Dự án theo khách hàng', 'building', 'DAKH'], ['ket-qua', 'Kết quả tuyển dụng', 'checkCircle', 'KQTD'], ['chuyen-doi', 'Tỷ lệ chuyển đổi hồ sơ', 'layers', 'TLCD'], ['hieu-suat', 'Hiệu suất đề cử nhân viên', 'users', 'HSDC']],
  render(v) {
    const f = this.f; const t = this.TYPES.find((x) => x[0] === this.type);
    v.innerHTML = `<div class="page-head no-print"><div><h1>Báo cáo - Thống kê</h1></div>
      <div class="actions"><button class="btn" id="xls">${icon('download', 'sm')} Xuất Excel</button><button class="btn primary" id="pdf">${icon('printer', 'sm')} Xuất PDF</button></div></div>
      <div class="chip-group mb no-print">${this.TYPES.map(([k, l, ic]) => `<button class="chip ${this.type === k ? 'active' : ''}" data-type="${k}" style="height:36px;display:inline-flex;align-items:center;gap:6px">${icon(ic, 'sm')} ${l}</button>`).join('')}</div>
      <div class="card no-print mb"><form class="filter-panel" style="padding:14px;grid-template-columns:repeat(5,minmax(0,1fr))" id="rf" onsubmit="return false">
        ${Form.field('Từ ngày', 'from', { type: 'date', value: f.from })}${Form.field('Đến ngày', 'to', { type: 'date', value: f.to })}
        ${Form.field('Khách hàng', 'kh', { opts: Form.opts('khach_hang', { blank: 'Tất cả' }), value: f.kh })}${Form.field('Vị trí', 'vt', { value: f.vt, ph: 'Từ khóa vị trí' })}
        ${Form.field('Nhân viên', 'ns', { opts: [['', 'Tất cả'], ...DB.nhan_su.filter((n) => n.vai_tro === ROLES.NV).map((n) => [n.id, n.ho_ten])], value: f.ns })}</form>
        <div class="rp-hint">${icon('info', 'sm')}<span>${this.HINT[this.type]}</span></div></div>
      <div id="rbody"></div>`;
    if (innerWidth <= 720) $('#rf').style.gridTemplateColumns = '1fr 1fr';
    $$('[data-type]', v).forEach((b) => (b.onclick = () => { this.type = b.dataset.type; UI.refresh(); }));
    $$('#rf [name]').forEach((el) => (el.onchange = () => { Object.assign(f, Form.values($('#rf'))); this.body(); }));
    $('#pdf').onclick = () => { if (!this._export) return toast('Không có dữ liệu để xuất', 'warn'); Export.pdf(); };
    $('#xls').onclick = () => { const x = this._export; if (!x || !x.rows.length) return toast('Không có dữ liệu để xuất', 'warn'); Export.excel(`${this.code()}`, t[1], x.headers, x.rows); };
    this.body();
  },
  /** Cách áp dụng "Từ ngày – Đến ngày" cho từng loại báo cáo */
  HINT: {
    'tien-do': 'Kỳ báo cáo lấy các vị trí có thời gian tuyển dụng (ngày tiếp nhận → hạn hoàn thành) nằm trong kỳ. Nhận việc và tiến độ tính lũy kế đến ngày cuối kỳ; đề cử, phỏng vấn tính số phát sinh trong kỳ.',
    'tre-han': 'Tính đến ngày cuối kỳ (không vượt quá hôm nay): vị trí đã qua hạn hoàn thành mà chưa tuyển đủ chỉ tiêu, không gồm vị trí Đã đóng / Đã hủy.',
    'khach-hang': 'Kỳ báo cáo lấy các vị trí có thời gian tuyển dụng (ngày tiếp nhận → hạn hoàn thành) nằm trong kỳ, gom theo khách hàng.',
    'ket-qua': 'Kỳ báo cáo tính theo ngày khách hàng báo kết quả tuyển dụng.',
    'chuyen-doi': 'Kỳ báo cáo tính theo ngày hồ sơ apply; mỗi hồ sơ được đếm ở mọi trạng thái từng đạt tới.',
    'hieu-suat': 'Kỳ báo cáo tính đề cử theo ngày tạo và phỏng vấn theo ngày diễn ra.',
  },
  code() { const t = this.TYPES.find((x) => x[0] === this.type); return `BC-${t[3]}-${todayStr().replace(/-/g, '')}-01`; },
  /** Khung báo cáo theo mẫu: tiêu đề công ty, mã báo cáo, kỳ, đơn vị / phạm vi / người lập / đối tượng,
      I. Tổng quan (ô KPI), II. Bảng chi tiết có STT + Tổng cộng, Ghi chú, chữ ký. */
  doc({ kpis, secTitle, headers, rows, total, notes, doiTuong, count }) {
    const f = this.f; const t = this.TYPES.find((x) => x[0] === this.type); const u = Auth.user; const d = new Date(now());
    const ky = f.from || f.to ? `từ ${f.from ? fmtDate(f.from) : 'đầu kỳ'} đến ${fmtDate(f.to || d)}` : `toàn bộ thời gian, tính đến ${fmtDate(d)}`;
    const scope = [f.kh && Q.kh(f.kh)?.ten_cong_ty, f.vt && `vị trí chứa “${f.vt}”`, f.ns && `nhân viên ${Q.ns(f.ns)?.ho_ten}`].filter(Boolean);
    const np = (i) => (/no-print/.test(headers[i]) ? ' no-print' : '');
    const cell = (c, i) => `<td class="${/^[\d.,%–\s]*$/.test(String(c)) || /^<button/.test(String(c)) ? 'c' : ''}${np(i)}">${c}</td>`;
    const place = /hồ chí minh|hcm/i.test(Store.name('khu_vuc', u.ma_khu_vuc)) ? 'TP. Hồ Chí Minh' : 'Hà Nội';
    const numCls = (c) => (/^[\d.,%–\s]*$/.test(String(c)) ? 'num' : '');
    const cellsOf = (r) => r.cells || r; const first = rows.length ? cellsOf(rows[0]) : [];
    const sCell = (c, j) => `<td class="${numCls(c)}">${headers[j] === 'Trạng thái' && c ? badge(c) : headers[j] === 'Tiến độ' && /%$/.test(c) ? `<div class="mini-prog"><span><i style="width:${Math.min(100, parseFloat(c) || 0)}%"></i></span>${c}</div>` : c}</td>`;
    const sRow = (r, i) => !r.cells ? `<tr><td class="stt">${i + 1}</td>${r.map(sCell).join('')}</tr>`
      : `<tr class="grp" data-grp="${i}"><td class="stt"><span class="chev">${icon('chevronRight', 'sm')}</span>${i + 1}</td>${r.cells.map(sCell).join('')}</tr>
        <tr class="kid kid-${i} kid-head" hidden><td></td><td colspan="${headers.length}">${r.childTitle}</td></tr>${r.children.map((c) => `<tr class="kid kid-${i}" hidden><td></td>${c.map(sCell).join('')}</tr>`).join('')}`;
    const screen = `<div class="no-print">
      <div class="grid ${kpis.length === 5 ? 'g-5' : 'g-4'} kpis mb">${kpis.map(([l, n]) => `<div class="card kpi"><div><div class="label">${l}</div><div class="value">${n}</div></div></div>`).join('')}</div>
      <div class="card"><div class="card-head"><div><h3>${secTitle}</h3><p>Kỳ báo cáo: ${ky} · ${count || rows.length + ' dòng'}${scope.length ? ' · ' + esc(scope.join('; ')) : ''}</p></div>${rows.some((r) => r.cells) ? '<button class="btn sm" id="grpAll">Mở / thu gọn tất cả</button>' : ''}</div>
        <div class="table-wrap"><table class="table rp-screen"><thead><tr><th class="stt">STT</th>${headers.map((h, i) => `<th class="${rows.length && numCls(first[i]) ? 'num' : ''}">${h}</th>`).join('')}</tr></thead><tbody>
          ${rows.map(sRow).join('')}
          ${total ? `<tr class="total"><td></td><td>Tổng cộng</td>${total.map((c) => `<td class="${numCls(c)}">${c}</td>`).join('')}</tr>` : ''}</tbody></table></div></div></div>`;
    // Bản in: khung bảng có thead/tfoot trống để lặp lề trên/dưới ở mọi trang (in với @page margin 0 → trình duyệt không chèn ngày giờ, URL, số trang)
    return screen + `<table class="rp-frame print-only"><thead><tr><td><div class="rp-gap"></div></td></tr></thead><tfoot><tr><td><div class="rp-gap"></div></td></tr></tfoot><tbody><tr><td><div class="rp-doc">
      <div class="rp-top"><div class="rp-brand"><img class="rp-logo" src="assets/logo.png" alt="Navigos Group"><div><div class="rp-co">CÔNG TY CỔ PHẦN NAVIGOS GROUP VIỆT NAM</div><div class="muted small">Hệ thống quản lý dự án tuyển dụng Talent Suite</div></div></div>
        <div class="rp-code"><div>Mã báo cáo: <b>${this.code()}</b></div><div>Xuất lúc: <b>${fmtTime(d)}, ${fmtDate(d)}</b></div></div></div>
      <h2 class="rp-title">BÁO CÁO ${t[1].toUpperCase()}</h2><div class="rp-period">Kỳ báo cáo: ${ky}</div>
      <dl class="rp-meta"><dt>Đơn vị</dt><dd>Navigos Group Việt Nam</dd><dt>Người lập báo cáo</dt><dd>${esc(u.ho_ten)} (${esc(u.vai_tro)})</dd>
        <dt>Phạm vi dữ liệu</dt><dd>${scope.length ? esc(scope.join('; ')) : 'Toàn bộ dự án của công ty'}</dd><dt>Đối tượng</dt><dd>${esc(doiTuong)}</dd></dl>
      <div class="rp-sec">I. Tổng quan trong kỳ</div>
      <div class="rp-kpis${kpis.length === 5 ? ' n5' : ''}">${kpis.map(([l, n]) => `<div><div class="l">${l}</div><div class="v">${n}</div></div>`).join('')}</div>
      <div class="rp-sec">II. ${secTitle}</div>
      <div class="table-wrap"><table class="rp-table${headers.length > 9 ? ' wide' : ''}"><thead><tr><th style="width:48px">STT</th>${headers.map((h, i) => `<th class="${np(i)}">${h}</th>`).join('')}</tr></thead><tbody>
        ${rows.map((r, i) => !r.cells ? `<tr><td class="c">${i + 1}</td>${r.map(cell).join('')}</tr>`
          : `<tr class="grp"><td class="c">${i + 1}</td>${r.cells.map(cell).join('')}</tr><tr class="kid-head"><td></td><td colspan="${headers.length}">${r.childTitle}</td></tr>${r.children.map((c) => `<tr class="kid"><td></td>${c.map(cell).join('')}</tr>`).join('')}`).join('')}
        ${total ? `<tr class="total"><td colspan="2" class="c">Tổng cộng</td>${total.map((c, i) => cell(c, i + 1)).join('')}</tr>` : ''}</tbody></table></div>
      ${notes.length ? `<div class="rp-notes"><b>Ghi chú</b><ul>${notes.map((n) => `<li>${n}</li>`).join('')}</ul></div>` : ''}
      <div class="rp-end"><div class="rp-date">${place}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}</div>
      <div class="rp-sign"><div><b>NGƯỜI LẬP BÁO CÁO</b><i>(Ký, ghi rõ họ tên)</i><div class="nm">${esc(u.ho_ten)}</div></div>
        <div><b>NGƯỜI PHÊ DUYỆT</b><i>(Ký, ghi rõ họ tên, đóng dấu)</i></div></div></div></div></td></tr></tbody></table>`;
  },
  body() {
    this.render2();
    const b = $('#rbody');
    const open = (i, on) => { const tr = $(`[data-grp="${i}"]`, b); tr.classList.toggle('open', on); $$(`.kid-${i}`, b).forEach((x) => (x.hidden = !on)); };
    $$('[data-grp]', b).forEach((tr) => (tr.onclick = () => open(tr.dataset.grp, !tr.classList.contains('open'))));
    $('#grpAll', b) && ($('#grpAll', b).onclick = () => { const all = $$('[data-grp]', b); const on = !all.every((t) => t.classList.contains('open')); all.forEach((t) => open(t.dataset.grp, on)); });
  },
  render2() {
    const f = this.f; const b = $('#rbody');
    const pct = (a, c) => (c ? Math.round((a / c) * 100) : 0);
    const pc1 = (a, c) => (c ? ((a / c) * 100).toFixed(1).replace('.', ',') + '%' : '–');
    const none = () => { b.innerHTML = `<div class="card">${emptyState('Không có dữ liệu trong bộ lọc đã chọn — hãy chọn lại bộ lọc.', 'search')}</div>`; this._export = null; };
    const chart = (title, html) => `<div class="card mt no-print"><div class="card-head"><h3>${title}</h3></div><div class="card-body">${html}</div></div>`;
    const short = (s) => s.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, '');
    if (this.type === 'tien-do' || this.type === 'tre-han') {
      const late = this.type === 'tre-han'; const rows = late ? Reports.overdue(f) : Reports.progress(f); if (!rows.length) return none();
      const das = Reports.byProject(rows); const can = sum(das.map((g) => g.can)); const nhan = sum(das.map((g) => g.nhan));
      const hanCell = (d, dl) => `${fmtDate(d)}${dl ? `<div class="t-sub" style="color:var(--${dl.level === 'red' ? 'red' : 'amber'})">${dl.text}</div>` : ''}`;
      const ctCells = (r) => [`${esc(r.ct.vi_tri)}<div class="t-sub">${Code.ct(r.ct.id)}</div>`, '', esc(r.staff || '—'), hanCell(r.ct.han_hoan_thanh, r.dl), '—', r.ct.so_luong, r.hired, r.pct + '%', ...(late ? [r.lateDays] : [r.decu, r.pv]), esc(r.status)];
      b.innerHTML = this.doc({ doiTuong: `${das.length} dự án tuyển dụng · ${rows.length} vị trí`, count: `${das.length} dự án · ${rows.length} vị trí`, secTitle: late ? 'Dự án có vị trí trễ hạn' : 'Số liệu theo dự án',
        kpis: late ? [['Số dự án', das.length], ['Vị trí trễ hạn', rows.length], ['Cần tuyển', can], ['Đã nhận việc', nhan], ['Số ngày trễ trung bình', Math.round(sum(rows.map((r) => r.lateDays)) / rows.length)]]
          : [['Số dự án', das.length], ['Số vị trí', rows.length], ['Cần tuyển', can], ['Đã nhận việc', nhan], ['Tỷ lệ hoàn thành chỉ tiêu', pc1(nhan, can)]],
        headers: ['Dự án (ID)', 'Khách hàng', 'Phụ trách', 'Hạn hoàn thành', late ? 'Vị trí trễ' : 'Vị trí', 'Cần tuyển', 'Nhận việc', 'Tiến độ', ...(late ? ['Số ngày trễ'] : ['Đề cử', 'Phỏng vấn']), 'Trạng thái'],
        rows: das.map((g) => ({ childTitle: `Chi tiết theo vị trí của dự án ${Code.da(g.da.id)}`, children: g.list.map(ctCells),
          cells: [`<b>${esc(g.da.ten_du_an)}</b><div class="t-sub">${Code.da(g.da.id)}</div>`, esc(short(g.kh.ten_cong_ty)), esc(g.staff || '—'), fmtDate(g.han), g.list.length, g.can, g.nhan, g.pct + '%', ...(late ? [g.lateDays] : [g.decu, g.pv]), esc(g.status)] })),
        total: ['', '', '', rows.length, can, nhan, pc1(nhan, can), ...(late ? [''] : [sum(das.map((g) => g.decu)), sum(das.map((g) => g.pv))]), ''],
        notes: late ? ['Vị trí trễ hạn: đã qua hạn hoàn thành tính đến cuối kỳ mà chưa tuyển đủ chỉ tiêu, không gồm vị trí Đã đóng / Đã hủy.'] : ['Tiến độ = số ứng viên nhận việc / số lượng cần tuyển, tính lũy kế đến cuối kỳ.'] })
        + (late ? '' : chart('Tiến độ các dự án', das.map((g) => `<div style="margin-bottom:10px"><div class="prog-meta"><span class="strong" style="font-size:12px">${esc(g.da.ten_du_an)} <span class="muted">· ${g.list.length} vị trí</span></span><span>${g.nhan}/${g.can}</span></div>${progressBar(g.pct, g.list.some((r) => r.dl?.level === 'red') ? 'red' : g.list.some((r) => r.dl) ? 'amber' : '')}</div>`).join('')));
      const H = ['STT', 'Cấp', 'ID', 'Dự án / Vị trí', 'Khách hàng', 'Phụ trách', 'Hạn hoàn thành', 'Số vị trí', 'Cần tuyển', 'Đã nhận việc', 'Tiến độ %', ...(late ? ['Số ngày trễ'] : ['Số đề cử', 'Số phỏng vấn']), 'Trạng thái'];
      this._export = { headers: H, rows: das.flatMap((g, i) => [[i + 1, 'Dự án', Code.da(g.da.id), g.da.ten_du_an, g.kh.ten_cong_ty, g.staff, fmtDate(g.han), g.list.length, g.can, g.nhan, g.pct, ...(late ? [g.lateDays] : [g.decu, g.pv]), g.status],
        ...g.list.map((r) => ['', 'Vị trí', Code.ct(r.ct.id), r.ct.vi_tri, r.kh.ten_cong_ty, r.staff, fmtDate(r.ct.han_hoan_thanh), '', r.ct.so_luong, r.hired, r.pct, ...(late ? [r.lateDays] : [r.decu, r.pv]), r.status])]) };
    } else if (this.type === 'khach-hang') {
      const rows = Reports.byCustomer(f); if (!rows.length) return none();
      const S = (k) => sum(rows.map((r) => r[k]));
      b.innerHTML = this.doc({ doiTuong: `${rows.length} khách hàng`, secTitle: 'Số liệu chi tiết theo khách hàng',
        kpis: [['Khách hàng', rows.length], ['Dự án tuyển dụng', S('duan')], ['Vị trí', S('vitri')], ['Tỷ lệ nhận việc / cần tuyển', pc1(S('nhan'), S('can'))]],
        headers: ['Khách hàng', 'Dự án TD', 'Vị trí', 'Đang mở', 'Hoàn thành', 'Trễ hạn', 'Cần tuyển', 'Nhận việc', 'Tỷ lệ'],
        rows: rows.map((r) => [esc(r.kh.ten_cong_ty), r.duan, r.vitri, r.dang, r.xong, r.tre, r.can, r.nhan, pc1(r.nhan, r.can)]),
        total: [S('duan'), S('vitri'), S('dang'), S('xong'), S('tre'), S('can'), S('nhan'), pc1(S('nhan'), S('can'))], notes: ['Tỷ lệ = số ứng viên nhận việc / tổng số lượng cần tuyển của các vị trí thuộc khách hàng.'] })
        + chart('Số vị trí theo khách hàng', Charts.bars({ data: rows.map((r) => ({ label: short(r.kh.ten_cong_ty), value: r.vitri })), h: 200 }));
      this._export = { headers: ['STT', 'Khách hàng', 'Số dự án tuyển dụng', 'Số vị trí', 'Đang mở', 'Hoàn thành', 'Trễ hạn', 'Cần tuyển', 'Đã nhận việc', 'Tỷ lệ %'], rows: rows.map((r, i) => [i + 1, r.kh.ten_cong_ty, r.duan, r.vitri, r.dang, r.xong, r.tre, r.can, r.nhan, pct(r.nhan, r.can)]) };
    } else if (this.type === 'ket-qua') {
      const rows = Reports.hiring(f); if (!rows.length) return none();
      const acc = rows.filter((r) => r.k.ket_qua === 'Chấp nhận offer');
      b.innerHTML = this.doc({ doiTuong: `${rows.length} kết quả tuyển dụng`, secTitle: 'Danh sách kết quả tuyển dụng',
        kpis: [['Kết quả ghi nhận', rows.length], ['Chấp nhận offer', acc.length], ['Từ chối offer', rows.length - acc.length], ['Tỷ lệ nhận offer', pc1(acc.length, rows.length)]],
        headers: ['Ứng viên', 'Vị trí', 'Khách hàng', 'Kết quả', 'Ngày nhận việc / Lý do', 'Ngày KH báo', 'Hồ sơ hiện tại'],
        rows: rows.map((r) => [esc(r.uv.ho_ten), esc(r.ct.vi_tri), esc(short(r.kh.ten_cong_ty)), esc(r.k.ket_qua), r.k.ngay_nhan_viec ? fmtDate(r.k.ngay_nhan_viec) : esc(r.k.ly_do_tu_choi || ''), fmtDate(r.k.ngay_khach_hang_bao), esc(r.hs.trang_thai)]),
        total: ['', '', `${acc.length} nhận / ${rows.length - acc.length} từ chối`, '', '', ''], notes: ['Kết quả do khách hàng thông báo sau khi gửi offer qua email; hệ thống ghi nhận đến khi ứng viên bắt đầu thử việc.'] });
      this._export = { headers: ['STT', 'Ứng viên', 'Vị trí', 'Khách hàng', 'Kết quả', 'Ngày nhận việc', 'Lý do từ chối', 'Ngày KH báo', 'Trạng thái hồ sơ'], rows: rows.map((r, i) => [i + 1, r.uv.ho_ten, r.ct.vi_tri, r.kh.ten_cong_ty, r.k.ket_qua, fmtDate(r.k.ngay_nhan_viec), r.k.ly_do_tu_choi || '', fmtDate(r.k.ngay_khach_hang_bao), r.hs.trang_thai]) };
    } else if (this.type === 'chuyen-doi') {
      const steps = Reports.conversion(f); if (!steps[0].value) return none();
      const rows = Reports.scopeCts(f).map((ct) => ({ ct, s: Reports.conversion({ ...f, ctId: ct.id }) })).filter((x) => x.s[0].value);
      const T = (i) => sum(rows.map((x) => x.s[i].value));
      b.innerHTML = this.doc({ doiTuong: `${rows.length} vị trí có hồ sơ`, secTitle: 'Số liệu chi tiết theo vị trí',
        kpis: steps.slice(1).map((s, i) => [`${steps[i].label} → ${s.label}`, pc1(s.value, steps[i].value)]).concat([['Apply → Thử việc (tổng thể)', pc1(steps[3].value, steps[0].value)]]),
        headers: ['Vị trí', 'Mới apply', 'Đề cử', 'Phỏng vấn', 'Thử việc', 'Apply → Thử việc'],
        rows: rows.map(({ ct, s }) => [`${esc(ct.vi_tri)}<div class="t-sub">${Code.ct(ct.id)}</div>`, s[0].value, s[1].value, s[2].value, s[3].value, pc1(s[3].value, s[0].value)]),
        total: [T(0), T(1), T(2), T(3), pc1(T(3), T(0))], notes: ['Tỷ lệ = số hồ sơ đạt tới trạng thái sau / số hồ sơ ở trạng thái trước × 100.', 'Đếm theo các mốc trong Lịch sử trạng thái — hồ sơ được tính ở mọi trạng thái từng đạt tới, kể cả sau đó bị loại.'] })
        + chart('Phễu chuyển đổi theo trạng thái hồ sơ', Charts.funnel(steps));
      this._export = { headers: ['STT', 'Vị trí', 'Mới apply', 'Đề cử', 'Phỏng vấn', 'Thử việc', 'Apply → Thử việc %'], rows: rows.map(({ ct, s }, i) => [i + 1, ct.vi_tri, s[0].value, s[1].value, s[2].value, s[3].value, pct(s[3].value, s[0].value)]) };
    } else {
      const rows = Reports.staffPerf(f); if (!rows.length) return none();
      const S = (k) => sum(rows.map((r) => r[k]));
      b.innerHTML = this.doc({ doiTuong: `Tất cả nhân viên (${rows.length} người)`, secTitle: 'Số liệu chi tiết theo nhân viên',
        kpis: [['Ứng viên được đề cử', S('decu')], ['Lượt phỏng vấn', S('pv')], ['Ứng viên nhận việc', S('hired')], ['Tỷ lệ nhận việc trên đề cử', pc1(S('hired'), S('decu'))]],
        headers: ['Nhân viên', 'Dự án phụ trách', 'Ứng viên đề cử', 'Được duyệt', 'Đã gửi KH', 'KH đồng ý PV', 'Lượt phỏng vấn', 'Nhận việc', 'Tỷ lệ nhận việc trên đề cử', '<span class="no-print">In DS</span>'],
        rows: rows.map((r) => [esc(r.n.ho_ten), r.duan, r.decu, r.approved, r.sent, r.accepted, r.pv, r.hired, pc1(r.hired, r.decu), `${act('printer', 'In danh sách đề cử', `data-prn="${r.n.id}"`, 'no-print', 'In danh sách đề cử của nhân viên trong kỳ')}`]),
        total: [S('duan'), S('decu'), S('approved'), S('sent'), S('accepted'), S('pv'), S('hired'), pc1(S('hired'), S('decu')), ''],
        notes: ['Hiệu suất đề cử được tổng hợp theo số dự án phụ trách, số ứng viên đề cử, số được Quản lý duyệt, số lượt phỏng vấn và số ứng viên nhận việc trong kỳ.'] })
        + chart('Số đề cử theo nhân viên', Charts.bars({ data: rows.map((r) => ({ label: r.n.ho_ten.split(' ').slice(-2).join(' '), value: r.decu })), h: 190 }));
      $$('[data-prn]', b).forEach((x) => (x.onclick = () => { const r = rows.find((y) => y.n.id === Number(x.dataset.prn)); if (!r.dcs.length) return toast('Nhân viên chưa có đề cử trong kỳ', 'warn'); Dlg.printRecs(r.dcs); }));
      this._export = { headers: ['STT', 'Nhân viên', 'Vị trí phụ trách', 'Số đề cử', 'Được duyệt', 'Bị yêu cầu sửa', 'Đã gửi KH', 'KH đồng ý PV', 'Lượt PV', 'Nhận việc', 'Tỷ lệ duyệt %', 'Tỷ lệ KH chấp nhận %'], rows: rows.map((r, i) => [i + 1, r.n.ho_ten, r.duan, r.decu, r.approved, r.sua, r.sent, r.accepted, r.pv, r.hired, r.rateApprove, r.rateClient]) };
    }
  },
};

/* ============ CÀI ĐẶT — hồ sơ cá nhân, đổi mật khẩu (mọi vai trò); sao lưu dữ liệu mẫu (Quản trị viên) ============ */
Pages.settings = {
  render(v) {
    const u = Auth.user;
    v.innerHTML = `<div class="page-head"><div><h1>Cài đặt tài khoản</h1></div></div>
      <div class="grid g-2"><div class="card card-pad"><h3 style="font-size:16px" class="mb">Hồ sơ cá nhân</h3><div class="person">${avatar(u.ho_ten, 'lg')}<div><div class="strong" style="font-size:18px">${esc(u.ho_ten)}</div><div class="muted">${esc(u.vai_tro)} · ${esc(u.chuc_vu)}</div></div></div>
        <dl class="kv mt"><dt>Tên đăng nhập</dt><dd>${esc(u.ten_dang_nhap)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Điện thoại</dt><dd>${esc(u.so_dien_thoai || '—')}</dd><dt>Khu vực</dt><dd>${esc(Store.name('khu_vuc', u.ma_khu_vuc))}</dd></dl></div>
      <div class="card card-pad"><h3 style="font-size:16px" class="mb">${icon('lock', 'sm')} Đổi mật khẩu</h3><form class="form-grid" id="pwf" novalidate style="grid-template-columns:1fr">
        ${Form.field('Mật khẩu hiện tại', 'mk_cu', { type: 'password', req: true, attrs: 'autocomplete="current-password"' })}
        ${Form.field('Mật khẩu mới', 'mk_moi', { type: 'password', req: true, attrs: 'autocomplete="new-password"', hint: 'Tối thiểu 6 ký tự, khác mật khẩu hiện tại.' })}
        ${Form.field('Nhập lại mật khẩu mới', 'mk_xn', { type: 'password', req: true, attrs: 'autocomplete="new-password"' })}
        <div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit">${icon('check', 'sm')} Đổi mật khẩu</button></div></form></div>
      ${Auth.isAdmin() ? `<div class="card card-pad" style="grid-column:1/-1"><h3 style="font-size:16px">Sao lưu & khôi phục dữ liệu mẫu <span class="badge sm">Chỉ Quản trị viên</span></h3>
        <p class="t2 small">“Dữ liệu mẫu” là bộ dữ liệu minh họa (khách hàng, dự án, ứng viên, đề cử, lịch phỏng vấn…) được nạp sẵn vào CSDL <b>MySQL</b> (${esc(App.server?.db || 'navigos_talent')}) để trình diễn hệ thống. <b>Khôi phục</b> sẽ xóa toàn bộ dữ liệu hiện tại và nạp lại bộ dữ liệu mẫu ban đầu; <b>Tải bản sao lưu</b> xuất toàn bộ dữ liệu ra tệp JSON.</p>
        <div class="row"><button class="btn danger" id="reset">${icon('refresh', 'sm')} Khôi phục dữ liệu mẫu</button><button class="btn" id="dl">${icon('download', 'sm')} Tải bản sao lưu (JSON)</button></div></div>` : ''}</div>`;
    const f = $('#pwf', v);
    f.onsubmit = (e) => { e.preventDefault(); const x = Form.values(f); const r = Svc.changePassword(x.mk_cu, x.mk_moi, x.mk_xn); if (!r.ok) { if (r.errors) Form.showErrors(f, r.errors); else toast(r.error, 'err'); return; } f.reset(); toast('Đã đổi mật khẩu'); };
    $('#reset') && ($('#reset').onclick = () => confirmBox({ title: 'Khôi phục dữ liệu mẫu', danger: true, okText: 'Khôi phục', message: 'Toàn bộ dữ liệu hiện tại trong MySQL sẽ bị thay bằng bộ dữ liệu mẫu ban đầu.', onOk: () => { const r = Store.reset(); if (r && r.ok === false) { toast(r.error, 'err'); return false; } toast('Đã khôi phục dữ liệu mẫu'); Router.go('#/'); Router.resolve(); } }));
    $('#dl') && ($('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Store.db, null, 1)], { type: 'application/json' })); a.download = 'navigos_talent_backup_' + todayStr() + '.json'; a.click(); });
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
