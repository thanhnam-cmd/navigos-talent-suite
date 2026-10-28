/* ==========================================================
   engine.js — Nạp tầng nghiệp vụ dùng chung (public/js/core.js,
   services.js, seed.js) vào một sandbox Node để THỰC THI TRÊN MÁY CHỦ.
   Giao diện và máy chủ dùng chung một bộ quy tắc BR duy nhất.
   ========================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createEngine(root) {
  const ctx = {
    console, setTimeout, clearTimeout, URL, URLSearchParams, Date, Math, JSON,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
    location: { hash: '' }, history: { replaceState() {} }, addEventListener() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const src = ['core.js', 'services.js', 'seed.js'].map((f) => fs.readFileSync(path.join(root, 'public', 'js', f), 'utf8')).join('\n;\n');
  // Đưa các khai báo cấp cao (const/let) ra ngoài sandbox
  vm.runInContext(src + '\n;globalThis.__api = { App, Store, Auth, Svc, Q, Seed, ROLES, ST, TABLES, recalcAll };', ctx, { filename: 'business-layer.js' });
  const api = ctx.__api;
  api.Store.save = () => {}; // ghi xuống MySQL do repository.persist() đảm nhiệm
  return api;
}

module.exports = { createEngine };
