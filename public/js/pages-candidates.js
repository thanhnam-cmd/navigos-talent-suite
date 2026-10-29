/* ==========================================================
   pages-candidates.js — Kho ứng viên, Lọc nâng cao & Đề cử,
   Chi tiết ứng viên, Thu thập hồ sơ tự động, Danh sách đề cử
   ========================================================== */

/* ============ KHO ỨNG VIÊN + LỌC NÂNG CAO (UC_06, UC_08) ============ */
Pages.candidates = {
  f: { q: '', ct: '', applied: '', exp_min: '', exp_max: '', age_min: '', age_max: '', cap_bac: '', chuyen_mon: '', khu_vuc: '', linh_vuc: '', ky_nang: '', trang_thai: '', normalized: '' },
  adv: false, page: 1, picked: new Set(),
  render(v, p, query) {
    const f = this.f;
    if (query.ct !== undefined) { f.ct = query.ct; this.adv = true; this.picked = new Set(query.pick ? [Number(query.pick)] : []); history.replaceState(null, '', '#/ung-vien'); }
    if (query.norm) { f.normalized = query.norm; history.replaceState(null, '', '#/ung-vien'); }
    const recommendMode = this.adv && !!f.ct;
    const all = DB.ung_vien;
    v.innerHTML = `<div class="page-head"><div><h1>Kho ứng viên</h1><p>Hồ sơ được <b>thu thập tự động</b> từ kênh đăng tuyển & kho dữ liệu sẵn có — nhân viên chuẩn hóa, gắn thẻ và đề cử, không nhập tay.</p></div>
      <div class="actions"><a class="btn" href="#/thu-thap">${icon('refresh', 'sm')} Thu thập hồ sơ</a><button class="btn" id="xls">${icon('download', 'sm')} Xuất Excel</button><button class="btn ${this.adv ? 'outline-primary' : 'primary'}" id="advBtn">${icon('filter', 'sm')} ${this.adv ? 'Tắt lọc nâng cao' : 'Lọc nâng cao & đề cử'}</button></div></div>
      <div class="grid g-4 kpis mb">
        ${[['Tổng hồ sơ trong kho', all.length, 'users', 'tone-blue'], ['Sẵn sàng đề cử (Hoạt động)', all.filter((u) => u.trang_thai === ST.UV.HD).length, 'userCheck', 'tone-green'], ['Đang thử việc', all.filter((u) => u.trang_thai === ST.UV.TV).length, 'briefcase', 'tone-violet'], ['Chưa chuẩn hóa', all.filter((u) => !u.ma_nhan_su && u.trang_thai === ST.UV.HD).length, 'tag', 'tone-amber']]
          .map(([l, n, ic, t]) => `<div class="card kpi"><div><div class="label">${l}</div><div class="value">${n}</div></div><div class="ico ${t}">${icon(ic)}</div></div>`).join('')}</div>
      ${recommendMode ? `<div class="callout mb">${icon('info', 'sm')}<div><b>Chế độ đề cử</b> — chỉ lọc ứng viên <b>Hoạt động</b>; ứng viên đã nhận việc (Đang thử việc) hoặc Lưu trữ <b>không xuất hiện</b> (BR6-7). Ứng viên chưa apply được gắn nhãn <span class="badge sm amber">Chưa apply</span> để chủ động liên hệ khảo sát nguyện vọng.</div></div>` : ''}
      <div class="card"><div class="toolbar"><div class="grow input-ico">${icon('search', 'sm')}<input class="input" id="q" placeholder="Tìm theo tên, email, SĐT, kỹ năng, mã UV…" value="${esc(f.q)}"></div>
        ${!this.adv ? `<select class="select" id="tt" style="width:auto">${[['', 'Mọi trạng thái'], ...Object.values(ST.UV).map((x) => [x, x])].map(([a, b]) => `<option value="${a}" ${f.trang_thai === a ? 'selected' : ''}>${b}</option>`).join('')}</select>
        <select class="select" id="nm" style="width:auto">${[['', 'Chuẩn hóa: tất cả'], ['no', 'Chưa chuẩn hóa'], ['yes', 'Đã chuẩn hóa']].map(([a, b]) => `<option value="${a}" ${f.normalized === a ? 'selected' : ''}>${b}</option>`).join('')}</select>` : ''}</div>
        ${this.adv ? `<form class="filter-panel" id="fp" onsubmit="return false">
          <div class="field" style="grid-column:span 2"><label>ID dự án (vị trí cần đề cử)</label><select class="select" name="ct">${ctOpts().map(([a, b]) => `<option value="${a}" ${String(a) === String(f.ct) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div>
          ${Form.field('Trạng thái apply', 'applied', { opts: [['', 'Tất cả'], ['yes', 'Đã apply dự án này'], ['no', 'Chưa apply dự án này']], value: f.applied })}
          ${Form.field('Kỹ năng', 'ky_nang', { value: f.ky_nang, ph: 'VD: Java' })}
          <div class="field"><label>Số năm kinh nghiệm</label><div class="range"><input class="input" name="exp_min" type="number" min="0" placeholder="Từ" value="${esc(f.exp_min)}"><input class="input" name="exp_max" type="number" min="0" placeholder="Đến" value="${esc(f.exp_max)}"></div></div>
          <div class="field"><label>Độ tuổi</label><div class="range"><input class="input" name="age_min" type="number" placeholder="Từ" value="${esc(f.age_min)}"><input class="input" name="age_max" type="number" placeholder="Đến" value="${esc(f.age_max)}"></div></div>
          ${Form.field('Cấp bậc', 'cap_bac', { opts: Form.opts('cap_bac', { blank: 'Tất cả' }), value: f.cap_bac })}
          ${Form.field('Chuyên môn', 'chuyen_mon', { opts: Form.opts('chuyen_mon', { blank: 'Tất cả' }), value: f.chuyen_mon })}
          ${Form.field('Khu vực', 'khu_vuc', { opts: Form.opts('khu_vuc', { blank: 'Tất cả' }), value: f.khu_vuc })}
          ${Form.field('Lĩnh vực', 'linh_vuc', { opts: Form.opts('linh_vuc', { blank: 'Tất cả' }), value: f.linh_vuc })}
          <div class="field" style="display:flex;align-items:flex-end;gap:8px"><button type="button" class="btn" id="byCt" ${f.ct ? '' : 'disabled'} title="Điền tiêu chí theo yêu cầu của vị trí">${icon('zap', 'sm')} Theo yêu cầu vị trí</button><button type="button" class="btn ghost" id="reset">Xóa lọc</button></div>
        </form>` : ''}
        <div id="list"></div></div>
      <div id="selbar"></div>`;
    this.bind(v);
    this.list();
  },
  bind(v) {
    const f = this.f;
    $('#advBtn', v).onclick = () => { this.adv = !this.adv; if (!this.adv) { f.ct = ''; this.picked.clear(); } this.page = 1; UI.refresh(); };
    $('#q', v).oninput = debounce((e) => { f.q = e.target.value; this.page = 1; this.list(); }, 250);
    $('#tt', v) && ($('#tt', v).onchange = (e) => { f.trang_thai = e.target.value; this.page = 1; this.list(); });
    $('#nm', v) && ($('#nm', v).onchange = (e) => { f.normalized = e.target.value; this.page = 1; this.list(); });
    const fp = $('#fp', v);
    if (fp) {
      $$('[name]', fp).forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', debounce(() => { Object.assign(f, Form.values(fp)); if (el.name === 'ct') { this.picked.clear(); $('#byCt', v).disabled = !f.ct; } this.page = 1; this.list(); }, 200)));
      $('#reset', v).onclick = () => { Object.keys(f).forEach((k) => k !== 'ct' && (f[k] = '')); UI.refresh(); };
      $('#byCt', v).onclick = () => { const ct = Q.ct(f.ct); Object.assign(f, { chuyen_mon: ct.ma_chuyen_mon, cap_bac: '', khu_vuc: ct.ma_khu_vuc }); UI.refresh(); toast('Đã áp dụng chuyên môn & khu vực của vị trí. Kết quả được xếp theo độ phù hợp.', 'info'); };
    }
    $('#xls', v).onclick = () => Export.excel('KhoUngVien_' + todayStr(), 'Kho ứng viên', ['Mã', 'Họ tên', 'Email', 'SĐT', 'Năm sinh', 'Kinh nghiệm', 'Cấp bậc', 'Chuyên môn', 'Khu vực', 'Kỹ năng', 'Nguồn', 'Trạng thái'],
      this._rows.map(({ uv: u }) => [Code.uv(u.id), u.ho_ten, u.email, u.so_dien_thoai, u.nam_sinh || '', u.so_nam_kinh_nghiem ?? '', Store.name('cap_bac', u.ma_cap_bac), Store.name('chuyen_mon', u.ma_chuyen_mon), Store.name('khu_vuc', u.ma_khu_vuc), u.ky_nang, u.nguon, u.trang_thai]));
  },
  list() {
    const f = this.f; const box = $('#list'); if (!box) return;
    const recommend = this.adv && !!f.ct;
    const rows = Svc.filterCandidates({ ...f, ct: this.adv ? f.ct : '', forRecommend: this.adv, trang_thai: this.adv ? '' : f.trang_thai });
    this._rows = rows;
    const pg = paginate(rows, this.page, 12);
    const fitTone = (x) => (x >= 75 ? ['var(--green-50)', 'var(--green)'] : x >= 50 ? ['var(--amber-50)', 'var(--amber)'] : ['var(--slate-50)', 'var(--text-2)']);
    const blocked = (r) => r.hs && [ST.HS.PV, ST.HS.TV, ST.HS.LOAI].includes(r.hs.trang_thai) || (r.hs && DB.de_cu.some((d) => d.ma_ho_so_ung_vien === r.hs.id && [ST.DC.CHO, ST.DC.SUA, ST.DC.DUYET].includes(d.trang_thai)));
    box.innerHTML = `<div class="table-wrap"><table class="table responsive"><thead><tr>${recommend ? '<th style="width:36px"></th>' : ''}<th>Ứng viên</th>${recommend ? '<th>Độ phù hợp</th>' : ''}<th>Chuyên môn · Cấp bậc</th><th>Kinh nghiệm</th><th>Khu vực</th><th>Kỹ năng</th><th>${recommend ? 'Với dự án này' : 'Trạng thái'}</th></tr></thead><tbody>
      ${pg.rows.map((r) => { const u = r.uv; const age = Q.age(u); const blk = recommend && blocked(r); const [bg, fg] = fitTone(r.fit ?? 0);
        return `<tr class="clickable" data-uv="${u.id}">
        ${recommend ? `<td data-label="Chọn"><input type="checkbox" data-pick="${u.id}" ${this.picked.has(u.id) ? 'checked' : ''} ${blk ? 'disabled title="Hồ sơ đang được xử lý ở dự án này"' : ''} style="width:18px;height:18px;accent-color:var(--primary)"></td>` : ''}
        <td class="cell-main"><div class="person">${avatar(u.ho_ten)}<div style="min-width:0"><div class="nm">${esc(u.ho_ten)} ${!Q.isNormalized(u) ? '<span class="badge sm sky">Chưa chuẩn hóa</span>' : ''}</div><div class="sb">${Code.uv(u.id)} · ${age ? age + ' tuổi · ' : ''}${esc(u.so_dien_thoai)}</div></div></div></td>
        ${recommend ? `<td data-label="Độ phù hợp"><span class="fit"><span class="ring" style="background:${bg};color:${fg}">${r.fit}%</span></span></td>` : ''}
        <td data-label="Chuyên môn">${esc(Store.name('chuyen_mon', u.ma_chuyen_mon))}<div class="t-sub">${esc(Store.name('cap_bac', u.ma_cap_bac))}</div></td>
        <td data-label="Kinh nghiệm" class="nowrap">${u.so_nam_kinh_nghiem ?? '—'} năm</td><td data-label="Khu vực">${esc(Store.name('khu_vuc', u.ma_khu_vuc))}</td>
        <td data-label="Kỹ năng" style="max-width:240px">${String(u.ky_nang || '').split(',').filter(Boolean).slice(0, 3).map((s) => `<span class="tag">${esc(s.trim())}</span>`).join('')}</td>
        <td data-label="${recommend ? 'Với dự án' : 'Trạng thái'}">${recommend ? (r.hs ? badge(r.hs.trang_thai) + (r.hs.ma_tin_kenh ? '' : ' <span class="badge sm amber">Chưa apply</span>') : '<span class="badge amber">Chưa apply</span>') : badge(u.trang_thai)}</td></tr>`; }).join('') || `<tr><td colspan="8">${emptyState(this.adv ? 'Không có ứng viên “Hoạt động” phù hợp tiêu chí. Hãy điều chỉnh bộ lọc (4a).' : 'Không có ứng viên phù hợp')}</td></tr>`}
      </tbody></table></div>${pagerHtml(pg, 'ứng viên')}`;
    $$('tr[data-uv]', box).forEach((tr) => (tr.onclick = (e) => { if (e.target.closest('input')) return; Router.go('#/ung-vien/' + tr.dataset.uv); }));
    $$('[data-pick]', box).forEach((c) => (c.onchange = () => { const id = Number(c.dataset.pick); c.checked ? this.picked.add(id) : this.picked.delete(id); this.selbar(); }));
    $$('[data-page]', box).forEach((b) => (b.onclick = () => { this.page = Number(b.dataset.page); this.list(); }));
    this.selbar();
  },
  selbar() {
    const bar = $('#selbar'); if (!bar) return; const f = this.f;
    if (!(this.adv && f.ct)) return (bar.innerHTML = '');
    const ct = Q.ct(f.ct);
    bar.innerHTML = `<div class="selbar"><div><b>${this.picked.size}</b> ứng viên đã chọn cho <b>${esc(ct.vi_tri)}</b> <span class="code" style="background:rgba(255,255,255,.15);color:#fff">${Code.ct(ct.id)}</span></div><div class="row"><button class="btn sm" id="clr" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">Bỏ chọn</button><button class="btn primary sm" id="mk">${icon('send', 'sm')} Tạo đề cử</button></div></div>`;
    $('#clr').onclick = () => { this.picked.clear(); this.list(); };
    $('#mk').onclick = () => this.createDialog(ct);
  },
  createDialog(ct) {
    if (!this.picked.size) return toast('Chưa tick chọn ứng viên nào (5a).', 'warn');
    const ids = [...this.picked]; const nextDot = 'Đợt ' + (new Set(DB.de_cu.filter((d) => Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an === ct.id).map((d) => d.dot_de_cu)).size || 1);
    const m = modal({ size: 'lg', title: `Tạo đề cử — ${esc(ct.vi_tri)}`, foot: '<button class="btn" data-close>Hủy</button><button class="btn primary" data-submit>Tạo đề cử (gửi Quản lý duyệt)</button>',
      body: `<form novalidate><div class="form-grid">${Form.field('Đợt đề cử', 'dot_de_cu', { req: true, value: nextDot, hint: 'Mỗi hồ sơ chỉ có một đề cử trong mỗi đợt (BR6-1).' })}${Form.field('Ghi chú chung', 'ghi_chu', { ph: 'Nhận định chung về danh sách' })}</div>
        <div class="table-wrap mt"><table class="table"><thead><tr><th>Ứng viên</th><th>Năm KN</th><th>Lương mong muốn (VND)</th><th>Notice period</th></tr></thead><tbody>
        ${ids.map((id) => { const u = Q.uv(id); const hs = DB.ho_so_ung_tuyen.find((h) => h.ma_ung_vien === id && h.ma_chi_tiet_du_an === ct.id); return `<tr><td><div class="nm small strong">${esc(u.ho_ten)}</div><div class="t-sub">${hs ? (hs.ma_tin_kenh ? 'Đã apply' : 'Đã có hồ sơ') : '<span style="color:var(--amber)">Chưa apply → hệ thống tạo hồ sơ ứng tuyển</span>'}</div></td>
          <td><input class="input" style="width:80px" name="exp_${id}" type="number" step="0.5" value="${u.so_nam_kinh_nghiem ?? ''}"></td><td><input class="input" name="sal_${id}" type="number" placeholder="VD: 30000000"></td><td><input class="input" name="np_${id}" value="30 ngày"></td></tr>`; }).join('')}</tbody></table></div>
        <div class="callout mt">${icon('info', 'sm')}<div>Đề cử lưu ở trạng thái <b>Chờ duyệt</b>; hồ sơ chuyển <b>Đề cử</b> và được ghi lịch sử. Chỉ đề cử đã được Quản lý duyệt mới được gửi khách hàng.</div></div></form>` });
    submitForm(m, (v) => {
      const per = {}; ids.forEach((id) => (per[id] = { exp: v['exp_' + id] === '' ? null : Number(v['exp_' + id]), salary: v['sal_' + id], notice: v['np_' + id] }));
      const r = Svc.createRecommendations(ct.id, ids, { dot_de_cu: v.dot_de_cu, ghi_chu: v.ghi_chu, per });
      if (r.errors) return r;
      if (r.skipped?.length) toast('Bỏ qua: ' + r.skipped.map(esc).join('<br>'), 'warn', 7000);
      if (r.ok) { toast(`Đã tạo ${r.created.length} đề cử — chờ Quản lý duyệt`); m.close(); this.picked.clear(); Store.save(); Pages.projectDetail.tab = 'decu'; Router.go('#/du-an/' + ct.id); }
      return r.ok ? r : { ok: false, error: r.error };
    });
  },
};

/* ============ CHI TIẾT ỨNG VIÊN ============ */
Pages.candidateDetail = {
  render(v, { id }) {
    const u = Q.uv(id); if (!u) return (v.innerHTML = `<div class="card">${emptyState('Không tìm thấy ứng viên (có thể đã được gộp hồ sơ)')}</div>`);
    const hsList = Q.hsOfUv(u.id).sort((a, b) => b.ngay_apply.localeCompare(a.ngay_apply));
    const fld = (l, val) => `<dt>${l}</dt><dd>${val || '<span class="muted">—</span>'}</dd>`;
    v.innerHTML = `<div class="crumbs"><a href="#/ung-vien">Kho ứng viên</a>${icon('chevronRight', 'sm')}<b>${esc(u.ho_ten)}</b></div>
      <div class="page-head"><div class="person">${avatar(u.ho_ten, 'lg')}<div><h1>${esc(u.ho_ten)}</h1><p>${Code.uv(u.id)} · Nguồn: ${esc(u.nguon || '—')} · Vào kho ${fmtDate(u.ngay_tao)}</p><div class="row mt-sm">${badge(u.trang_thai)} ${Q.isNormalized(u) ? `<span class="badge green">Đã chuẩn hóa bởi ${esc(Q.ns(u.ma_nhan_su)?.ho_ten)}</span>` : '<span class="badge sky">Chưa chuẩn hóa</span>'}</div></div></div>
        <div class="actions">
          <button class="btn primary" id="norm">${icon('tag', 'sm')} ${Q.isNormalized(u) ? 'Cập nhật & gắn thẻ' : 'Chuẩn hóa & gắn thẻ'}</button>
          ${u.trang_thai === ST.UV.HD ? `<button class="btn" id="rec">${icon('send', 'sm')} Đề cử vào dự án</button><button class="btn" id="arch">${icon('archive', 'sm')} Lưu trữ / hết nhu cầu</button>` : ''}
          ${u.trang_thai === ST.UV.LT ? `<button class="btn" id="unarch">${icon('undo', 'sm')} Kích hoạt lại</button>` : ''}
        </div></div>
      ${u.trang_thai === ST.UV.TV ? `<div class="callout green mb">${icon('userCheck', 'sm')}<div>Ứng viên <b>đã nhận việc</b> (Đang thử việc) — đã được loại khỏi mọi danh sách khuyến nghị/đề cử và không xuất hiện trong kết quả lọc. Nếu thử việc không đạt, dùng thao tác “Thử việc không đạt” trên hồ sơ ứng tuyển để đưa về kho.</div></div>` : ''}
      ${u.trang_thai === ST.UV.LT ? `<div class="callout mb">${icon('archive', 'sm')}<div>Hồ sơ <b>lưu trữ</b> — không được lọc/đề cử và không liên hệ mời tuyển. Lịch sử đề cử, phỏng vấn vẫn được giữ (BR8-3).</div></div>` : ''}
      <div class="grid g-main">
        <div class="stack" style="gap:18px">
          <div class="card"><div class="card-head"><h3>${icon('user')} Thông tin & thẻ phân loại</h3></div><div class="card-body"><dl class="kv">
            ${fld('Email', esc(u.email))}${fld('Điện thoại', esc(u.so_dien_thoai))}${fld('Giới tính / Năm sinh', [u.gioi_tinh, u.nam_sinh && `${u.nam_sinh} (${Q.age(u)} tuổi)`].filter(Boolean).join(' · '))}
            ${fld('Địa chỉ', esc(u.dia_chi))}${fld('Học vấn', esc(u.trinh_do_hoc_van))}${fld('Kinh nghiệm', u.so_nam_kinh_nghiem != null ? u.so_nam_kinh_nghiem + ' năm' : '')}
            ${fld('Lĩnh vực', esc(Store.name('linh_vuc', u.ma_linh_vuc)))}${fld('Chuyên môn', esc(Store.name('chuyen_mon', u.ma_chuyen_mon)))}${fld('Cấp bậc', esc(Store.name('cap_bac', u.ma_cap_bac)))}${fld('Khu vực', esc(Store.name('khu_vuc', u.ma_khu_vuc)))}
            ${fld('Kỹ năng', String(u.ky_nang || '').split(',').filter(Boolean).map((s) => `<span class="tag">${esc(s.trim())}</span>`).join(''))}
            ${fld('CV đính kèm', u.cv_dinh_kem ? `${icon('file', 'sm')} ${esc(u.cv_dinh_kem)}` : '')}${fld('Ghi chú / lưu ý', esc(u.ghi_chu))}</dl></div></div>
        </div>
        <div class="card"><div class="card-head"><h3>${icon('briefcase')} Hồ sơ ứng tuyển theo dự án</h3></div><div class="card-body">
          ${hsList.map((h) => { const ct = Q.ct(h.ma_chi_tiet_du_an); return `<div class="alert clickable" data-hs="${h.id}" style="cursor:pointer"><span class="ico tone-blue">${icon('briefcase', 'sm')}</span><div style="flex:1;min-width:0"><div class="row between"><span class="tt">${ct ? esc(ct.vi_tri) : 'Chờ gán dự án'}</span>${badge(h.trang_thai, 'sm')}</div><div class="ds">${ct ? esc(Q.khOfCt(ct).ten_cong_ty) + ' · ' + Code.ct(ct.id) : 'Mã tin ' + esc(h.ma_tin_kenh)} · ${h.ma_tin_kenh ? 'apply' : 'tạo chủ động'} ${fmtDate(h.ngay_apply)}</div><div class="ds">${esc(Q.history(h.id).at(-1)?.ghi_chu || '')}</div></div></div>`; }).join('') || emptyState('Chưa có hồ sơ ứng tuyển — có thể đề cử từ kho dữ liệu')}
        </div></div></div>`;
    $$('[data-hs]', v).forEach((el) => (el.onclick = () => Comp.hsDrawer(Number(el.dataset.hs))));
    $('#norm', v).onclick = () => this.normalize(u);
    $('#rec', v) && ($('#rec', v).onclick = () => { const m = modal({ size: 'sm', title: 'Chọn dự án để đề cử', foot: foot('Tiếp tục'), body: `<form novalidate>${Form.field('Dự án (ID)', 'ct', { req: true, opts: ctOpts() })}</form>` }); submitForm(m, (x) => { if (!x.ct) return { ok: false, errors: { ct: 'Chọn dự án.' } }; m.close(); Router.go(`#/ung-vien?ct=${x.ct}&pick=${u.id}`); return { ok: true }; }); });
    $('#arch', v) && ($('#arch', v).onclick = () => confirmBox({ title: 'Lưu trữ hồ sơ ứng viên', okText: 'Lưu trữ', message: 'Ứng viên đã có việc / không còn nhu cầu sẽ được <b>loại khỏi mọi danh sách đề cử, lịch phỏng vấn đang mở</b> và không còn bị liên hệ mời tuyển.', input: { label: 'Lý do', required: true, placeholder: 'VD: Ứng viên báo đã có việc tại công ty khác' }, onOk: (r) => { const x = Svc.setCandidateStatus(u.id, ST.UV.LT, r); toast('Đã lưu trữ hồ sơ' + (x.withdrawn ? ` · rút khỏi ${x.withdrawn} hồ sơ đang xử lý` : '')); UI.refresh(); } }));
    $('#unarch', v) && ($('#unarch', v).onclick = () => confirmBox({ title: 'Kích hoạt lại hồ sơ', message: 'Ứng viên trở lại trạng thái Hoạt động (sẵn sàng đề cử).', input: { label: 'Ghi chú', required: true, placeholder: 'VD: Ứng viên liên hệ lại, đang tìm việc' }, onOk: (r) => { const x = Svc.setCandidateStatus(u.id, ST.UV.HD, r); if (!x.ok) { toast(x.error, 'err'); return false; } toast('Đã kích hoạt lại'); UI.refresh(); } }));
  },
  normalize(u) {
    const m = modal({ size: 'lg', title: `Chuẩn hóa & gắn thẻ — ${Code.uv(u.id)}`, foot: foot('Lưu hồ sơ'),
      body: `<div class="callout mb">${icon('info', 'sm')}<div>Hồ sơ do hệ thống thu thập tự động. Nhân viên rà soát, chuẩn hóa thông tin và <b>gắn thẻ</b> để phục vụ lọc nâng cao. Hệ thống kiểm tra trùng theo email & số điện thoại (BR8-1).</div></div>
        <form class="form-grid" novalidate>
        ${Form.field('Họ tên', 'ho_ten', { req: true, value: u.ho_ten })}${Form.field('Giới tính', 'gioi_tinh', { value: u.gioi_tinh || '', opts: [['', '—'], 'Nam', 'Nữ', 'Khác'] })}
        ${Form.field('Email', 'email', { req: true, value: u.email })}${Form.field('Số điện thoại', 'so_dien_thoai', { req: true, value: u.so_dien_thoai })}
        ${Form.field('Năm sinh', 'nam_sinh', { type: 'number', value: u.nam_sinh || '' })}${Form.field('Số năm kinh nghiệm', 'so_nam_kinh_nghiem', { type: 'number', value: u.so_nam_kinh_nghiem ?? '', attrs: 'step="0.5" min="0"' })}
        ${Form.field('Địa chỉ', 'dia_chi', { value: u.dia_chi })}${Form.field('Trình độ học vấn', 'trinh_do_hoc_van', { value: u.trinh_do_hoc_van })}
        <div class="full" style="border-top:1px dashed var(--border);padding-top:10px"><div class="field"><label>${icon('tag', 'sm')} Thẻ phân loại</label></div></div>
        ${Form.field('Lĩnh vực', 'ma_linh_vuc', { value: u.ma_linh_vuc, opts: Form.opts('linh_vuc', { blank: '— Chọn —' }) })}${Form.field('Chuyên môn', 'ma_chuyen_mon', { value: u.ma_chuyen_mon, opts: Form.opts('chuyen_mon', { blank: '— Chọn —' }) })}
        ${Form.field('Cấp bậc', 'ma_cap_bac', { value: u.ma_cap_bac, opts: Form.opts('cap_bac', { blank: '— Chọn —' }) })}${Form.field('Khu vực', 'ma_khu_vuc', { value: u.ma_khu_vuc, opts: kvOpts() })}
        ${Form.field('Kỹ năng (phân tách bằng dấu phẩy)', 'ky_nang', { value: u.ky_nang, full: true })}
        <div class="field full"><label>Đính kèm CV mới</label><input class="input" type="file" name="cv" accept=".pdf,.doc,.docx"><div class="hint">Hiện tại: ${esc(u.cv_dinh_kem || 'chưa có')} — chỉ nhận PDF/DOC/DOCX, tối đa 5MB.</div></div>
        ${Form.field('Ghi chú / lưu ý phân loại', 'ghi_chu', { type: 'textarea', value: u.ghi_chu, full: true })}</form>` });
    m.$('[name=cv]').onchange = (e) => { const fl = e.target.files[0]; if (fl && fl.size > 5 * 1024 * 1024) { toast('Tệp CV vượt quá 5MB (3b).', 'err'); e.target.value = ''; } };
    submitForm(m, (v) => {
      const r = Svc.normalizeCandidate(u.id, v);
      if (r.duplicate) {
        Form.showErrors(m.$('form'), r.errors);
        confirmBox({ title: 'Phát hiện hồ sơ trùng', okText: 'Gộp vào hồ sơ có sẵn', message: `Thông tin trùng với <b>${esc(r.duplicate.ho_ten)}</b> (${Code.uv(r.duplicate.id)}). Gộp hồ sơ: các hồ sơ ứng tuyển của bản ghi này chuyển sang hồ sơ có sẵn, bản ghi trùng được loại bỏ.`,
          onOk: () => { Svc.mergeCandidate(u.id, r.duplicate.id); m.close(); toast('Đã gộp hồ sơ trùng'); Router.go('#/ung-vien/' + r.duplicate.id); } });
        return { ok: true };
      }
      if (r.ok) doneThen(m, 'Đã chuẩn hóa hồ sơ ứng viên')(r);
      return r;
    });
  },
};

/* ============ THU THẬP HỒ SƠ TỰ ĐỘNG (Hình 3.20) ============ */
Pages.collect = {
  tab: 'kenh',
  render(v, p, query) {
    if (query.tab) { this.tab = query.tab; history.replaceState(null, '', '#/thu-thap'); }
    const pending = DB.ho_so_ung_tuyen.filter((h) => !h.ma_chi_tiet_du_an && h.trang_thai === ST.HS.APPLY);
    const log = DB._sync_log;
    v.innerHTML = `<div class="page-head"><div><h1>Thu thập hồ sơ tự động</h1><p>Hồ sơ apply được kênh đăng tuyển gửi sang kèm <b>mã tin đăng</b>; hệ thống tự kiểm tra trùng, đối chiếu mã tin với dự án và lưu vào kho — <b>nhân viên không nhập tay</b>.</p></div>
      <div class="actions"><button class="btn primary" id="syncAll">${icon('refresh', 'sm')} Đồng bộ tất cả kênh</button></div></div>
      <div class="card card-pad mb"><div class="row" style="align-items:flex-end;gap:12px"><div class="field" style="flex:1;min-width:240px"><label>${icon('link', 'sm')} Thu thập từ URL tin tuyển dụng</label><input class="input" id="url" placeholder="VD: https://www.vietnamworks.com/senior-java-backend-engineer-VNW-58231-jv"></div><button class="btn outline-primary" id="crawl">${icon('download', 'sm')} Thu thập hồ sơ</button></div>
        <div class="hint mt-sm">Hệ thống nhận diện kênh theo tên miền và mã tin trong URL. Hồ sơ có mã tin khớp được gắn vào dự án; không khớp → danh sách chờ gán.</div></div>
      <div class="tabs">${[['kenh', 'Kênh & tin đăng'], ['cho-gan', `Chờ gán dự án (${pending.length})`], ['nhat-ky', 'Nhật ký đồng bộ']].map(([k, l]) => `<button data-t="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="cbody"></div>`;
    const body = $('#cbody');
    if (this.tab === 'kenh') {
      body.innerHTML = `<div class="grid g-3">${DB.kenh_dang_tuyen.map((k) => { const tins = DB.tin_dang.filter((t) => t.ma_kenh === k.id && t.trang_thai === 'Đang đăng'); const n = DB.ho_so_ung_tuyen.filter((h) => DB.tin_dang.some((t) => t.ma_kenh === k.id && t.ma_tin_kenh === h.ma_tin_kenh)).length;
        return `<div class="card card-pad"><div class="row between"><div class="row"><span class="ico tone-${k.loai === 'noi_bo' ? 'violet' : 'blue'}" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center">${icon(k.loai === 'noi_bo' ? 'archive' : 'globe')}</span><div><div class="strong">${esc(k.ten_kenh)}</div><div class="muted small">${esc(k.ten_mien || 'Nội bộ')} · tiền tố ${esc(k.tien_to)}</div></div></div>${badge(k.trang_thai, 'sm')}</div>
          <p class="small t2">${esc(k.mo_ta)}</p>
          <div class="row between small"><span>${tins.length} tin đang đăng</span><span>${n} hồ sơ đã nhận</span></div>
          ${k.loai !== 'noi_bo' ? `<button class="btn sm block mt-sm" data-sync="${k.id}" ${k.trang_thai !== 'Hoạt động' ? 'disabled' : ''}>${icon('refresh', 'sm')} Đồng bộ kênh này</button>` : `<a class="btn sm block mt-sm" href="#/ung-vien">${icon('users', 'sm')} Mở kho ứng viên</a>`}</div>`; }).join('')}</div>
        <div class="card mt"><div class="card-head"><h3>Tin đăng đang hoạt động</h3><p>Mã tin dùng để đối chiếu hồ sơ apply với vị trí (BR4-3)</p></div><div class="table-wrap"><table class="table responsive"><thead><tr><th>Mã tin</th><th>Kênh</th><th>Vị trí</th><th>Ngày đăng</th><th class="num">Hồ sơ</th></tr></thead><tbody>
        ${DB.tin_dang.filter((t) => t.trang_thai === 'Đang đăng').map((t) => { const ct = Q.ct(t.ma_chi_tiet_du_an); return `<tr><td class="cell-main"><span class="code">${esc(t.ma_tin_kenh)}</span></td><td data-label="Kênh">${esc(Store.get('kenh_dang_tuyen', t.ma_kenh).ten_kenh)}</td><td data-label="Vị trí"><a href="#/du-an/${ct.id}">${esc(ct.vi_tri)}</a> <span class="t-sub">${Code.ct(ct.id)}</span></td><td data-label="Ngày đăng">${fmtDate(t.ngay_dang)}</td><td data-label="Hồ sơ" class="num">${DB.ho_so_ung_tuyen.filter((h) => h.ma_tin_kenh === t.ma_tin_kenh).length}</td></tr>`; }).join('')}</tbody></table></div></div>`;
      $$('[data-sync]', body).forEach((b) => (b.onclick = () => this.sync(Number(b.dataset.sync))));
    } else if (this.tab === 'cho-gan') {
      body.innerHTML = `<div class="callout amber mb">${icon('info', 'sm')}<div>Hồ sơ có mã tin chưa đối chiếu được với dự án nào (mã sai, tin cũ hoặc chưa gắn mã) — <b>không bị mất</b> mà chờ nhân viên gán. Gắn mã tin cho vị trí sẽ tự động gán các hồ sơ cùng mã.</div></div>
        <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Ứng viên</th><th>Mã tin</th><th>Nguồn</th><th>Thời điểm apply</th><th></th></tr></thead><tbody>
        ${pending.map((h) => { const u = Q.uv(h.ma_ung_vien); return `<tr><td class="cell-main"><div class="person">${avatar(u.ho_ten, 'sm')}<div><div class="nm">${esc(u.ho_ten)}</div><div class="sb">${esc(u.email)}</div></div></div></td><td data-label="Mã tin"><span class="code">${esc(h.ma_tin_kenh || '(trống)')}</span></td><td data-label="Nguồn">${esc(u.nguon)}</td><td data-label="Apply">${fmtDT(h.ngay_apply)}</td><td data-label=""><button class="btn xs primary" data-as="${h.id}">${icon('link', 'sm')} Gán dự án</button> <button class="btn xs" data-open="${h.id}">Xem</button></td></tr>`; }).join('') || `<tr><td colspan="5">${emptyState('Không có hồ sơ chờ gán', 'checkCircle')}</td></tr>`}</tbody></table></div></div>`;
      $$('[data-as]', body).forEach((b) => (b.onclick = () => Dlg.assignPending(Number(b.dataset.as))));
      $$('[data-open]', body).forEach((b) => (b.onclick = () => Comp.hsDrawer(Number(b.dataset.open))));
    } else {
      body.innerHTML = `<div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Thời điểm</th><th>Kênh</th><th>Thực hiện</th><th class="num">Nhận</th><th class="num">UV mới</th><th class="num">Trùng (dùng lại)</th><th class="num">Gắn dự án</th><th class="num">Chờ gán</th></tr></thead><tbody>
        ${log.map((l) => `<tr><td class="cell-main" data-label="">${fmtDT(l.thoi_diem)}</td><td data-label="Kênh">${esc(l.kenh)}${l.url ? `<div class="t-sub" style="max-width:280px;overflow:hidden;text-overflow:ellipsis">${esc(l.url)}</div>` : ''}</td><td data-label="Thực hiện">${esc(l.nguoi)}</td><td data-label="Nhận" class="num">${l.tong}</td><td data-label="UV mới" class="num">${l.moi}</td><td data-label="Trùng" class="num">${l.trung}</td><td data-label="Gắn dự án" class="num">${l.gan}</td><td data-label="Chờ gán" class="num">${l.cho_gan}</td></tr>`).join('') || `<tr><td colspan="8">${emptyState('Chưa có phiên đồng bộ')}</td></tr>`}</tbody></table></div></div>`;
    }
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    $('#syncAll').onclick = () => this.sync(null);
    $('#crawl').onclick = () => { const r = Svc.syncFromUrl($('#url').value.trim()); if (!r.ok) return toast(r.error, 'err'); this.report(r); this.tab = 'nhat-ky'; UI.refresh(); };
  },
  sync(kenhId) { const r = Svc.runSync(kenhId); this.report(r); this.tab = 'nhat-ky'; UI.refresh(); },
  report(r) { toast(`Đồng bộ ${esc(r.kenh)}: nhận ${r.tong} hồ sơ — ${r.moi} ứng viên mới, ${r.trung} trùng (dùng lại hồ sơ có sẵn), ${r.gan} gắn dự án, ${r.cho_gan} chờ gán${r.bo_qua ? `, ${r.bo_qua} apply trùng bỏ qua` : ''}.`, 'ok', 6500); },
};

/* ============ ĐỀ CỬ ỨNG VIÊN (UC_06, UC_07) ============ */
Pages.recommendations = {
  tab: null,
  render(v, p, query) {
    if (query.tab) { this.tab = query.tab; history.replaceState(null, '', '#/de-cu'); }
    const ctIds = new Set(Q.visibleCts().map((c) => c.id));
    const all = DB.de_cu.filter((d) => ctIds.has(Q.hs(d.ma_ho_so_ung_vien).ma_chi_tiet_du_an));
    const tabs = [['cho-duyet', 'Chờ duyệt', (d) => d.trang_thai === ST.DC.CHO], ['can-sua', 'Cần chỉnh sửa', (d) => d.trang_thai === ST.DC.SUA], ['da-duyet', 'Đã duyệt — chờ gửi', (d) => d.trang_thai === ST.DC.DUYET],
      ['da-gui', 'Đã gửi — chờ phản hồi', (d) => d.trang_thai === ST.DC.GUI && !d.phan_hoi_khach_hang], ['phan-hoi', 'Đã có phản hồi', (d) => !!d.phan_hoi_khach_hang], ['da-go', 'Đã gỡ', (d) => d.trang_thai === ST.DC.GO], ['tat-ca', 'Tất cả', () => true]];
    if (!this.tab) this.tab = Auth.isLead() ? 'cho-duyet' : 'can-sua';
    const cur = tabs.find((t) => t[0] === this.tab) || tabs[0];
    v.innerHTML = `<div class="page-head"><div><h1>Đề cử ứng viên</h1><p>Quy trình: Nhân viên tạo đề cử → <b>Quản lý duyệt</b> (hoặc yêu cầu chỉnh sửa kèm lý do) → gửi khách hàng → ghi nhận phản hồi.</p></div>
      <div class="actions"><a class="btn primary" href="#/ung-vien?ct=">${icon('filter', 'sm')} Lọc & tạo đề cử</a></div></div>
      <div class="tabs">${tabs.map(([k, l, fn]) => `<button data-t="${k}" class="${cur[0] === k ? 'active' : ''}">${l} <span class="badge sm ${k === 'cho-duyet' && Auth.isLead() ? 'amber' : k === 'can-sua' ? 'red' : ''}">${all.filter(fn).length}</span></button>`).join('')}</div><div id="rb"></div>`;
    $$('[data-t]', v).forEach((b) => (b.onclick = () => { this.tab = b.dataset.t; UI.refresh(); }));
    Comp.recTable($('#rb'), all.filter(cur[2]));
  },
};
