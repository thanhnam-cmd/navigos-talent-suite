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
      <div class="actions"><div class="input-ico" style="min-width:220px">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên ứng viên, ID vị trí…" value="${esc(f.q)}"></div>${Auth.canOperate() ? `<button class="btn primary" id="add">${icon('plus', 'sm')} Thêm lịch mới</button>` : ''}</div></div>
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
      const ready = DB.ho_so_ung_tuyen.filter((h) => ctIds.has(h.ma_chi_tiet_du_an) && ((h.trang_thai === ST.HS.DECU && Q.latestDeCu(h.id)?.phan_hoi_khach_hang === 'Đồng ý phỏng vấn') || (h.trang_thai === ST.HS.PV && !Q.lichOfHs(h.id).some((l) => l.trang_thai === ST.LICH.LEN) && Q.kqPv(Q.lichOfHs(h.id).at(-1)?.id)?.ket_qua !== 'Đạt')));
      if (!ready.length) return toast('Chưa có hồ sơ nào được khách hàng đồng ý phỏng vấn hoặc cần phỏng vấn thêm.', 'warn');
      Dlg.pickHsForInterview(ready);
    });
  },
};

/* ============ KẾT QUẢ TUYỂN DỤNG (UC_09, UC_11 — Fix Demo lần 1) ============
   Tab "Kết quả phỏng vấn": Nhân viên thao tác (ghi nhận / sửa / tạo lịch vòng tiếp); Quản lý & BGĐ chỉ xem. */
Pages.results = {
  tab: 'pv', f: { q: '', ns: '', kq: '' },
  render(v, p, query) {
    if (query.tab) { this.tab = query.tab; history.replaceState(null, '', '#/ket-qua'); }
    const op = Auth.canOperate();
    const ctIds = new Set(Q.visibleCts().map((c) => c.id));
    const hs = DB.ho_so_ung_tuyen.filter((h) => ctIds.has(h.ma_chi_tiet_du_an));
    const passLich = (h) => Q.lichOfHs(h.id).filter((x) => Q.kqPv(x.id)?.ket_qua === 'Đạt').at(-1);
    const waiting = hs.filter((h) => h.trang_thai === ST.HS.PV && passLich(h) && !Q.kqTd(h.id));
    const kq = DB.ket_qua_tuyen_dung.filter((k) => ctIds.has(Q.hs(k.ma_ho_so_ung_vien).ma_chi_tiet_du_an));
    const acc = kq.filter((k) => k.ket_qua === 'Chấp nhận offer'); const rej = kq.filter((k) => k.ket_qua === 'Từ chối offer');
    const probation = hs.filter((h) => h.trang_thai === ST.HS.TV);
    const failed = hs.filter((h) => h.trang_thai === ST.HS.LOAI && Q.history(h.id).some((x) => x.trang_thai_moi === ST.HS.TV));
    const ivs = DB.lich_phong_van.filter((l) => l.trang_thai !== ST.LICH.HUY && ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an) && (l.trang_thai === ST.LICH.XONG || new Date(l.thoi_gian_ket_thuc) < now()));
    v.innerHTML = `<div class="page-head"><div><h1>Kết quả tuyển dụng</h1></div></div>
      <div class="grid g-4 kpis mb">
        <div class="card kpi"><div><div class="label">Chờ kết quả từ KH</div><div class="value">${waiting.length}</div><div class="sub">Đã đạt phỏng vấn</div></div><div class="ico tone-amber">${icon('clock')}</div></div>
        <div class="card kpi"><div><div class="label">Chấp nhận offer</div><div class="value">${acc.length}</div><div class="sub">Đang thử việc: ${probation.length}</div></div><div class="ico tone-green">${icon('userCheck')}</div></div>
        <div class="card kpi"><div><div class="label">Từ chối offer</div><div class="value">${rej.length}</div></div><div class="ico tone-red">${icon('userX')}</div></div>
        <div class="card kpi"><div><div class="label">Tỷ lệ nhận offer</div><div class="value">${kq.length ? Math.round((acc.length / kq.length) * 100) : 0}%</div><div class="sub">${failed.length} thử việc không đạt → về kho</div></div><div class="ico tone-blue">${icon('chart')}</div></div></div>
      <div class="tabs">${[['pv', `Kết quả phỏng vấn (${ivs.length})`], ['cho', `Chờ ghi nhận (${waiting.length})`], ['tv', `Đang thử việc (${probation.length})`], ['tat-ca', `Đã ghi nhận (${kq.length})`], ['du-an', 'Theo vị trí']].map(([k, l]) => `<button data-t="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="kb"></div>`;
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    const kb = $('#kb');
    const who = (h) => { const u = Q.uv(h.ma_ung_vien); return `<td class="cell-main"><div class="person">${avatar(u.ho_ten, 'sm')}<div><div class="nm">${esc(u.ho_ten)}</div><div class="sb">${Code.hs(h.id)}</div></div></div></td>`; };
    const pos = (h) => { const ct = Q.ct(h.ma_chi_tiet_du_an); return `<td data-label="Vị trí"><a href="#/du-an/${ct.id}">${esc(ct.vi_tri)}</a><div class="t-sub">${esc(Q.khOfCt(ct).ten_cong_ty)}</div></td>`; };
    const fbText = (l) => { const f = Q.feedbacks(l.id).at(-1); return f ? `<span title="${esc(f.noi_dung)}">${esc(f.noi_dung.slice(0, 70))}${f.noi_dung.length > 70 ? '…' : ''}</span>` : '<span class="muted">Chưa có feedback</span>'; };
    const table = (head, rows, empty) => `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th>${head.map((h) => `<th${h.startsWith('!') ? ' class="num"' : ''}>${h.replace(/^!/, '')}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length + 1}">${emptyState(empty, 'checkCircle')}</td></tr>`}</tbody></table></div></div>`;

    if (this.tab === 'pv') {
      const f = this.f; const staffIds = [...new Set(ivs.map((l) => l.ma_nhan_su))];
      const status = (l) => Q.kqPv(l.id)?.ket_qua || 'Chờ ghi kết quả';
      const list = ivs.filter((l) => { const h = Q.hs(l.ma_ho_so_ung_vien); const u = Q.uv(h.ma_ung_vien); const c = Q.ct(h.ma_chi_tiet_du_an);
        return (!f.q || norm(`${u.ho_ten} ${c.vi_tri}`).includes(norm(f.q))) && (!f.ns || l.ma_nhan_su === Number(f.ns)) && (!f.kq || status(l) === f.kq); })
        .sort((a, b) => b.thoi_gian_bat_dau.localeCompare(a.thoi_gian_bat_dau));
      const chips = ['', 'Chờ ghi kết quả', 'Đạt', 'Không đạt', 'Cần phỏng vấn thêm'];
      const act = (l) => {
        const h = Q.hs(l.ma_ho_so_ung_vien); const k = Q.kqPv(l.id);
        if (!op || !Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an))) return `<button class="btn xs" data-ivview="${l.id}">${icon('eye', 'sm')} Xem chi tiết</button>`;
        const b = [];
        if (!k) b.push(`<button class="btn xs primary" data-ghi="${l.id}">Ghi nhận</button>`); else b.push(`<button class="btn xs" data-sua="${l.id}">Sửa</button>`);
        const latest = Q.lichOfHs(h.id).filter((x) => x.trang_thai !== ST.LICH.HUY).at(-1)?.id === l.id;
        if (k?.ket_qua === 'Cần phỏng vấn thêm' && latest && h.trang_thai === ST.HS.PV) b.push(`<button class="btn xs outline-primary" data-vong="${h.id}">Tạo lịch vòng ${l.vong + 1}</button>`);
        b.push(`<button class="btn xs" data-open="${h.id}">Mở hồ sơ</button>`);
        return `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${b.join('')}</div>`;
      };
      kb.innerHTML = `<div class="card mb"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="fq" placeholder="Tìm theo tên ứng viên, vị trí…" value="${esc(f.q)}"></div>
          <select class="select" id="fns" style="width:auto">${[['', 'Mọi nhân viên'], ...staffIds.map((id) => [id, Q.ns(id).ho_ten])].map(([a, b]) => `<option value="${a}" ${String(f.ns) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>
          <div class="chip-group">${chips.map((c) => `<button class="chip ${f.kq === c ? 'active' : ''}" data-kq="${c}">${c || 'Tất cả'} ${ivs.filter((l) => !c || status(l) === c).length}</button>`).join('')}</div></div></div>`
        + table(['Ứng viên', 'Vị trí', 'Ngày phỏng vấn', 'Nhân viên PV', 'Kết quả PV', '!Điểm', 'Feedback khách hàng', '!Thao tác'],
          list.map((l, i) => { const h = Q.hs(l.ma_ho_so_ung_vien); const k = Q.kqPv(l.id); const ns = Q.ns(l.ma_nhan_su);
            return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Ngày PV" class="nowrap">${fmtDate(l.thoi_gian_bat_dau)}<div class="t-sub">Vòng ${l.vong}</div></td>
              <td data-label="NV PV">${esc(ns.ho_ten)}<div class="t-sub">${esc(Store.name('khu_vuc', ns.ma_khu_vuc))}</div></td>
              <td data-label="Kết quả PV">${k ? badge(k.ket_qua) : '<span class="badge">Chờ ghi kết quả</span>'}<div class="t-sub">${k?.ket_qua === 'Đạt' ? (Q.kqTd(h.id) ? 'Đã có kết quả TD' : '→ Chờ ghi nhận') : k?.ket_qua === 'Không đạt' ? 'Hồ sơ Bị loại' : k ? 'Giữ ở Phỏng vấn' : ''}</div></td>
              <td data-label="Điểm" class="num">${k?.diem_danh_gia != null ? `<b>${k.diem_danh_gia}</b>/10` : '—'}</td>
              <td data-label="Feedback KH" class="small" style="max-width:240px">${fbText(l)}</td><td data-label="">${act(l)}</td></tr>`; }), 'Chưa có buổi phỏng vấn nào đã diễn ra');
      $('#fq', kb).oninput = debounce((e) => { f.q = e.target.value; UI.refresh(); $('#fq').focus(); $('#fq').setSelectionRange(f.q.length, f.q.length); }, 300);
      $('#fns', kb).onchange = (e) => { f.ns = e.target.value; UI.refresh(); };
      $$('[data-kq]', kb).forEach((b) => (b.onclick = () => { f.kq = b.dataset.kq; UI.refresh(); }));
    } else if (this.tab === 'cho') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', '!Điểm PV', 'Ngày đạt PV', 'Feedback (phỏng vấn)', '!Thao tác'],
        waiting.map((h, i) => { const l = passLich(h); const k = Q.kqPv(l.id);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Điểm PV" class="num"><b>${k.diem_danh_gia ?? '—'}</b>/10</td>
            <td data-label="Ngày đạt PV" class="nowrap" title="Ngày ghi nhận ứng viên ĐẠT phỏng vấn">${fmtDate(k.ngay_ghi_nhan)}<div class="t-sub">${relTime(k.ngay_ghi_nhan)} · vòng ${l.vong}</div></td>
            <td data-label="Feedback" class="small" style="max-width:260px">${fbText(l)}</td>
            <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${op && Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an)) ? `<button class="btn xs success" data-hire="${h.id}">${icon('checkCircle', 'sm')} Ghi nhận kết quả</button>` : ''}<button class="btn xs" data-open="${h.id}">Hồ sơ</button></div></td></tr>`; }), 'Không có ứng viên chờ kết quả');
    } else if (this.tab === 'tv') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', 'Ngày nhận việc', 'Email xác nhận', '!Thao tác'],
        probation.map((h, i) => { const k = Q.kqTd(h.id);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Nhận việc">${fmtDate(k?.ngay_nhan_viec)}</td><td data-label="Email">${icon('file', 'sm')} <span class="small">${esc(k?.email_xac_nhan || '—')}</span></td>
            <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${op && Q.canHandleCt(Q.ct(h.ma_chi_tiet_du_an)) ? `<button class="btn xs" data-prob="${h.id}" style="color:var(--red)">${icon('userX', 'sm')} Thử việc không đạt</button>` : ''}<button class="btn xs" data-open="${h.id}">Hồ sơ</button></div></td></tr>`; }), 'Chưa có');
    } else if (this.tab === 'tat-ca') {
      kb.innerHTML = table(['Ứng viên', 'Vị trí', 'Kết quả', 'KH báo', 'Chi tiết', '!Thao tác'],
        kq.sort((a, b) => b.ngay_ghi_nhan.localeCompare(a.ngay_ghi_nhan)).map((k, i) => { const h = Q.hs(k.ma_ho_so_ung_vien);
          return `<tr><td class="stt">${i + 1}</td>${who(h)}${pos(h)}<td data-label="Kết quả">${badge(k.ket_qua)}</td><td data-label="KH báo">${fmtDate(k.ngay_khach_hang_bao)}</td><td data-label="Chi tiết" class="small">${k.ngay_nhan_viec ? 'Nhận việc ' + fmtDate(k.ngay_nhan_viec) : esc(k.ly_do_tu_choi || '')}${h.trang_thai === ST.HS.LOAI && k.ket_qua === 'Chấp nhận offer' ? '<br><span class="badge sm red">Thử việc không đạt</span>' : ''}</td><td data-label=""><button class="btn xs" data-open="${h.id}">Hồ sơ</button></td></tr>`; }), 'Chưa có kết quả');
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
    v.innerHTML = `<div class="page-head"><div><h1>Tài khoản & phân quyền</h1><p>Mỗi tài khoản gắn với một vai trò; quyền truy cập chức năng xác định theo vai trò (BR2-2).</p></div><div class="actions"><button class="btn primary" id="add">${icon('plus', 'sm')} Thêm tài khoản</button></div></div>
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo họ tên, tên đăng nhập, email…" value="${esc(f.q)}"></div>
        <select class="select" id="role" style="width:auto">${[['', 'Mọi vai trò'], ...Object.values(ROLES).map((r) => [r, r])].map(([a, b]) => `<option value="${a}" ${f.role === a ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <select class="select" id="kv" style="width:auto">${Form.opts('khu_vuc', { blank: 'Mọi khu vực' }).map(([a, b]) => `<option value="${a}" ${String(f.kv) === String(a) ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th><th>Nhân sự</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Khu vực</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${rows.map((n, i) => `<tr><td class="stt">${i + 1}</td><td class="cell-main"><div class="person">${avatar(n.ho_ten, 'sm')}<div><div class="nm">${esc(n.ho_ten)}</div><div class="sb">${esc(n.email)} · ${esc(n.chuc_vu)}</div></div></div></td><td data-label="Tên đăng nhập"><span class="code">${esc(n.ten_dang_nhap)}</span></td>
        <td data-label="Vai trò"><select class="select" data-role="${n.id}" style="height:32px;width:auto" ${n.id === Auth.user.id ? 'disabled' : ''}>${Object.values(ROLES).map((r) => `<option ${n.vai_tro === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
        <td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td><td data-label="Trạng thái">${badge(n.trang_thai_lam_viec)}</td>
        <td data-label=""><div class="row" style="gap:4px;justify-content:flex-end"><button class="btn xs" data-ed="${n.id}">${icon('edit', 'sm')} Sửa</button><button class="btn xs" data-pw="${n.id}">${icon('lock', 'sm')} Đặt lại MK</button>${n.trang_thai_lam_viec === 'Đang làm việc' && n.id !== Auth.user.id ? `<button class="btn xs" data-off="${n.id}" style="color:var(--red)">Nghỉ việc</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card card-pad mt"><h3 style="font-size:15px" class="mb">Ma trận phân quyền theo vai trò</h3><div class="table-wrap"><table class="table"><thead><tr><th>Chức năng</th>${Object.values(ROLES).map((r) => `<th style="text-align:center">${r}</th>`).join('')}</tr></thead><tbody>
      ${[['Đăng nhập, hồ sơ cá nhân, đổi mật khẩu', 1, 1, 1, 1], ['Tài khoản, phân quyền, đặt lại mật khẩu, danh mục', 1, 0, 0, 0], ['Khách hàng', 0, 'Xem', 'Xem', 1], ['Xem dự án', 0, 'Tất cả', 'Tất cả', 'Tự tạo / được phân công'], ['Tạo dự án, tiếp nhận yêu cầu', 0, 0, 0, 1], ['Sửa, gắn mã tin, đóng / hủy dự án', 0, 0, 0, 'Dự án do mình tạo'], ['Phân công nhân viên phụ trách', 0, 0, 1, 0], ['Hồ sơ ứng viên (chuẩn hóa, gắn thẻ, lưu trữ)', 0, 'Xem', 'Xem', 1], ['Lọc ứng viên, tạo / gỡ đề cử', 0, 'Xem', 'Xem', 1], ['Duyệt / yêu cầu chỉnh sửa đề cử', 0, 0, 1, 0], ['Góp ý đề cử đã xử lý', 0, 'Xem & góp ý', 'Nhận góp ý', 0], ['Gửi đề cử cho KH, ghi nhận phản hồi', 0, 'Xem', 'Xem', 1], ['Lịch phỏng vấn, chọn / đổi NV phỏng vấn', 0, 'Xem', 'Xem', 1], ['Kết quả phỏng vấn, feedback, kết quả tuyển dụng', 0, 'Xem', 'Xem', 1], ['Báo cáo - thống kê, xuất Excel / PDF', 0, 1, 1, 0]]
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
        ${Form.field('Nhân viên', 'ns', { opts: [['', 'Tất cả'], ...DB.nhan_su.filter((n) => n.vai_tro === ROLES.NV).map((n) => [n.id, n.ho_ten])], value: f.ns })}</form></div>
      <div id="rbody"></div>`;
    if (innerWidth <= 720) $('#rf').style.gridTemplateColumns = '1fr 1fr';
    $$('[data-type]', v).forEach((b) => (b.onclick = () => { this.type = b.dataset.type; UI.refresh(); }));
    $$('#rf [name]').forEach((el) => (el.onchange = () => { Object.assign(f, Form.values($('#rf'))); this.body(); }));
    $('#pdf').onclick = () => { if (!this._export) return toast('Không có dữ liệu để xuất', 'warn'); Export.pdf(); };
    $('#xls').onclick = () => { const x = this._export; if (!x || !x.rows.length) return toast('Không có dữ liệu để xuất', 'warn'); Export.excel(`${this.code()}`, t[1], x.headers, x.rows); };
    this.body();
  },
  code() { const t = this.TYPES.find((x) => x[0] === this.type); return `BC-${t[3]}-${todayStr().replace(/-/g, '')}-01`; },
  /** Khung báo cáo theo mẫu: tiêu đề công ty, mã báo cáo, kỳ, đơn vị / phạm vi / người lập / đối tượng,
      I. Tổng quan (ô KPI), II. Bảng chi tiết có STT + Tổng cộng, Ghi chú, chữ ký. */
  doc({ kpis, secTitle, headers, rows, total, notes, doiTuong }) {
    const f = this.f; const t = this.TYPES.find((x) => x[0] === this.type); const u = Auth.user; const d = new Date(now());
    const ky = f.from || f.to ? `từ ${f.from ? fmtDate(f.from) : 'đầu kỳ'} đến ${fmtDate(f.to || d)}` : `toàn bộ thời gian, tính đến ${fmtDate(d)}`;
    const scope = [f.kh && Q.kh(f.kh)?.ten_cong_ty, f.vt && `vị trí chứa “${f.vt}”`, f.ns && `nhân viên ${Q.ns(f.ns)?.ho_ten}`].filter(Boolean);
    const np = (i) => (/no-print/.test(headers[i]) ? ' no-print' : '');
    const cell = (c, i) => `<td class="${/^[\d.,%–\s]*$/.test(String(c)) || /^<button/.test(String(c)) ? 'c' : ''}${np(i)}">${c}</td>`;
    const place = /hồ chí minh|hcm/i.test(Store.name('khu_vuc', u.ma_khu_vuc)) ? 'TP. Hồ Chí Minh' : 'Hà Nội';
    return `<div class="card rp-doc">
      <div class="rp-top"><div class="rp-brand"><span class="rp-logo">N</span><div><div class="rp-co">CÔNG TY CỔ PHẦN NAVIGOS GROUP VIỆT NAM</div><div class="muted small">Hệ thống quản lý dự án tuyển dụng Talent Suite</div></div></div>
        <div class="rp-code"><div>Mã báo cáo: <b>${this.code()}</b></div><div>Xuất lúc: <b>${fmtTime(d)}, ${fmtDate(d)}</b></div></div></div>
      <h2 class="rp-title">BÁO CÁO ${t[1].toUpperCase()}</h2><div class="rp-period">Kỳ báo cáo: ${ky}</div>
      <dl class="rp-meta"><dt>Đơn vị</dt><dd>Navigos Group Việt Nam</dd><dt>Người lập báo cáo</dt><dd>${esc(u.ho_ten)} (${esc(u.vai_tro)})</dd>
        <dt>Phạm vi dữ liệu</dt><dd>${scope.length ? esc(scope.join('; ')) : 'Toàn bộ dự án của công ty'}</dd><dt>Đối tượng</dt><dd>${esc(doiTuong)}</dd></dl>
      <div class="rp-sec">I. Tổng quan trong kỳ</div>
      <div class="rp-kpis">${kpis.map(([l, n]) => `<div><div class="l">${l}</div><div class="v">${n}</div></div>`).join('')}</div>
      <div class="rp-sec">II. ${secTitle}</div>
      <div class="table-wrap"><table class="rp-table"><thead><tr><th style="width:48px">STT</th>${headers.map((h, i) => `<th class="${np(i)}">${h}</th>`).join('')}</tr></thead><tbody>
        ${rows.map((r, i) => `<tr><td class="c">${i + 1}</td>${r.map(cell).join('')}</tr>`).join('')}
        ${total ? `<tr class="total"><td colspan="2" class="c">Tổng cộng</td>${total.map((c, i) => cell(c, i + 1)).join('')}</tr>` : ''}</tbody></table></div>
      <div class="rp-notes"><b>Ghi chú</b><ul>${[...notes, 'Số liệu được tổng hợp tự động từ hệ thống, không làm thay đổi dữ liệu gốc (BR12-5).'].map((n) => `<li>${n}</li>`).join('')}</ul></div>
      <div class="rp-date">${place}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}</div>
      <div class="rp-sign"><div><b>NGƯỜI LẬP BÁO CÁO</b><i>(Ký, ghi rõ họ tên)</i><div class="nm">${esc(u.ho_ten)}</div><div class="muted small">${esc(u.vai_tro)} - ${esc(Store.name('khu_vuc', u.ma_khu_vuc))}</div></div>
        <div><b>NGƯỜI PHÊ DUYỆT</b><i>(Ký, ghi rõ họ tên, đóng dấu)</i></div></div>
      <div class="rp-foot">Navigos Group Việt Nam · Báo cáo ${t[1].toLowerCase()} · ${this.code()}</div></div>`;
  },
  body() {
    const f = this.f; const b = $('#rbody');
    const pct = (a, c) => (c ? Math.round((a / c) * 100) : 0);
    const pc1 = (a, c) => (c ? ((a / c) * 100).toFixed(1).replace('.', ',') + '%' : '–');
    const none = () => { b.innerHTML = `<div class="card">${emptyState('Không có dữ liệu trong bộ lọc đã chọn — hãy chọn lại bộ lọc (5a).', 'search')}</div>`; this._export = null; };
    const chart = (title, html) => `<div class="card mt no-print"><div class="card-head"><h3>${title}</h3><span class="muted small">Biểu đồ minh họa (không in)</span></div><div class="card-body">${html}</div></div>`;
    const short = (s) => s.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, '');
    if (this.type === 'tien-do' || this.type === 'tre-han') {
      const late = this.type === 'tre-han'; const rows = late ? Reports.overdue(f) : Reports.progress(f); if (!rows.length) return none();
      const can = sum(rows.map((r) => r.ct.so_luong)); const nhan = sum(rows.map((r) => r.hired));
      b.innerHTML = this.doc({ doiTuong: `${rows.length} vị trí tuyển dụng`, secTitle: late ? 'Danh sách vị trí trễ hạn' : 'Số liệu chi tiết theo vị trí',
        kpis: [['Số vị trí', rows.length], ['Cần tuyển', can], ['Đã nhận việc', nhan], late ? ['Số ngày trễ trung bình', Math.round(sum(rows.map((r) => -daysUntil(r.ct.han_hoan_thanh))) / rows.length)] : ['Tỷ lệ hoàn thành chỉ tiêu', pc1(nhan, can)]],
        headers: ['Vị trí (ID)', 'Khách hàng', 'Phụ trách', 'Hạn hoàn thành', 'Cần tuyển', 'Nhận việc', 'Tiến độ', 'Đề cử', 'Phỏng vấn', 'Trạng thái'],
        rows: rows.map((r) => [`${esc(r.ct.vi_tri)}<div class="t-sub">${Code.ct(r.ct.id)}</div>`, esc(short(r.kh.ten_cong_ty)), esc(r.staff || '—'), `${fmtDate(r.ct.han_hoan_thanh)}${r.dl ? `<div class="t-sub" style="color:var(--${r.dl.level === 'red' ? 'red' : 'amber'})">${r.dl.text}</div>` : ''}`, r.ct.so_luong, r.hired, r.pct + '%', r.decu, r.pv, esc(r.ct.trang_thai)]),
        total: ['', '', '', can, nhan, pc1(nhan, can), sum(rows.map((r) => r.decu)), sum(rows.map((r) => r.pv)), ''],
        notes: late ? ['Vị trí trễ hạn: đã quá hạn hoàn thành mà chưa Hoàn thành / Đã đóng / Đã hủy (BR12-3).'] : ['Tiến độ = số ứng viên nhận việc / số lượng cần tuyển của vị trí.'] })
        + (late ? '' : chart('Tiến độ các vị trí đang thực hiện', rows.filter((r) => r.ct.trang_thai === ST.CT.DANG).map((r) => `<div style="margin-bottom:10px"><div class="prog-meta"><span class="strong" style="font-size:12px">${esc(r.ct.vi_tri)}</span><span>${r.hired}/${r.ct.so_luong}</span></div>${progressBar(r.pct, r.dl?.level === 'red' ? 'red' : r.dl ? 'amber' : '')}</div>`).join('') || emptyState('Không có')));
      this._export = { headers: ['STT', 'ID vị trí', 'Vị trí', 'Khách hàng', 'Phụ trách', 'Hạn hoàn thành', 'Cảnh báo', 'Cần tuyển', 'Đã nhận việc', 'Tiến độ %', 'Số đề cử', 'Số phỏng vấn', 'Trạng thái'], rows: rows.map((r, i) => [i + 1, Code.ct(r.ct.id), r.ct.vi_tri, r.kh.ten_cong_ty, r.staff, fmtDate(r.ct.han_hoan_thanh), r.dl?.text || '', r.ct.so_luong, r.hired, r.pct, r.decu, r.pv, r.ct.trang_thai]) };
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
        total: [T(0), T(1), T(2), T(3), pc1(T(3), T(0))], notes: ['Tỷ lệ = số hồ sơ đạt tới trạng thái sau / số hồ sơ ở trạng thái trước × 100 (BR12-2).', 'Đếm theo các mốc trong Lịch sử trạng thái — hồ sơ được tính ở mọi trạng thái từng đạt tới, kể cả sau đó bị loại.'] })
        + chart('Phễu chuyển đổi theo trạng thái hồ sơ', Charts.funnel(steps));
      this._export = { headers: ['STT', 'Vị trí', 'Mới apply', 'Đề cử', 'Phỏng vấn', 'Thử việc', 'Apply → Thử việc %'], rows: rows.map(({ ct, s }, i) => [i + 1, ct.vi_tri, s[0].value, s[1].value, s[2].value, s[3].value, pct(s[3].value, s[0].value)]) };
    } else {
      const rows = Reports.staffPerf(f); if (!rows.length) return none();
      const S = (k) => sum(rows.map((r) => r[k]));
      b.innerHTML = this.doc({ doiTuong: `Tất cả nhân viên (${rows.length} người)`, secTitle: 'Số liệu chi tiết theo nhân viên',
        kpis: [['Ứng viên được đề cử', S('decu')], ['Lượt phỏng vấn', S('pv')], ['Ứng viên nhận việc', S('hired')], ['Tỷ lệ nhận việc trên đề cử', pc1(S('hired'), S('decu'))]],
        headers: ['Nhân viên', 'Dự án phụ trách', 'Ứng viên đề cử', 'Được duyệt', 'Đã gửi KH', 'KH đồng ý PV', 'Lượt phỏng vấn', 'Nhận việc', 'Tỷ lệ nhận việc trên đề cử', '<span class="no-print">In DS</span>'],
        rows: rows.map((r) => [esc(r.n.ho_ten), r.duan, r.decu, r.approved, r.sent, r.accepted, r.pv, r.hired, pc1(r.hired, r.decu), `<button class="btn xs no-print" data-prn="${r.n.id}">${icon('printer', 'sm')}</button>`]),
        total: [S('duan'), S('decu'), S('approved'), S('sent'), S('accepted'), S('pv'), S('hired'), pc1(S('hired'), S('decu')), ''],
        notes: ['Hiệu suất đề cử được tổng hợp theo số dự án phụ trách, số ứng viên đề cử, số được Quản lý duyệt, số lượt phỏng vấn và số ứng viên nhận việc trong kỳ (BR12-4).'] })
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

/* ============ QUY TẮC XẾP LỊCH PHỎNG VẤN (BR10-6) ============ */
Pages.scheduleRules = {
  render(v) {
    const R = Q.rules(); const row = DB.quy_tac_xep_lich[0]; const by = row?.ma_nguoi_cap_nhat ? Q.ns(row.ma_nguoi_cap_nhat)?.ho_ten : null;
    const upcoming = DB.lich_phong_van.filter((l) => l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_bat_dau) >= startOfDay(now()));
    const flagged = upcoming.map((l) => ({ l, w: Q.scheduleCheck({ nsId: l.ma_nhan_su, bd: new Date(l.thoi_gian_bat_dau), kt: new Date(l.thoi_gian_ket_thuc), hinh_thuc: l.hinh_thuc, ctId: Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an, exceptId: l.id }).warnings })).filter((x) => x.w.length);
    v.innerHTML = `<div class="page-head"><div><h1>Quy tắc xếp lịch phỏng vấn</h1><p>Các mức thời gian dùng để <b>cảnh báo</b> khi lên lịch (BR10-6). Trùng lịch của nhân viên phỏng vấn luôn là <b>lỗi</b> và không cho lưu (BR10-2).</p></div></div>
      <div class="grid g-main">
        <div class="card card-pad"><form class="form-grid" id="rf" novalidate>
          ${Form.field('Khoảng nghỉ tối thiểu giữa hai buổi (phút)', 'khoang_nghi_phut', { type: 'number', req: true, value: R.khoang_nghi_phut, attrs: 'min="0" max="240"', hint: 'Hai buổi liên tiếp cùng nhân viên cách nhau ít hơn mức này → cảnh báo.' })}
          ${Form.field('Thời gian di chuyển giữa hai khu vực (phút)', 'di_chuyen_phut', { type: 'number', req: true, value: R.di_chuyen_phut, attrs: 'min="0" max="720"', hint: 'Áp dụng khi hai buổi trực tiếp ở hai khu vực khác nhau.' })}
          ${Form.field('Giờ làm việc bắt đầu', 'gio_bat_dau', { type: 'time', req: true, value: R.gio_bat_dau })}
          ${Form.field('Giờ làm việc kết thúc', 'gio_ket_thuc', { type: 'time', req: true, value: R.gio_ket_thuc })}
          ${Form.field('Số buổi phỏng vấn tối đa / nhân viên / ngày', 'so_buoi_toi_da', { type: 'number', req: true, value: R.so_buoi_toi_da, attrs: 'min="1" max="20"' })}
          <div class="field" style="display:flex;align-items:flex-end"><label class="check" style="text-transform:none;font-size:14px;color:var(--text)"><input type="checkbox" name="canh_bao_cuoi_tuan" ${Number(R.canh_bao_cuoi_tuan) ? 'checked' : ''}> Cảnh báo khi lịch rơi vào thứ Bảy / Chủ nhật</label></div>
          <div class="full row between"><span class="muted small">${row?.ngay_cap_nhat ? `Cập nhật ${fmtDT(row.ngay_cap_nhat)}${by ? ' bởi ' + esc(by) : ''}` : 'Đang dùng giá trị mặc định'}</span><button class="btn primary" type="submit">${icon('check', 'sm')} Lưu quy tắc</button></div>
        </form></div>
        <div class="card card-pad"><h3 style="font-size:15px" class="mb">Cách hệ thống xử lý khi lên lịch</h3>
          <div class="timeline">
            <div class="tl-item"><b>1. Nhập lịch khách hàng chốt</b><div class="note">Ngày, giờ, hình thức, địa điểm — hệ thống không tự đổi giờ.</div></div>
            <div class="tl-item violet"><b>2. Phân công nhân viên phỏng vấn</b><div class="note">Mặc định người phụ trách dự án (có thể chọn người khác).</div></div>
            <div class="tl-item red"><b>3. Trùng lịch → không cho lưu</b><div class="note">Gợi ý nhân viên đang rảnh trong khung giờ đó.</div></div>
            <div class="tl-item amber"><b>4. Cảnh báo → xác nhận để lưu</b><div class="note">Khoảng nghỉ, di chuyển, ngoài giờ, cuối tuần, số buổi/ngày.</div></div>
            <div class="tl-item green"><b>5. Lưu lịch, hồ sơ → “Phỏng vấn”</b></div>
          </div></div>
      </div>
      <div class="card mt"><div class="card-head"><div><h3>Lịch sắp tới đang vi phạm quy tắc hiện hành</h3><p>Rà soát sau khi thay đổi quy tắc — ${flagged.length}/${upcoming.length} buổi có cảnh báo</p></div></div>
        <div class="card-body">${flagged.length ? flagged.map(({ l, w }) => `<div class="alert"><span class="ico tone-amber">${icon('alert', 'sm')}</span><div><div class="tt">${fmtDT(l.thoi_gian_bat_dau)} · ${esc(Q.ns(l.ma_nhan_su).ho_ten)} · ${esc(Q.uv(Q.hs(l.ma_ho_so_ung_vien).ma_ung_vien).ho_ten)}</div>${w.map((x) => `<div class="ds">• <b>${esc(x.loai)}:</b> ${esc(x.text)}</div>`).join('')}</div></div>`).join('') : emptyState('Không có lịch sắp tới nào vi phạm quy tắc', 'checkCircle')}</div></div>`;
    const f = $('#rf', v);
    f.onsubmit = (e) => { e.preventDefault(); const r = Svc.saveScheduleRules(Form.values(f)); if (!r.ok) { if (r.errors) Form.showErrors(f, r.errors); else toast(r.error, 'err'); return; } toast('Đã lưu quy tắc xếp lịch phỏng vấn'); UI.refresh(); };
  },
};
