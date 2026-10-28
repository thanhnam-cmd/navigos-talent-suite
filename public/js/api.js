/* ==========================================================
   api.js — Kết nối giao diện với máy chủ Node.js + MySQL.
   Mọi thao tác nghiệp vụ (Svc.*) được gửi lên máy chủ, thực thi
   và ghi vào MySQL; trình duyệt nhận lại kết quả + dữ liệu mới
   trong phạm vi được phép (không bao giờ nhận mật khẩu).
   ========================================================== */
const Api = {
  call(method, url, body) {
    const x = new XMLHttpRequest();
    x.open(method, url, false); // đồng bộ: giữ nguyên luồng xử lý tuần tự của giao diện
    x.setRequestHeader('Content-Type', 'application/json');
    try { x.send(body ? JSON.stringify(body) : null); } catch (e) { return { ok: false, error: 'Không kết nối được máy chủ. Kiểm tra máy chủ Node.js đã chạy chưa.' }; }
    let data; try { data = JSON.parse(x.responseText); } catch (e) { data = { ok: false, error: `Máy chủ trả lỗi (${x.status}).` }; }
    if (x.status === 401 && url !== '/api/login') { Auth.user = null; setTimeout(() => (location.hash = '#/login'), 0); }
    return data;
  },
  apply(data) {
    if (data.server) App.server = data.server;
    if (data.db) { Store.db = data.db; Store.db._seq = Store.db._seq || {}; }
    if (data.user) Auth.user = Store.get('nhan_su', data.user.id);
  },
};

/* ----- Thay lưu trữ cục bộ bằng máy chủ ----- */
Store.load = function () { this.db = Store.empty(); return true; };
Store.save = function () {};
Store.reset = function () { const r = Api.call('POST', '/api/reset'); if (r.ok) Api.apply(r); return r; };

/* ----- Xác thực qua phiên máy chủ (cookie HttpOnly) ----- */
Auth.restore = function () { const r = Api.call('GET', '/api/me'); Api.apply(r); };
Auth.login = function (username, password) { const r = Api.call('POST', '/api/login', { username, password }); if (!r.ok) return r; Api.apply(r); return { ok: true }; };
Auth.logout = function () { Api.call('POST', '/api/logout'); this.user = null; Store.db = Store.empty(); location.hash = '#/login'; };
Auth.switchTo = function (id) { const r = Api.call('POST', '/api/switch', { id }); if (r.ok) Api.apply(r); return r; };

/* ----- Nghiệp vụ: thực thi trên máy chủ. Các hàm chỉ đọc vẫn chạy tại chỗ ----- */
const LOCAL_ONLY = new Set(['filterCandidates', 'suggestStaff', 'genPassword', '_withdrawActive', 'ingest']);
Object.keys(Svc).filter((fn) => !LOCAL_ONLY.has(fn)).forEach((fn) => {
  Svc[fn] = (...args) => {
    const r = Api.call('POST', '/api/rpc', { fn, args });
    if (!r.ok) return { ok: false, error: r.error || 'Thao tác thất bại.' };
    Api.apply(r);
    return r.result;
  };
});
