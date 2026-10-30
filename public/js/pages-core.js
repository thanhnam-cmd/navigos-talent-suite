/* ==========================================================
   pages-core.js — Đăng nhập, Trang chủ, Dự án tuyển dụng,
   Chi tiết dự án (kanban) và các hộp thoại nghiệp vụ dùng chung
   ========================================================== */
const Pages = {};
const after = (r, okMsg, then) => { if (!r.ok) { if (r.errors) return r; toast(r.error, 'err'); return r; } if (okMsg) toast(okMsg); Store.save(); then ? then(r) : UI.refresh(); return r; };
const kvOpts = () => Form.opts('khu_vuc', { blank: '— Chọn khu vực —' });
const ctOpts = (filter = (c) => c.trang_thai === ST.CT.DANG) => [['', '— Chọn dự án (ID) —'], ...Q.visibleCts().filter(filter).map((c) => [c.id, `${Code.ct(c.id)} · ${c.vi_tri} — ${Q.khOfCt(c)?.ten_cong_ty}`])];

/* ============ ĐĂNG NHẬP (UC_01) ============ */
Pages.login = {
  render(root) {
    if (Auth.user) return Router.go('#/');
    const demo = [['admin', 'Quản trị viên', 'Tài khoản & phân quyền'], ['giamdoc', 'Ban Giám đốc', 'Báo cáo, phân công, duyệt'], ['quanly', 'Quản lý', 'Phân công, duyệt đề cử'], ['nhanvien', 'Nhân viên', 'Xử lý hồ sơ, đề cử, phỏng vấn']];
    root.innerHTML = `<div class="login-page">
      <section class="login-art">
        <img class="mark" src="assets/mark.png" alt="">
        <div><h2>Kết nối đúng người, đúng việc — quản lý trọn vòng đời dự án tuyển dụng.</h2>
          <p class="mt">Hệ thống quản lý dự án tuyển dụng cho Navigos Search: từ tiếp nhận yêu cầu của khách hàng, thu thập hồ sơ tự động, đề cử – phỏng vấn đến ghi nhận kết quả và báo cáo.</p></div>
        <div class="flow"><span>Tiếp nhận yêu cầu</span><span>Phân công</span><span>Thu thập hồ sơ</span><span>Lọc & đề cử</span><span>Duyệt nội bộ</span><span>Phỏng vấn</span><span>Kết quả</span><span>Báo cáo</span></div>
      </section>
      <section class="login-box"><div class="card login-card">
        <img class="logo" src="assets/logo.png" alt="Navigos Group">
        <h1>Talent Suite</h1><p class="lead">Hệ thống quản lý dự án tuyển dụng nội bộ</p>
        <form id="lf" novalidate class="stack" style="gap:14px">
          <div class="field"><label>Email hoặc tên đăng nhập</label><div class="input-ico">${icon('mail', 'sm')}<input class="input" name="u" autocomplete="username" placeholder="name@navigosgroup.com"></div></div>
          <div class="field"><label>Mật khẩu</label><div class="input-ico">${icon('lock', 'sm')}<input class="input" type="password" name="p" autocomplete="current-password" placeholder="Nhập mật khẩu"></div></div>
          <div id="lerr"></div>
          <button class="btn primary block" type="submit">Đăng nhập ${icon('arrowRight', 'sm')}</button>
        </form>
        <div class="divider">TÀI KHOẢN DEMO · MẬT KHẨU 123456</div>
        <div class="demo-accounts">${demo.map(([u, r, d]) => `<button type="button" data-u="${u}"><b>${r}</b><span class="muted">${d}</span></button>`).join('')}</div>
        <p class="muted small" style="text-align:center;margin:16px 0 0">Tài khoản do Quản trị viên cấp. Quên mật khẩu? Liên hệ Quản trị viên để đặt lại.</p>
      </div></section></div>`;
    const f = $('#lf');
    f.onsubmit = (e) => {
      e.preventDefault(); const v = Form.values(f);
      if (!v.u || !v.p) { $('#lerr').innerHTML = `<div class="callout red">${icon('alert', 'sm')} Vui lòng nhập tên đăng nhập và mật khẩu.</div>`; return; }
      const r = Auth.login(v.u, v.p);
      if (!r.ok) { $('#lerr').innerHTML = `<div class="callout red">${icon('alert', 'sm')} ${esc(r.error)}</div>`; return; }
      const back = App.afterLogin && App.afterLogin !== '/login' ? App.afterLogin : '/'; App.afterLogin = null;
      document.body.innerHTML = ''; location.hash = '#' + back; Router.resolve();
    };
    $$('[data-u]').forEach((b) => (b.onclick = () => { f.u.value = b.dataset.u; f.p.value = '123456'; f.requestSubmit(); }));
  },
};

/* ============ TRANG CHỦ (theo vai trò) ============ */
Pages.home = {
  render(v) {
    const u = Auth.user;
    const hello = `<div class="page-head"><div><h1>Xin chào, ${esc(u.ho_ten)}</h1><p>${esc(u.vai_tro)} · ${esc(u.chuc_vu)} — hôm nay ${fmtDate(now())}</p></div></div>`;
    if (Auth.isAdmin()) return this.admin(v, hello);
    const cts = Q.visibleCts(); const ctIds = new Set(cts.map((c) => c.id));
    const running = cts.filter((c) => c.trang_thai === ST.CT.DANG);
    const hs = DB.ho_so_ung_tuyen.filter((h) => ctIds.has(h.ma_chi_tiet_du_an));
    const c = Shell.counts();
    const newApply = hs.filter((h) => h.trang_thai === ST.HS.APPLY && now() - new Date(h.ngay_apply) < 7 * DAY).length;
    const kpi = (label, val, sub, ic, tone, href) => `<div class="card kpi clickable" data-href="${href}"><div><div class="label">${label}</div><div class="value">${val}</div><div class="sub">${sub}</div></div><div class="ico ${tone}">${icon(ic)}</div></div>`;

    // Biểu đồ hồ sơ theo ngày (14 ngày)
    const days = [...Array(14)].map((_, i) => { const d = new Date(now()); d.setDate(d.getDate() - 13 + i); return toDateStr(d); });
    const applyByDay = days.map((d) => hs.filter((h) => toDateStr(h.ngay_apply) === d && h.ma_tin_kenh).length);
    const dcByDay = days.map((d) => DB.de_cu.filter((x) => ctIds.has(Q.hs(x.ma_ho_so_ung_vien).ma_chi_tiet_du_an) && toDateStr(x.ngay_tao) === d).length);
    const bySource = DB.kenh_dang_tuyen.filter((k) => k.loai !== 'noi_bo').map((k) => ({ label: k.ten_kenh.replace(' Website', ''), value: hs.filter((h) => DB.tin_dang.some((t) => t.ma_kenh === k.id && t.ma_tin_kenh === h.ma_tin_kenh)).length }));
    const byKh = Object.entries(groupBy(cts.filter((x) => !CT_CLOSED.includes(x.trang_thai)), (x) => Q.khOfCt(x).ten_cong_ty)).map(([k, l]) => ({ label: k.replace(/^(Công ty (CP|TNHH)|Ngân hàng TMCP) /, ''), value: l.length }));
    const alerts = cts.map((ct) => ({ ct, dl: Q.deadline(ct) })).filter((x) => x.dl).sort((a, b) => daysUntil(a.ct.han_hoan_thanh) - daysUntil(b.ct.han_hoan_thanh));
    const todayIv = DB.lich_phong_van.filter((l) => l.trang_thai === ST.LICH.LEN && toDateStr(l.thoi_gian_bat_dau) === todayStr() && ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an));

    // Việc cần làm theo vai trò
    const tasks = [];
    if (Auth.isQL()) {
      if (c.gopYMoi) tasks.push(['mail', 'tone-violet', `${c.gopYMoi} đề cử có góp ý mới của Ban Giám đốc`, '#/de-cu']);
      if (c.choPhanCong) tasks.push(['userCheck', 'tone-blue', `${c.choPhanCong} vị trí mới tiếp nhận chờ phân công`, '#/du-an?tab=phan-cong']);
      if (c.choDuyet) tasks.push(['send', 'tone-amber', `${c.choDuyet} đề cử chờ bạn duyệt`, '#/de-cu?tab=cho-duyet']);
    } else if (Auth.isStaff()) {
      const mine = DB.de_cu.filter((d) => d.ma_nguoi_tao === u.id);
      const sua = mine.filter((d) => d.trang_thai === ST.DC.SUA).length; const duyet = mine.filter((d) => d.trang_thai === ST.DC.DUYET).length;
      const choPh = mine.filter((d) => d.trang_thai === ST.DC.GUI && !d.phan_hoi_khach_hang).length;
      if (sua) tasks.push(['edit', 'tone-red', `${sua} đề cử cần chỉnh sửa theo yêu cầu Quản lý`, '#/de-cu?tab=can-sua']);
      if (duyet) tasks.push(['send', 'tone-green', `${duyet} đề cử đã duyệt — sẵn sàng gửi khách hàng`, '#/de-cu?tab=da-duyet']);
      if (choPh) tasks.push(['clock', 'tone-amber', `${choPh} đề cử đang chờ khách hàng phản hồi`, '#/de-cu?tab=da-gui']);
    }
    const pvNoResult = DB.lich_phong_van.filter((l) => l.trang_thai === ST.LICH.LEN && new Date(l.thoi_gian_ket_thuc) < now() && ctIds.has(Q.hs(l.ma_ho_so_ung_vien).ma_chi_tiet_du_an)).length;
    if (Auth.canOperate() && pvNoResult) tasks.push(['checkCircle', 'tone-violet', `${pvNoResult} buổi phỏng vấn đã diễn ra chưa ghi nhận kết quả`, '#/phong-van?f=can-ket-qua']);
    const waitHire = hs.filter((h) => h.trang_thai === ST.HS.PV && Q.lichOfHs(h.id).some((l) => Q.kqPv(l.id)?.ket_qua === 'Đạt') && !Q.kqTd(h.id)).length;
    if (Auth.canOperate() && waitHire) tasks.push(['userCheck', 'tone-green', `${waitHire} ứng viên đạt phỏng vấn chờ kết quả tuyển dụng từ khách hàng`, '#/ket-qua?tab=cho']);
    if (Auth.canOperate() && c.choGan) tasks.push(['inbox', 'tone-amber', `${c.choGan} hồ sơ apply chưa đối chiếu được dự án (chờ gán)`, '#/thu-thap?tab=cho-gan']);
    if (Auth.canOperate() && c.chuaChuanHoa) tasks.push(['tag', 'tone-sky', `${c.chuaChuanHoa} hồ sơ mới thu thập chưa chuẩn hóa & gắn thẻ`, '#/ung-vien?norm=no']);

    v.innerHTML = hello + `
      <div class="grid g-4 kpis">
        <div class="card hero-kpi" style="grid-row:span 1"><div class="label">${Auth.isLead() ? 'Vị trí đang tuyển' : 'Vị trí bạn phụ trách'}</div><div class="value">${running.length}</div><a class="btn sm" href="#/du-an">Xem dự án ${icon('arrowRight', 'sm')}</a></div>
        ${kpi('Hồ sơ mới (7 ngày)', newApply, 'Apply từ kênh đăng tuyển', 'users', 'tone-blue', '#/ung-vien')}
        ${kpi('Đang đề cử', hs.filter((h) => h.trang_thai === ST.HS.DECU).length, `${c.choDuyet} chờ duyệt nội bộ`, 'send', 'tone-violet', '#/de-cu')}
        ${kpi('Đang phỏng vấn', hs.filter((h) => h.trang_thai === ST.HS.PV).length, `${todayIv.length} buổi hôm nay`, 'calendar', 'tone-amber', '#/phong-van')}
      </div>
      <div class="grid g-main mt">
        <div class="card"><div class="card-head"><div><h3>Hồ sơ ứng viên theo ngày</h3><p>Hồ sơ apply từ kênh và đề cử được tạo — 14 ngày qua</p></div></div>
          <div class="card-body">${Charts.line({ labels: days.map((d) => d.slice(8) + '/' + d.slice(5, 7)), series: [{ name: 'Hồ sơ apply', data: applyByDay, color: '#0a6cff' }, { name: 'Đề cử', data: dcByDay, color: '#22b4e6' }] })}</div></div>
        <div class="card"><div class="card-head"><div><h3>Việc cần làm</h3><p>Ưu tiên xử lý trong hôm nay</p></div></div>
          <div class="card-body">${tasks.length ? tasks.map(([ic, tone, t, href]) => `<a class="alert" href="${href}" style="text-decoration:none;color:inherit"><span class="ico ${tone}">${icon(ic, 'sm')}</span><div class="tt">${t}</div></a>`).join('') : emptyState('Không có việc tồn đọng 🎉', 'checkCircle')}</div></div>
      </div>
      <div class="grid g-3 mt" style="grid-template-columns:${innerWidth > 1024 ? 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)' : ''}">
        <div class="card"><div class="card-head"><div><h3>Cảnh báo hạn hoàn thành</h3><p>Sắp đến hạn (≤ 3 ngày) hoặc quá hạn</p></div></div>
          <div class="card-body">${alerts.length ? alerts.slice(0, 6).map(({ ct, dl }) => `<a class="alert" href="#/du-an/${ct.id}" style="text-decoration:none;color:inherit"><span class="ico tone-${dl.level}">${icon('clock', 'sm')}</span><div style="flex:1;min-width:0"><div class="tt">${esc(ct.vi_tri)}</div><div class="ds">${esc(Q.khOfCt(ct).ten_cong_ty)}</div><div class="row mt-sm" style="gap:6px"><span class="badge sm ${dl.level}">${dl.text}</span><span class="small t2">${Q.hired(ct.id)}/${ct.so_luong} nhận việc</span></div></div></a>`).join('') : emptyState('Không có dự án sắp/quá hạn', 'checkCircle')}</div></div>
        <div class="card"><div class="card-head"><div><h3>Nguồn hồ sơ apply</h3><p>Phân bổ theo kênh đăng tuyển</p></div></div><div class="card-body">${Charts.bars({ data: bySource })}</div></div>
        <div class="card"><div class="card-head"><div><h3>Vị trí đang mở theo khách hàng</h3><p>Không tính vị trí đã kết thúc</p></div></div><div class="card-body">${Charts.donut({ data: byKh, center: 'vị trí', size: 190 })}</div></div>
      </div>
      ${todayIv.length ? `<div class="card mt"><div class="card-head"><h3>${icon('calendar')} Lịch phỏng vấn hôm nay</h3><a class="btn sm" href="#/phong-van">Xem tất cả</a></div><div class="card-body">${todayIv.map((l) => Comp.ivCard(l)).join('')}</div></div>` : ''}`;
    $$('[data-href]', v).forEach((el) => (el.onclick = () => Router.go(el.dataset.href)));
    Comp.bindIv(v);
  },
  admin(v, hello) {
    const ns = DB.nhan_su; const byRole = groupBy(ns.filter((n) => n.trang_thai_lam_viec === 'Đang làm việc'), (n) => n.vai_tro);
    v.innerHTML = hello + `<div class="grid g-4 kpis">
      ${[[ROLES.ADMIN, 'shield', 'tone-violet'], [ROLES.BGD, 'star', 'tone-amber'], [ROLES.QL, 'userCheck', 'tone-blue'], [ROLES.NV, 'users', 'tone-green']].map(([r, ic, t]) => `<div class="card kpi"><div><div class="label">${r}</div><div class="value">${(byRole[r] || []).length}</div><div class="sub">tài khoản đang hoạt động</div></div><div class="ico ${t}">${icon(ic)}</div></div>`).join('')}</div>
      <div class="grid g-2 mt">
        <div class="card"><div class="card-head"><h3>Tài khoản theo khu vực</h3></div><div class="card-body">${Charts.bars({ data: DB.khu_vuc.map((k) => ({ label: k.ten, value: ns.filter((n) => n.ma_khu_vuc === k.id && n.trang_thai_lam_viec === 'Đang làm việc').length })) })}</div></div>
        <div class="card"><div class="card-head"><h3>Tác vụ quản trị</h3></div><div class="card-body stack">
          <a class="alert" href="#/tai-khoan" style="text-decoration:none;color:inherit"><span class="ico tone-blue">${icon('plus', 'sm')}</span><div><div class="tt">Thêm tài khoản cho nhân sự mới</div><div class="ds">Mật khẩu khởi tạo được sinh tự động & mã hóa</div></div></a>
          <a class="alert" href="#/tai-khoan" style="text-decoration:none;color:inherit"><span class="ico tone-violet">${icon('shield', 'sm')}</span><div><div class="tt">Phân quyền truy cập theo vai trò</div><div class="ds">Quản trị viên · Ban Giám đốc · Quản lý · Nhân viên</div></div></a>
          <a class="alert" href="#/danh-muc" style="text-decoration:none;color:inherit"><span class="ico tone-green">${icon('layers', 'sm')}</span><div><div class="tt">Danh mục dùng chung</div><div class="ds">Khu vực, lĩnh vực, cấp bậc, chuyên môn, kênh đăng tuyển</div></div></a>
          <div class="callout">${icon('info', 'sm')}<div>Theo BR2-4, tài khoản đã phát sinh dữ liệu không bị xóa mà chuyển “Đã nghỉ việc” — tài khoản này không thể đăng nhập.</div></div>
        </div></div></div>`;
  },
};

/* ============ DỰ ÁN TUYỂN DỤNG (UC_04, UC_05) ============ */
Pages.projects = {
  state: { q: '', page: 1, tab: 'vi-tri', st: '', kh: '', da: '', cb: '', cm: '', kv: '', han_tu: '', han_den: '', adv: false, sort: 'han' },
  render(v, p, query) {
    const s = this.state; if (query.tab) s.tab = query.tab; if (query.st !== undefined) s.st = query.st;
    const cts = Q.visibleCts(); const choPc = DB.chi_tiet_du_an.filter((c) => c.trang_thai === ST.CT.MOI);
    v.innerHTML = `<div class="page-head"><div><h1>Dự án tuyển dụng</h1><p>Mỗi dự án tuyển dụng của khách hàng gồm một hoặc nhiều vị trí (chi tiết dự án) — theo dõi tiến độ & thời hạn.</p></div>
      <div class="actions"><button class="btn" id="xls">${icon('download', 'sm')} Xuất Excel</button>${Auth.canOperate() ? `<button class="btn" id="newDa">${icon('briefcase', 'sm')} Tạo dự án tuyển dụng</button><button class="btn primary" id="newCt">${icon('plus', 'sm')} Tiếp nhận yêu cầu (thêm vị trí)</button>` : ''}</div></div>
      <div class="grid g-4 kpis mb">
        ${[['Tổng vị trí', cts.length, '', ''], ['Đang thực hiện', cts.filter((c) => c.trang_thai === ST.CT.DANG).length, 'tone-blue', ST.CT.DANG], ['Sắp hết hạn / quá hạn', cts.filter((c) => Q.deadline(c)).length, 'tone-red', 'canh-bao'], ['Hoàn thành', cts.filter((c) => c.trang_thai === ST.CT.XONG).length, 'tone-green', ST.CT.XONG]]
          .map(([l, n, t, st]) => `<div class="card kpi clickable" data-st="${st}"><div><div class="label">${l}</div><div class="value">${pad(n)}</div></div>${t ? `<div class="ico ${t}">${icon(t === 'tone-red' ? 'clock' : t === 'tone-green' ? 'checkCircle' : 'briefcase')}</div>` : ''}</div>`).join('')}
      </div>
      <div class="tabs">${[['vi-tri', 'Vị trí tuyển dụng'], ['du-an', 'Dự án tuyển dụng'], ...(Auth.isQL() ? [['phan-cong', `Chờ phân công (${choPc.length})`]] : [])].map(([k, l]) => `<button data-tab="${k}" class="${s.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div id="tabBody"></div>`;
    $$('[data-tab]', v).forEach((b) => (b.onclick = () => { s.tab = b.dataset.tab; s.page = 1; UI.refresh(); }));
    $$('[data-st]', v).forEach((b) => (b.onclick = () => { s.tab = 'vi-tri'; s.st = b.dataset.st; s.page = 1; UI.refresh(); }));
    $('#newCt') && ($('#newCt').onclick = () => Dlg.position());
    $('#newDa') && ($('#newDa').onclick = () => Dlg.project());
    const body = $('#tabBody');
    if (s.tab === 'du-an') return this.parents(body);
    if (s.tab === 'phan-cong' && Auth.isQL()) return this.assignQueue(body, choPc);
    this.positions(body, cts);
  },
  positions(body, cts) {
    const s = this.state;
    let rows = cts.filter((c) => {
      const kh = Q.khOfCt(c);
      if (s.q && !norm([c.vi_tri, Code.ct(c.id), kh.ten_cong_ty, Q.da(c.ma_du_an).ten_du_an].join(' ')).includes(norm(s.q))) return false;
      if (s.st === 'canh-bao') { if (!Q.deadline(c)) return false; } else if (s.st && c.trang_thai !== s.st) return false;
      if (s.kh && kh.id !== Number(s.kh)) return false; if (s.cb && c.ma_cap_bac !== Number(s.cb)) return false;
      if (s.cm && c.ma_chuyen_mon !== Number(s.cm)) return false; if (s.kv && c.ma_khu_vuc !== Number(s.kv)) return false;
      if (s.da && c.ma_du_an !== Number(s.da)) return false; // UC_04 6e: lọc theo dự án tuyển dụng & hạn hoàn thành
      if (s.han_tu && c.han_hoan_thanh < s.han_tu) return false; if (s.han_den && c.han_hoan_thanh > s.han_den) return false;
      return true;
    });
    const order = { [ST.CT.MOI]: 0, [ST.CT.DANG]: 1, [ST.CT.XONG]: 2, [ST.CT.DONG]: 3, [ST.CT.HUY]: 4 };
    rows.sort(s.sort === 'moi' ? (a, b) => b.ngay_tao.localeCompare(a.ngay_tao) : (a, b) => order[a.trang_thai] - order[b.trang_thai] || a.han_hoan_thanh.localeCompare(b.han_hoan_thanh));
    this._rows = rows;
    const pg = paginate(rows, s.page, 10);
    body.innerHTML = `<div class="card">
      <div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo vị trí, ID vị trí (VT…), khách hàng…" value="${esc(s.q)}"></div>
        <select class="select" id="st" style="width:auto">${[['', 'Tất cả trạng thái'], ['canh-bao', '⚠ Sắp/quá hạn'], ...Object.values(ST.CT).map((x) => [x, x])].map(([a, b]) => `<option value="${a}" ${s.st === a ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <button class="btn ${s.adv ? 'outline-primary' : ''}" id="adv">${icon('filter', 'sm')} Lọc nâng cao</button>
        <div class="seg"><button data-sort="han" class="${s.sort === 'han' ? 'active' : ''}">Theo hạn</button><button data-sort="moi" class="${s.sort === 'moi' ? 'active' : ''}">Mới nhất</button></div></div>
      ${s.adv ? `<div class="filter-panel">
        ${Form.field('Khách hàng', 'kh', { opts: Form.opts('khach_hang', { blank: 'Tất cả' }).map(([a, b]) => [a, b]), value: s.kh })}
        ${Form.field('Cấp bậc', 'cb', { opts: Form.opts('cap_bac', { blank: 'Tất cả' }), value: s.cb })}
        ${Form.field('Chuyên môn', 'cm', { opts: Form.opts('chuyen_mon', { blank: 'Tất cả' }), value: s.cm })}
        ${Form.field('Khu vực', 'kv', { opts: Form.opts('khu_vuc', { blank: 'Tất cả' }), value: s.kv })}
        ${Form.field('Dự án tuyển dụng', 'da', { opts: [['', 'Tất cả'], ...DB.du_an_tuyen_dung.filter((d) => !s.kh || d.ma_khach_hang === Number(s.kh)).map((d) => [d.id, `${Code.da(d.id)} · ${d.ten_du_an}`])], value: s.da })}
        ${Form.field('Hạn hoàn thành từ', 'han_tu', { type: 'date', value: s.han_tu })}
        ${Form.field('Hạn hoàn thành đến', 'han_den', { type: 'date', value: s.han_den })}</div>` : ''}
      <div class="table-wrap"><table class="table responsive"><thead><tr><th class="stt">STT</th><th>Vị trí tuyển dụng</th><th>ID vị trí</th><th>Khách hàng</th><th>Thời hạn</th><th>Tiến độ</th><th>Phụ trách</th><th>Trạng thái</th></tr></thead><tbody>
      ${pg.rows.map((c, i) => { const kh = Q.khOfCt(c); const h = Q.hired(c.id); const pct = Math.min(100, Math.round((h / c.so_luong) * 100)); const dl = Q.deadline(c); const asg = Q.assignees(c.id);
        return `<tr class="clickable" data-id="${c.id}">
          <td class="stt">${(pg.page - 1) * 10 + i + 1}</td>
          <td class="cell-main" data-label="Vị trí"><div class="t-title">${esc(c.vi_tri)}</div><div class="t-sub">${esc(Store.name('cap_bac', c.ma_cap_bac))} · ${esc(Store.name('khu_vuc', c.ma_khu_vuc))} · cập nhật ${relTime(c.ngay_tao)}</div></td>
          <td data-label="ID vị trí"><span class="code">${Code.ct(c.id)}</span></td>
          <td data-label="Khách hàng">${esc(kh.ten_cong_ty)}<div class="t-sub">${esc(Q.da(c.ma_du_an).ten_du_an)}</div></td>
          <td data-label="Hạn hoàn thành" class="nowrap">${fmtDate(c.han_hoan_thanh)}${dl ? `<div><span class="badge sm ${dl.level}">${dl.text}</span></div>` : ''}</td>
          <td data-label="Tiến độ" style="min-width:150px"><div class="prog-meta"><span>${pct}%</span><span>${h}/${c.so_luong} nhận việc</span></div>${progressBar(pct, pct >= 100 ? 'green' : dl?.level === 'red' ? 'red' : '')}</td>
          <td data-label="Phụ trách">${asg.length ? asg.map((n) => `<span title="${esc(n.ho_ten)}">${avatar(n.ho_ten, 'sm')}</span>`).join(' ') : '<span class="muted small">Chưa phân công</span>'}</td>
          <td data-label="Trạng thái">${badge(c.trang_thai)}</td></tr>`; }).join('') || `<tr><td colspan="8">${emptyState('Không có vị trí phù hợp bộ lọc')}</td></tr>`}
      </tbody></table></div>${pagerHtml(pg, 'vị trí')}</div>`;
    const re = () => { s.page = 1; this.positions(body, cts); };
    $('#q', body).oninput = debounce((e) => { s.q = e.target.value; re(); $('#q', body).focus(); $('#q', body).setSelectionRange(s.q.length, s.q.length); }, 250);
    $('#st', body).onchange = (e) => { s.st = e.target.value; re(); };
    $('#adv', body).onclick = () => { s.adv = !s.adv; re(); };
    $$('[data-sort]', body).forEach((b) => (b.onclick = () => { s.sort = b.dataset.sort; re(); }));
    ['kh', 'da', 'cb', 'cm', 'kv', 'han_tu', 'han_den'].forEach((k) => { const el = $(`[name=${k}]`, body); if (el) el.onchange = () => { s[k] = el.value; if (k === 'kh') s.da = ''; re(); }; });
    $$('tr[data-id]', body).forEach((tr) => (tr.onclick = () => Router.go('#/du-an/' + tr.dataset.id)));
    $$('[data-page]', body).forEach((b) => (b.onclick = () => { s.page = Number(b.dataset.page); this.positions(body, cts); }));
    $('#xls').onclick = () => Export.excel('DanhSachViTri_' + todayStr(), 'Danh sách vị trí tuyển dụng', ['ID', 'Vị trí', 'Khách hàng', 'Dự án tuyển dụng', 'Cấp bậc', 'Khu vực', 'Số lượng', 'Đã nhận việc', 'Hạn', 'Trạng thái', 'Phụ trách'],
      this._rows.map((c) => [Code.ct(c.id), c.vi_tri, Q.khOfCt(c).ten_cong_ty, Q.da(c.ma_du_an).ten_du_an, Store.name('cap_bac', c.ma_cap_bac), Store.name('khu_vuc', c.ma_khu_vuc), c.so_luong, Q.hired(c.id), fmtDate(c.han_hoan_thanh), c.trang_thai, Q.assignees(c.id).map((n) => n.ho_ten).join(', ')]));
  },
  parents(body) {
    const visible = new Set(Q.visibleCts().map((c) => c.ma_du_an));
    const das = DB.du_an_tuyen_dung.filter((d) => Auth.isLead() || visible.has(d.id)).sort((a, b) => b.ngay_tao.localeCompare(a.ngay_tao));
    body.innerHTML = `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Dự án tuyển dụng</th><th>Khách hàng</th><th>Bắt đầu</th><th class="num">Vị trí</th><th class="num">Cần tuyển</th><th>Tiến độ (BR4-5)</th><th>Trạng thái</th></tr></thead><tbody>
      ${das.map((d) => { const cts = DB.chi_tiet_du_an.filter((c) => c.ma_du_an === d.id); return `<tr class="clickable" data-da="${d.id}">
        <td class="cell-main" data-label=""><div class="t-title">${esc(d.ten_du_an)}</div><div class="t-sub">${Code.da(d.id)} · ${esc(d.ghi_chu || '')}</div></td>
        <td data-label="Khách hàng">${esc(Q.kh(d.ma_khach_hang).ten_cong_ty)}</td><td data-label="Bắt đầu">${fmtDate(d.ngay_bat_dau)}</td>
        <td data-label="Vị trí" class="num">${cts.length}</td><td data-label="Cần tuyển" class="num">${sum(cts.filter((c) => c.trang_thai !== ST.CT.HUY).map((c) => c.so_luong))}</td>
        <td data-label="Tiến độ" style="min-width:140px"><div class="prog-meta"><span>${d.tien_do}%</span></div>${progressBar(d.tien_do, d.tien_do >= 100 ? 'green' : '')}</td>
        <td data-label="Trạng thái">${badge(d.trang_thai)}</td></tr>`; }).join('') || `<tr><td colspan="7">${emptyState('Chưa có dự án tuyển dụng')}</td></tr>`}
      </tbody></table></div></div>`;
    $$('[data-da]', body).forEach((tr) => (tr.onclick = () => Dlg.parentDetail(Number(tr.dataset.da))));
  },
  assignQueue(body, list) {
    body.innerHTML = list.length ? `<div class="callout mb">${icon('info', 'sm')}<div>Vị trí chỉ chuyển sang <b>Đang thực hiện</b> khi có ít nhất một nhân viên phụ trách (BR5-3). Hệ thống gợi ý nhân viên <b>cùng khu vực</b> với vị trí trước để thuận tiện đi cùng khách hàng phỏng vấn trực tiếp.</div></div>
      <div class="grid g-2">${list.map((c) => `<div class="card card-pad"><div class="row between"><div><div class="strong">${esc(c.vi_tri)}</div><div class="muted small">${Code.ct(c.id)} · ${esc(Q.khOfCt(c).ten_cong_ty)}</div></div>${badge(c.trang_thai)}</div>
        <dl class="kv mt-sm"><dt>Khu vực</dt><dd>${esc(Store.name('khu_vuc', c.ma_khu_vuc))}</dd><dt>Số lượng</dt><dd>${c.so_luong}</dd><dt>Hạn hoàn thành</dt><dd>${fmtDate(c.han_hoan_thanh)}</dd><dt>Tiếp nhận</dt><dd>${relTime(c.ngay_tao)} bởi ${esc(Q.ns(c.ma_nguoi_tao)?.ho_ten || '—')}</dd></dl>
        <div class="row mt-sm"><button class="btn primary sm" data-assign="${c.id}">${icon('userCheck', 'sm')} Phân công</button><a class="btn sm" href="#/du-an/${c.id}">Xem chi tiết</a></div></div>`).join('')}</div>`
      : `<div class="card">${emptyState('Không có vị trí nào chờ phân công', 'checkCircle')}</div>`;
    $$('[data-assign]', body).forEach((b) => (b.onclick = () => Dlg.assign(Number(b.dataset.assign))));
  },
};

/* ============ CHI TIẾT DỰ ÁN (kanban) ============ */
Pages.projectDetail = {
  tab: 'kanban',
  render(v, { id }) {
    const ct = Q.ct(id); if (!ct) return (v.innerHTML = emptyState('Không tìm thấy dự án'));
    if (!Q.canHandleCt(ct)) return (v.innerHTML = `<div class="card">${emptyState('Bạn không được phân công dự án này (BR4-6).', 'lock')}</div>`);
    const da = Q.da(ct.ma_du_an); const kh = Q.kh(da.ma_khach_hang); const asg = Q.assignees(ct.id); const hired = Q.hired(ct.id); const pct = Math.min(100, Math.round((hired / ct.so_luong) * 100));
    const dl = Q.deadline(ct); const open = !CT_CLOSED.includes(ct.trang_thai);
    const hsList = Q.hsOfCt(ct.id); const col = (st) => hsList.filter((h) => h.trang_thai === st);
    const card = (h) => { const uv = Q.uv(h.ma_ung_vien); const dc = Q.latestDeCu(h.id); const lich = Q.lichOfHs(h.id).filter((l) => l.trang_thai !== ST.LICH.HUY).at(-1); const kq = lich && Q.kqPv(lich.id);
      const bs = [];
      if (!h.ma_tin_kenh) bs.push('<span class="badge sm amber">Chưa apply</span>');
      if (h.trang_thai === ST.HS.DECU && dc) bs.push(badge(dc.phan_hoi_khach_hang || dc.trang_thai, 'sm'));
      if (h.trang_thai === ST.HS.PV && lich) bs.push(kq ? badge(kq.ket_qua, 'sm') : `<span class="badge sm blue">V${lich.vong} · ${fmtDate(lich.thoi_gian_bat_dau)}</span>`);
      if (h.trang_thai === ST.HS.TV) { const k = Q.kqTd(h.id); bs.push(`<span class="badge sm green">Nhận việc ${fmtDate(k?.ngay_nhan_viec)}</span>`); }
      if (!Q.isNormalized(uv)) bs.push('<span class="badge sm sky">Chưa chuẩn hóa</span>');
      return `<div class="kcard" data-hs="${h.id}"><div class="row between"><span class="nm">${esc(uv.ho_ten)}</span><span class="muted small">${Code.hs(h.id)}</span></div>
        <div class="meta">${icon('phone', 'sm')} ${esc(uv.so_dien_thoai)}</div><div class="meta">${icon('clock', 'sm')} ${relTime(Q.history(h.id).at(-1)?.thoi_diem_thay_doi || h.ngay_apply)}</div>${bs.length ? `<div class="badges">${bs.join('')}</div>` : ''}</div>`; };
    const rejected = col(ST.HS.LOAI);
    v.innerHTML = `<div class="crumbs"><a href="#/du-an">Dự án tuyển dụng</a>${icon('chevronRight', 'sm')}<span>${esc(da.ten_du_an)}</span>${icon('chevronRight', 'sm')}<b>${esc(ct.vi_tri)}</b></div>
      <div class="page-head"><div><h1>${esc(ct.vi_tri)} ${badge(ct.trang_thai)}</h1><p class="sub">ID vị trí ${Code.ct(ct.id)} · ${esc(kh.ten_cong_ty)} ${dl ? `· <span class="badge ${dl.level}">${dl.text}</span>` : ''}</p></div>
        <div class="actions">
          ${open && ct.trang_thai === ST.CT.DANG && Auth.canOperate() ? `<a class="btn outline-primary" href="#/ung-vien?ct=${ct.id}">${icon('filter', 'sm')} Lọc ứng viên</a>` : ''}
          ${open && Auth.isQL() ? `<button class="btn" id="asg">${icon('userCheck', 'sm')} ${asg.length ? 'Đổi / thêm phụ trách' : 'Phân công'}</button>` : ''}
          ${open && Q.isCreator(ct) ? `<button class="btn" id="tin">${icon('link', 'sm')} Gắn mã tin đăng</button>` : ''}
          ${open && Q.isCreator(ct) ? `<button class="btn" id="more">${icon('more', 'sm')} Thao tác</button>` : ''}
        </div></div>
      ${ct.trang_thai === ST.CT.MOI ? `<div class="callout amber mb">${icon('alert', 'sm')}<div>Vị trí <b>mới tiếp nhận</b>, chưa có nhân viên phụ trách. ${Auth.isQL() ? 'Hãy phân công để bắt đầu thực hiện.' : 'Chờ Quản lý phân công.'}</div></div>` : ''}
      ${ct.ly_do_dong_huy ? `<div class="callout red mb">${icon('info', 'sm')}<div><b>${ct.trang_thai}</b> — Lý do: ${esc(ct.ly_do_dong_huy)}</div></div>` : ''}
      <div class="grid g-side">
        <div class="card"><div class="card-head" style="padding-bottom:4px"><h3 style="color:var(--primary)">${icon('briefcase')} Thông tin dự án</h3></div><div class="card-body info-list">
          <div class="it"><label>Tiến độ</label><div class="v" style="display:block"><div class="prog-meta"><span><b>${pct}%</b> hoàn thành</span><span>${hired}/${ct.so_luong} đã nhận việc</span></div>${progressBar(pct, pct >= 100 ? 'green' : '')}</div></div>
          <div class="it"><label>Khách hàng</label><div class="v">${icon('building', 'sm')} <a href="#/khach-hang/${kh.id}">${esc(kh.ten_cong_ty)}</a></div></div>
          <div class="it"><label>Dự án tuyển dụng</label><div class="v">${icon('layers', 'sm')} ${esc(da.ten_du_an)} <span class="code">${Code.da(da.id)}</span></div></div>
          <div class="grid g-2" style="gap:10px"><div class="it"><label>Tiếp nhận</label><div class="v">${fmtDate(ct.ngay_tao)}</div></div><div class="it"><label>Hạn hoàn thành</label><div class="v">${fmtDate(ct.han_hoan_thanh)}</div></div></div>
          <div class="grid g-2" style="gap:10px"><div class="it"><label>Cấp bậc</label><div class="v">${esc(Store.name('cap_bac', ct.ma_cap_bac))}</div></div><div class="it"><label>Khu vực</label><div class="v">${esc(Store.name('khu_vuc', ct.ma_khu_vuc))}</div></div></div>
          <div class="grid g-2" style="gap:10px"><div class="it"><label>Chuyên môn</label><div class="v">${esc(Store.name('chuyen_mon', ct.ma_chuyen_mon))}</div></div><div class="it"><label>Hình thức</label><div class="v">${esc(ct.hinh_thuc)}</div></div></div>
          <div class="it"><label>Mức lương tối đa</label><div class="v">${fmtMoney(ct.muc_luong_toi_da)}</div></div>
          <div class="it"><label>Nhân sự phụ trách</label><div class="v" style="display:block">${asg.length ? asg.map((n) => `<div class="person" style="margin:4px 0">${avatar(n.ho_ten, 'sm')}<div><div class="nm small">${esc(n.ho_ten)}</div><div class="sb">${esc(n.chuc_vu)} · ${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</div></div></div>`).join('') : '<span class="muted">Chưa phân công</span>'}</div></div>
          <div class="it"><label>Mô tả công việc</label><div class="v" style="display:block;font-size:13px;color:var(--text-2)">${esc(ct.mo_ta_cong_viec || '—')}</div></div>
          <div class="it"><label>Tin đăng (mã tin)</label><div class="v" style="display:block">${DB.tin_dang.filter((t) => t.ma_chi_tiet_du_an === ct.id).map((t) => `<div class="row between small" style="margin:3px 0"><span><span class="code">${esc(t.ma_tin_kenh)}</span> ${esc(Store.get('kenh_dang_tuyen', t.ma_kenh).ten_kenh)}</span>${badge(t.trang_thai, 'sm')}</div>`).join('') || '<span class="muted small">Chưa gắn mã tin — hồ sơ apply sẽ vào danh sách chờ gán</span>'}</div></div>
        </div></div>
        <div>
          <div class="tabs">${[['kanban', 'Quy trình ứng viên'], ['decu', `Danh sách đề cử (${DB.de_cu.filter((d) => hsList.some((h) => h.id === d.ma_ho_so_ung_vien)).length})`], ['phancong', 'Lịch sử phân công']].map(([k, l]) => `<button data-t="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
          <div id="pdBody"></div>
        </div></div>`;
    const body = $('#pdBody');
    if (this.tab === 'kanban') {
      body.innerHTML = `<div class="kanban">
        ${[['c-apply', 'Mới apply', ST.HS.APPLY], ['c-decu', 'Đề cử', ST.HS.DECU], ['c-pv', 'Phỏng vấn', ST.HS.PV], ['c-tv', 'Thử việc', ST.HS.TV]].map(([cls, t, st]) => `<div class="kcol ${cls}"><h4>${t}<span class="n">${col(st).length}</span></h4>${col(st).map(card).join('') || '<div class="muted small" style="padding:6px">Trống</div>'}</div>`).join('')}
      </div>
      <div class="card mt"><div class="card-head"><h3 style="color:var(--red);font-size:14px">${icon('x', 'sm')} Ứng viên từ chối / không phù hợp <span class="badge red sm">${rejected.length}</span></h3></div>
        <div class="card-body">${rejected.length ? `<div class="reject-strip">${rejected.map((h) => { const uv = Q.uv(h.ma_ung_vien); const last = Q.history(h.id).at(-1); return `<div class="kcard" data-hs="${h.id}"><div class="nm">${esc(uv.ho_ten)}</div><div class="meta">${esc(uv.so_dien_thoai)}</div><div class="meta" style="color:var(--red)">${esc((last?.ghi_chu || '').slice(0, 70))}</div></div>`; }).join('')}</div>` : '<span class="muted small">Chưa có</span>'}</div></div>`;
      $$('[data-hs]', body).forEach((c) => (c.onclick = () => Comp.hsDrawer(Number(c.dataset.hs))));
    } else if (this.tab === 'decu') Comp.recTable(body, DB.de_cu.filter((d) => hsList.some((h) => h.id === d.ma_ho_so_ung_vien)), { showCt: false, tab: 'tat-ca' });
    else body.innerHTML = `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Nhân viên</th><th>Khu vực</th><th>Ngày phân công</th><th>Trạng thái</th></tr></thead><tbody>${DB.phan_cong.filter((p) => p.ma_chi_tiet_du_an === ct.id).map((p) => { const n = Q.ns(p.ma_nhan_su); return `<tr><td class="cell-main"><div class="person">${avatar(n.ho_ten, 'sm')}<div class="nm">${esc(n.ho_ten)}</div></div></td><td data-label="Khu vực">${esc(Store.name('khu_vuc', n.ma_khu_vuc))}</td><td data-label="Ngày phân công">${fmtDT(p.ngay_phan_cong)}</td><td data-label="Trạng thái">${badge(p.trang_thai)}</td></tr>`; }).join('') || `<tr><td colspan="4">${emptyState('Chưa có phân công')}</td></tr>`}</tbody></table></div></div>`;
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    $('#asg') && ($('#asg').onclick = () => Dlg.assign(ct.id));
    $('#tin') && ($('#tin').onclick = () => Dlg.posting(ct.id));
    $('#more') && ($('#more').onclick = (e) => {
      e.stopPropagation(); $$('.dropdown').forEach((d) => d.remove());
      const r = e.currentTarget.getBoundingClientRect(); const dd = document.createElement('div'); dd.className = 'dropdown'; dd.style.cssText = `position:fixed;top:${r.bottom + 6}px;right:${Math.max(12, innerWidth - r.right)}px;width:260px`;
      dd.innerHTML = `<div class="menu-item" data-a="edit">${icon('edit', 'sm')} Cập nhật thông tin vị trí</div><div class="menu-item" data-a="dong">${icon('archive', 'sm')} Đóng dự án</div><div class="menu-item" data-a="huy" style="color:var(--red)">${icon('x', 'sm')} Hủy dự án</div>`;
      document.body.appendChild(dd);
      $('[data-a=edit]', dd).onclick = () => { dd.remove(); Dlg.position(ct.id); };
      ['dong', 'huy'].forEach((t) => ($(`[data-a=${t}]`, dd).onclick = () => { dd.remove(); confirmBox({ title: t === 'dong' ? 'Đóng dự án' : 'Hủy dự án', danger: t === 'huy', okText: t === 'dong' ? 'Đóng dự án' : 'Hủy dự án',
        message: `Vị trí <b>${esc(ct.vi_tri)}</b> sẽ chuyển sang “${t === 'dong' ? 'Đã đóng' : 'Đã hủy'}”. Các hồ sơ đang xử lý được giải phóng, đề cử chưa gửi được gỡ, lịch phỏng vấn sắp tới bị hủy, tin đăng được gỡ.`,
        input: { label: 'Lý do', required: true, placeholder: 'VD: Khách hàng tạm dừng tuyển…' }, onOk: (reason) => after(Svc.closePosition(ct.id, t, reason), 'Đã cập nhật trạng thái dự án') }); }));
    });
  },
};

/* ============ COMPONENT DÙNG CHUNG ============ */
const Comp = {
  /** Ngăn kéo hồ sơ ứng tuyển: tóm tắt, thao tác theo trạng thái, lịch sử trạng thái (timeline 4 trường) */
  hsDrawer(hsId) {
    closeAllOverlays();
    const hs = Q.hs(hsId); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an);
    const dcs = Q.deCuOfHs(hs.id); const lichs = Q.lichOfHs(hs.id); const kqtd = Q.kqTd(hs.id);
    const canH = (ct ? Q.canHandleCt(ct) : true) && Auth.canOperate(); const can = canH && !!ct && !CT_CLOSED.includes(ct.trang_thai);
    const lastDc = Q.latestDeCu(hs.id); const lastLich = lichs.filter((l) => l.trang_thai !== ST.LICH.HUY).at(-1); const lastKq = lastLich && Q.kqPv(lastLich.id);
    const acts = [];
    if (can && ct) {
      if (hs.trang_thai === ST.HS.APPLY && ct.trang_thai === ST.CT.DANG) acts.push(`<a class="btn primary sm" href="#/ung-vien?ct=${ct.id}&pick=${uv.id}">${icon('send', 'sm')} Đề cử ứng viên</a>`);
      if (hs.trang_thai === ST.HS.DECU && lastDc) {
        if (lastDc.trang_thai === ST.DC.SUA) acts.push(`<button class="btn primary sm" data-a="resubmit">${icon('edit', 'sm')} Chỉnh sửa & gửi duyệt lại</button>`);
        if (lastDc.trang_thai === ST.DC.DUYET) acts.push(`<button class="btn primary sm" data-a="send">${icon('send', 'sm')} Gửi khách hàng</button>`);
        if (lastDc.trang_thai === ST.DC.GUI && !lastDc.phan_hoi_khach_hang) acts.push(`<button class="btn primary sm" data-a="fb">${icon('mail', 'sm')} Ghi nhận phản hồi KH</button>`);
        if (lastDc.phan_hoi_khach_hang === 'Đồng ý phỏng vấn') acts.push(`<button class="btn primary sm" data-a="iv">${icon('calendar', 'sm')} Lên lịch phỏng vấn</button>`);
        if (lastDc.phan_hoi_khach_hang === 'Cần đề cử đợt tiếp theo') acts.push(`<a class="btn sm" href="#/ung-vien?ct=${ct.id}">${icon('plus', 'sm')} Tạo đợt đề cử tiếp theo</a>`);
        if ([ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(lastDc.trang_thai)) acts.push(`<button class="btn sm" data-a="remove">${icon('undo', 'sm')} Gỡ khỏi danh sách</button>`);
      }
      if (hs.trang_thai === ST.HS.PV) {
        if (lastLich?.trang_thai === ST.LICH.LEN) acts.push(`<button class="btn primary sm" data-a="ivres" data-l="${lastLich.id}">${icon('checkCircle', 'sm')} Ghi nhận kết quả PV</button>`);
        if (!lastLich || lastLich.trang_thai !== ST.LICH.LEN) if (!lastKq || lastKq.ket_qua === 'Cần phỏng vấn thêm') acts.push(`<button class="btn ${lastKq ? 'primary' : ''} sm" data-a="iv">${icon('calendar', 'sm')} ${lastKq ? 'Tạo lịch vòng tiếp theo' : 'Lên lịch phỏng vấn'}</button>`);
        if (lastKq?.ket_qua === 'Đạt' && !kqtd) acts.push(`<button class="btn success sm" data-a="hire">${icon('userCheck', 'sm')} Ghi nhận kết quả tuyển dụng</button>`);
      }
      if ([ST.HS.APPLY, ST.HS.DECU, ST.HS.PV].includes(hs.trang_thai)) acts.push(`<button class="btn ghost sm" data-a="reject" style="color:var(--red)">${icon('x', 'sm')} Loại hồ sơ</button>`);
    }
    if (canH && ct && hs.trang_thai === ST.HS.TV) acts.push(`<button class="btn sm" data-a="probation" style="color:var(--red)">${icon('userX', 'sm')} Thử việc không đạt → trả về kho</button>`);
    if (Auth.isQL() && lastDc?.trang_thai === ST.DC.CHO) acts.push(`<button class="btn success sm" data-a="approve">${icon('check', 'sm')} Duyệt đề cử</button><button class="btn sm" data-a="reqedit">${icon('edit', 'sm')} Yêu cầu chỉnh sửa</button>`);
    if (Auth.isBGD() && lastDc) acts.push(`<button class="btn sm" data-a="gopy">${icon('mail', 'sm')} Góp ý đề cử</button>`);
    if (Auth.canOperate() && !ct && hs.trang_thai === ST.HS.APPLY) acts.push(`<button class="btn primary sm" data-a="assignct">${icon('link', 'sm')} Gán vào dự án</button>`);
    const tl = statusDurations(hs.id).reverse();
    const tone = { [ST.HS.APPLY]: 'sky', [ST.HS.DECU]: 'violet', [ST.HS.PV]: 'amber', [ST.HS.TV]: 'green', [ST.HS.LOAI]: 'red' };
    const m = modal({
      drawer: true, title: `Hồ sơ ứng tuyển ${Code.hs(hs.id)}`,
      body: `<div class="person">${avatar(uv.ho_ten, 'lg')}<div style="min-width:0"><div class="strong" style="font-size:18px">${esc(uv.ho_ten)}</div><div class="muted small">${Code.uv(uv.id)} · ${esc(uv.email)} · ${esc(uv.so_dien_thoai)}</div><div class="row mt-sm" style="gap:6px">${badge(hs.trang_thai)} ${badge(uv.trang_thai)} ${!hs.ma_tin_kenh ? '<span class="badge amber">Chưa apply — chủ động liên hệ</span>' : `<span class="badge outline">Mã tin ${esc(hs.ma_tin_kenh)}</span>`}</div></div></div>
        <div class="callout mt">${icon('briefcase', 'sm')}<div>${ct ? `<a href="#/du-an/${ct.id}"><b>${esc(ct.vi_tri)}</b></a> — ${esc(Q.khOfCt(ct).ten_cong_ty)} <span class="code">${Code.ct(ct.id)}</span>` : '<b>Chưa gán dự án</b> — mã tin chưa đối chiếu được'}<div class="small">Apply/tạo: ${fmtDT(hs.ngay_apply)}</div></div></div>
        ${uv.trang_thai === ST.UV.TV && hs.trang_thai !== ST.HS.TV ? `<div class="callout amber mt-sm">${icon('alert', 'sm')}<div>Ứng viên đã nhận việc ở dự án khác — không còn xuất hiện trong kết quả lọc đề cử.</div></div>` : ''}
        ${acts.length ? `<div class="row mt" style="gap:8px">${acts.join('')}</div>` : ''}
        <div class="row mt-sm"><a class="btn ghost sm" href="#/ung-vien/${uv.id}">${icon('user', 'sm')} Xem hồ sơ ứng viên đầy đủ</a></div>
        ${dcs.length ? `<h4 class="mt">Đề cử</h4>${dcs.map((d) => `<div class="alert"><span class="ico tone-violet">${icon('send', 'sm')}</span><div style="flex:1"><div class="row between"><span class="tt">${esc(d.dot_de_cu)} · ${Code.dc(d.id)}</span>${badge(d.trang_thai, 'sm')}</div>
          <div class="ds">Tạo ${fmtDT(d.ngay_tao)} bởi ${esc(Q.ns(d.ma_nguoi_tao)?.ho_ten)}${d.ma_nguoi_duyet ? ` · Duyệt bởi ${esc(Q.ns(d.ma_nguoi_duyet).ho_ten)}` : ''}${d.ngay_gui_khach_hang ? ` · Gửi KH ${fmtDate(d.ngay_gui_khach_hang)}` : ''}</div>
          <div class="ds">KN ${d.so_nam_kinh_nghiem ?? '—'} năm · Lương mong muốn ${fmtMoney(d.muc_luong_mong_muon)} · Notice ${esc(d.notice_period || '—')}</div>
          ${d.phan_hoi_khach_hang ? `<div class="mt-sm">${badge(d.phan_hoi_khach_hang, 'sm')} <span class="small muted">${fmtDate(d.ngay_phan_hoi)}${d.ly_do_loai ? ' — ' + esc(d.ly_do_loai) : ''}</span></div>` : ''}
          ${d.ghi_chu ? `<div class="ds" style="color:var(--text-2)">${esc(d.ghi_chu)}</div>` : ''}
          ${Q.comments(d.id).map((g) => `<div class="callout amber mt-sm small">${icon('mail', 'sm')}<div><b>Góp ý BGĐ — ${esc(Q.ns(g.ma_nguoi_gop_y)?.ho_ten)}</b> · ${fmtDT(g.ngay_gop_y)} · ${esc(g.trang_thai)}<br>${esc(g.noi_dung)}</div></div>`).join('')}</div></div>`).join('')}` : ''}
        ${lichs.length ? `<h4 class="mt">Phỏng vấn</h4>${lichs.map((l) => { const k = Q.kqPv(l.id); const fbs = Q.feedbacks(l.id); return `<div class="alert"><span class="ico tone-amber">${icon(l.hinh_thuc === 'Trực tuyến' ? 'video' : 'pin', 'sm')}</span><div style="flex:1"><div class="row between"><span class="tt">Vòng ${l.vong} · ${fmtTime(l.thoi_gian_bat_dau)}–${fmtTime(l.thoi_gian_ket_thuc)} ${fmtDate(l.thoi_gian_bat_dau)}</span>${badge(l.trang_thai, 'sm')}</div>
          <div class="ds">${esc(l.hinh_thuc)} · ${esc(l.dia_diem_link)} · NV phỏng vấn: ${esc(Q.ns(l.ma_nhan_su).ho_ten)}</div>
          ${k ? `<div class="mt-sm">${badge(k.ket_qua, 'sm')} <b class="small">${k.diem_danh_gia ?? '—'}/10</b> <span class="small muted">${esc(k.nhan_xet || '')}</span></div>` : ''}
          ${fbs.map((f) => `<div class="ds">💬 <b>${esc(f.nguon_feedback)}:</b> ${esc(f.noi_dung)} <span class="muted">(${fmtDate(f.ngay_gui)})</span></div>`).join('')}
          ${k ? `<button class="btn xs mt-sm" data-fb="${l.id}">${icon('plus', 'sm')} Thêm feedback</button>` : ''}</div></div>`; }).join('')}` : ''}
        ${kqtd ? `<h4 class="mt">Kết quả tuyển dụng</h4><div class="alert"><span class="ico ${kqtd.ket_qua === 'Chấp nhận offer' ? 'tone-green' : 'tone-red'}">${icon('checkCircle', 'sm')}</span><div><div class="tt">${esc(kqtd.ket_qua)}${kqtd.ngay_nhan_viec ? ' · Nhận việc ' + fmtDate(kqtd.ngay_nhan_viec) : ''}</div><div class="ds">KH báo ngày ${fmtDate(kqtd.ngay_khach_hang_bao)} · Email xác nhận: ${esc(kqtd.email_xac_nhan || '—')}${kqtd.ly_do_tu_choi ? ' · Lý do: ' + esc(kqtd.ly_do_tu_choi) : ''}</div></div></div>` : ''}
        <h4 class="mt">Lịch sử trạng thái <span class="muted small" style="font-weight:500">— truy vết thời gian ở từng trạng thái</span></h4>
        <div class="timeline mt-sm">${tl.map((x) => `<div class="tl-item ${tone[x.trang_thai_moi] || ''}"><div><b>${esc(x.trang_thai_moi)}</b><span class="dur">${x.current ? 'đang ở ' : ''}${fmtDur(x.duration)}</span></div><div class="when">${fmtDT(x.thoi_diem_thay_doi)}</div>${x.ghi_chu ? `<div class="note">${esc(x.ghi_chu)}</div>` : ''}</div>`).join('')}</div>`,
      onMount: (mm) => {
        const reopen = () => { Store.save(); UI.refresh(); Comp.hsDrawer(hs.id); };
        const a = (k, fn) => { const b = mm.$(`[data-a=${k}]`); if (b) b.onclick = fn; };
        a('approve', () => { const r = Svc.approveRecommendation(lastDc.id); r.ok ? (toast('Đã duyệt đề cử'), reopen()) : toast(r.error, 'err'); });
        a('reqedit', () => Dlg.requestEdit(lastDc.id, reopen));
        a('resubmit', () => Dlg.resubmit(lastDc.id, reopen));
        a('send', () => Dlg.sendToClient([lastDc.id], reopen));
        a('gopy', () => Dlg.comment(lastDc.id, reopen));
        a('fb', () => Dlg.clientFeedback(lastDc.id, reopen));
        a('iv', () => Dlg.interview(hs.id, null, reopen));
        a('ivres', () => Dlg.interviewResult(lastLich.id, reopen));
        a('hire', () => Dlg.hiring(hs.id, reopen));
        a('probation', () => Dlg.probation(hs.id, reopen));
        a('remove', () => confirmBox({ title: 'Gỡ ứng viên khỏi danh sách đề cử', message: 'Đề cử chuyển “Đã gỡ”, hồ sơ trở về trạng thái trước đó và được ghi lịch sử.', okText: 'Gỡ ứng viên', onOk: () => { const r = Svc.removeRecommendation(lastDc.id); r.ok ? (toast('Đã gỡ khỏi danh sách'), reopen()) : toast(r.error, 'err'); } }));
        a('reject', () => confirmBox({ title: 'Loại hồ sơ', danger: true, okText: 'Loại hồ sơ', message: 'Hồ sơ chuyển “Bị loại”. Đề cử chưa gửi được gỡ, lịch phỏng vấn sắp tới bị hủy.', input: { label: 'Lý do loại', required: true }, onOk: (r) => { const x = Svc.manualStatus(hs.id, ST.HS.LOAI, r); x.ok ? (toast('Đã loại hồ sơ'), reopen()) : (toast(x.error, 'err'), false); } }));
        a('assignct', () => Dlg.assignPending(hs.id, reopen));
        mm.$$('[data-fb]').forEach((b) => (b.onclick = () => confirmBox({ title: 'Thêm feedback của khách hàng', okText: 'Lưu feedback', message: 'Một lịch phỏng vấn có thể có nhiều feedback (BR11-1).', input: { label: 'Nội dung feedback', required: true }, onOk: (t) => { Svc.addFeedback(b.dataset.fb, t); toast('Đã lưu feedback'); reopen(); } })));
      },
    });
    return m;
  },
  /** Ghi chú hiển thị của đề cử: lý do cần chỉnh sửa / lý do loại / ghi chú khác */
  recNote(d) {
    const m = String(d.ghi_chu || '').match(/Yêu cầu sửa \([^)]*\):\s*([^|]+)/g);
    if (d.trang_thai === ST.DC.SUA && m) return m.at(-1).replace(/^Yêu cầu sửa \([^)]*\):\s*/, '').trim();
    if (d.ly_do_loai) return d.ly_do_loai;
    return String(d.ghi_chu || '').split('|').at(-1).trim();
  },
  /** Bảng đề cử theo vai trò & tab (Fix Demo lần 1): STT, cột "Vị trí", nút thao tác chỉ ở đúng tab */
  recTable(root, list, { showCt = true, tab = 'tat-ca' } = {}) {
    list = [...list].sort((a, b) => b.ngay_tao.localeCompare(a.ngay_tao));
    const staff = Auth.canOperate(); const ql = Auth.isQL();
    const bulkSend = staff && tab === 'cho-gui'; const bulkApprove = ql && tab === 'cho-duyet';
    const selectable = bulkSend || bulkApprove;
    const showStatus = tab !== 'phan-hoi';
    const showReply = ['phan-hoi', 'tat-ca'].includes(tab);
    const showNote = ['can-sua', 'phan-hoi'].includes(tab);
    const showGopY = ql;
    const acts = (d, hs) => {
      const b = [`<button class="btn xs" data-open="${hs.id}">Mở hồ sơ</button>`];
      if (staff && Q.canHandleCt(Q.ct(hs.ma_chi_tiet_du_an))) {
        if (d.trang_thai === ST.DC.CHO) b.push(`<button class="btn xs" data-remove="${d.id}">Gỡ</button>`);
        if (d.trang_thai === ST.DC.SUA) b.push(`<button class="btn xs primary" data-resubmit="${d.id}">Sửa & gửi lại</button>`, `<button class="btn xs" data-remove="${d.id}">Gỡ</button>`);
        if (d.trang_thai === ST.DC.DUYET) b.push(`<button class="btn xs primary" data-send="${d.id}">Gửi KH</button>`, `<button class="btn xs" data-remove="${d.id}">Gỡ</button>`);
        if (d.trang_thai === ST.DC.GUI && !d.phan_hoi_khach_hang) b.push(`<button class="btn xs primary" data-reply="${d.id}">Ghi nhận phản hồi</button>`);
      }
      if (ql && d.trang_thai === ST.DC.CHO) b.push(`<button class="btn xs success" data-approve="${d.id}">Duyệt</button>`, `<button class="btn xs" data-reqedit="${d.id}">Yêu cầu sửa</button>`);
      return `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${b.join('')}</div>`;
    };
    const toolbar = selectable || tab !== 'phan-hoi'
      ? `<div class="toolbar"><span class="muted small" id="selInfo">${selectable ? 'Chọn đề cử để thao tác hàng loạt' : ''}</span><div class="grow"></div>
        ${bulkApprove ? `<button class="btn success sm" id="bApprove">${icon('check', 'sm')} Duyệt các đề cử đã chọn</button>` : ''}
        ${bulkSend ? `<button class="btn primary sm" id="bSend">${icon('send', 'sm')} Gửi khách hàng</button>` : ''}
        <button class="btn sm" id="bPrint">${icon('printer', 'sm')} In danh sách</button></div>` : '';
    root.innerHTML = `<div class="card">${toolbar}
      <div class="table-wrap"><table class="table responsive"><thead><tr>${selectable ? '<th style="width:36px"><input type="checkbox" id="all"></th>' : ''}<th class="stt">STT</th><th>Ứng viên</th>${showCt ? '<th>Vị trí</th>' : ''}<th>Đợt</th><th>Người tạo</th>${showStatus ? '<th>Trạng thái</th>' : ''}${showReply ? '<th>Phản hồi KH</th>' : ''}${showNote ? '<th>Ghi chú</th>' : ''}${showGopY ? '<th>Góp ý BGĐ</th>' : ''}<th class="num">Thao tác</th></tr></thead><tbody>
      ${list.map((d, i) => { const hs = Q.hs(d.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an); const gy = Q.comments(d.id); return `<tr>
        ${selectable ? `<td data-label=""><input type="checkbox" data-sel="${d.id}" ${(bulkSend && d.trang_thai !== ST.DC.DUYET) || (bulkApprove && d.trang_thai !== ST.DC.CHO) ? 'disabled' : ''}></td>` : ''}
        <td class="stt">${i + 1}</td>
        <td class="cell-main"><div class="person">${avatar(uv.ho_ten, 'sm')}<div><div class="nm">${esc(uv.ho_ten)}</div><div class="sb">${Code.dc(d.id)} · ${d.so_nam_kinh_nghiem ?? '—'} năm KN · ${fmtMoney(d.muc_luong_mong_muon)}</div></div></div></td>
        ${showCt ? `<td data-label="Vị trí"><a href="#/du-an/${ct.id}">${esc(ct.vi_tri)}</a><div class="t-sub">${Code.ct(ct.id)}</div></td>` : ''}
        <td data-label="Đợt">${esc(d.dot_de_cu)}</td><td data-label="Người tạo">${esc(Q.ns(d.ma_nguoi_tao)?.ho_ten)}<div class="t-sub">${fmtDate(d.ngay_tao)}</div></td>
        ${showStatus ? `<td data-label="Trạng thái">${badge(d.trang_thai === ST.DC.DUYET ? 'Chờ gửi' : d.trang_thai === ST.DC.GUI && !d.phan_hoi_khach_hang ? 'Chờ phản hồi' : d.trang_thai, d.trang_thai === ST.DC.DUYET ? 'green' : d.trang_thai === ST.DC.GUI ? 'blue' : '')}</td>` : ''}
        ${showReply ? `<td data-label="Phản hồi KH">${d.phan_hoi_khach_hang ? badge(d.phan_hoi_khach_hang) : '<span class="muted small">—</span>'}</td>` : ''}
        ${showNote ? `<td data-label="Ghi chú" class="small" style="max-width:260px">${esc(Comp.recNote(d)) || '<span class="muted">—</span>'}</td>` : ''}
        ${showGopY ? `<td data-label="Góp ý BGĐ" class="small" style="max-width:220px">${gy.length ? `<span class="badge sm ${gy.some((g) => g.trang_thai !== 'Đã xem') ? 'amber' : ''}">${gy.length} góp ý</span><div class="t-sub">${esc(gy.at(-1).noi_dung.slice(0, 70))}${gy.at(-1).noi_dung.length > 70 ? '…' : ''}</div>` : '<span class="muted">—</span>'}</td>` : ''}
        <td data-label="">${acts(d, hs)}</td></tr>`; }).join('') || `<tr><td colspan="11">${emptyState('Không có đề cử')}</td></tr>`}
      </tbody></table></div></div>`;
    const sel = () => $$('[data-sel]:checked', root).map((c) => Number(c.dataset.sel));
    const on = (attr, fn) => $$(`[data-${attr}]`, root).forEach((b) => (b.onclick = () => fn(Number(b.dataset[attr]))));
    on('open', (id) => Comp.hsDrawer(id));
    on('remove', (id) => confirmBox({ title: 'Gỡ ứng viên khỏi danh sách đề cử', message: 'Đề cử chuyển “Đã gỡ”, hồ sơ trở về trạng thái trước đó và được ghi lịch sử.', okText: 'Gỡ ứng viên', onOk: () => after(Svc.removeRecommendation(id), 'Đã gỡ khỏi danh sách') }));
    on('resubmit', (id) => Dlg.resubmit(id));
    on('send', (id) => Dlg.sendToClient([id]));
    on('reply', (id) => Dlg.clientFeedback(id));
    on('approve', (id) => after(Svc.approveRecommendation(id), 'Đã duyệt đề cử'));
    on('reqedit', (id) => Dlg.requestEdit(id));
    $('#bPrint', root) && ($('#bPrint', root).onclick = () => { const ids = sel(); Dlg.printRecs(ids.length ? list.filter((d) => ids.includes(d.id)) : list); });
    if (!selectable) return;
    const info = () => ($('#selInfo', root).textContent = `Đã chọn ${sel().length}`);
    $('#all', root).onchange = (e) => { $$('[data-sel]:not([disabled])', root).forEach((c) => (c.checked = e.target.checked)); info(); };
    $$('[data-sel]', root).forEach((c) => (c.onchange = info));
    $('#bApprove', root) && ($('#bApprove', root).onclick = () => { const ids = sel(); if (!ids.length) return toast('Chưa chọn đề cử', 'warn'); let ok = 0; ids.forEach((id) => Svc.approveRecommendation(id).ok && ok++); toast(`Đã duyệt ${ok}/${ids.length} đề cử`, ok ? 'ok' : 'warn'); UI.refresh(); });
    $('#bSend', root) && ($('#bSend', root).onclick = () => { const ids = sel(); if (!ids.length) return toast('Chưa chọn đề cử', 'warn'); Dlg.sendToClient(ids); });
  },
  ivCard(l) {
    const hs = Q.hs(l.ma_ho_so_ung_vien); const uv = Q.uv(hs.ma_ung_vien); const ct = Q.ct(hs.ma_chi_tiet_du_an); const k = Q.kqPv(l.id); const ns = Q.ns(l.ma_nhan_su);
    const past = new Date(l.thoi_gian_ket_thuc) < now();
    const op = Auth.canOperate() && Q.canHandleCt(ct);
    const actions = op
      ? `<button class="btn xs" data-ivhs="${hs.id}">Mở hồ sơ</button>${l.trang_thai === ST.LICH.LEN ? `${past ? `<button class="btn xs primary" data-ivres="${l.id}">${icon('checkCircle', 'sm')} Ghi nhận kết quả</button>` : ''}<button class="btn xs" data-ivedit="${l.id}">${icon('edit', 'sm')} Sửa</button><button class="btn xs" data-ivcancel="${l.id}" style="color:var(--red)">Hủy lịch</button>` : ''}`
      : `<button class="btn xs" data-ivview="${l.id}">${icon('eye', 'sm')} Xem chi tiết phỏng vấn</button>`;
    return `<div class="iv ${l.trang_thai === ST.LICH.XONG ? 'done' : l.trang_thai === ST.LICH.HUY ? 'cancel' : ''}">
      <div class="when"><div class="t">${icon('clock', 'sm')} ${fmtTime(l.thoi_gian_bat_dau)} - ${fmtTime(l.thoi_gian_ket_thuc)}</div><div class="muted small">${icon('calendar', 'sm')} ${fmtDate(l.thoi_gian_bat_dau)} · Vòng ${l.vong}</div></div>
      <div class="body"><div class="row between" style="align-items:flex-start"><div class="person">${avatar(uv.ho_ten)}<div><div class="nm" style="font-size:15px">${esc(uv.ho_ten)}</div><div class="sb">${esc(ct.vi_tri)} — ${esc(Q.khOfCt(ct).ten_cong_ty)}</div><div class="sb">ID vị trí: ${Code.ct(ct.id)}</div></div></div>
        <div class="row" style="gap:6px">${k ? badge(k.ket_qua) : badge(l.trang_thai === ST.LICH.LEN && past ? 'Chờ ghi nhận kết quả' : l.trang_thai, l.trang_thai === ST.LICH.LEN && past ? 'amber' : '')}</div></div>
        <div class="foot"><div><label>${icon(l.hinh_thuc === 'Trực tuyến' ? 'video' : 'pin', 'sm')} ${l.hinh_thuc === 'Trực tuyến' ? 'Họp trực tuyến' : 'Địa điểm trực tiếp'}</label>${l.hinh_thuc === 'Trực tuyến' ? `<a href="${esc(l.dia_diem_link)}" target="_blank" rel="noopener">${esc(l.dia_diem_link)}</a>` : esc(l.dia_diem_link)}</div>
          <div><label>${icon('users', 'sm')} Nhân viên phỏng vấn</label>${esc(ns.ho_ten)} <span class="muted small">(${esc(Store.name('khu_vuc', ns.ma_khu_vuc))})</span></div></div>
        <div class="row mt-sm" style="gap:6px">${actions}</div></div></div>`;
  },
  bindIv(root) {
    $$('[data-ivhs]', root).forEach((b) => (b.onclick = () => Comp.hsDrawer(Number(b.dataset.ivhs))));
    $$('[data-ivres]', root).forEach((b) => (b.onclick = () => Dlg.interviewResult(Number(b.dataset.ivres))));
    $$('[data-ivview]', root).forEach((b) => (b.onclick = () => Dlg.interviewDetail(Number(b.dataset.ivview))));
    $$('[data-ivedit]', root).forEach((b) => (b.onclick = () => { const l = Store.get('lich_phong_van', b.dataset.ivedit); Dlg.interview(l.ma_ho_so_ung_vien, l.id); }));
    $$('[data-ivcancel]', root).forEach((b) => (b.onclick = () => confirmBox({ title: 'Hủy lịch phỏng vấn', danger: true, okText: 'Hủy lịch', message: 'Lịch chuyển “Đã hủy”; hồ sơ vẫn ở trạng thái Phỏng vấn để tạo lịch mới.', input: { label: 'Lý do hủy', required: true }, onOk: (r) => after(Svc.cancelInterview(Number(b.dataset.ivcancel), r), 'Đã hủy lịch') })));
  },
  /** Ô nhập có gợi ý: gõ tên → hiện danh sách để chọn (Fix Demo lần 1) */
  typeahead(input, items, onPick, { max = 8 } = {}) {
    const wrap = input.closest('.ta') || input.parentElement; let box = null; let cur = -1; let shown = [];
    const close = () => { box?.remove(); box = null; cur = -1; };
    const render = () => {
      const q = norm(input.value); shown = items.filter((it) => !q || norm(it.search || it.label + ' ' + (it.sub || '')).includes(q)).slice(0, max);
      close(); box = document.createElement('div'); box.className = 'ta-list';
      box.innerHTML = shown.map((it, i) => `<div class="ta-item" data-i="${i}"><div class="t">${esc(it.label)}</div>${it.sub ? `<div class="s">${esc(it.sub)}</div>` : ''}</div>`).join('') || '<div class="ta-item"><div class="s">Không có kết quả phù hợp</div></div>';
      wrap.appendChild(box);
      $$('[data-i]', box).forEach((el) => el.addEventListener('mousedown', (e) => { e.preventDefault(); pick(shown[Number(el.dataset.i)]); }));
    };
    const pick = (it) => { if (!it) return; input.value = it.label; close(); onPick(it); };
    input.addEventListener('input', () => { onPick(null); render(); });
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', (e) => {
      if (!box) return; const els = $$('[data-i]', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length; els.forEach((x, i) => x.classList.toggle('on', i === cur)); }
      if (e.key === 'Enter' && cur >= 0) { e.preventDefault(); pick(shown[cur]); }
      if (e.key === 'Escape') close();
    });
  },
};
