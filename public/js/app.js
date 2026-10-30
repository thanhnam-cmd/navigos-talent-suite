/* ==========================================================
   app.js — Khai báo route & khởi động ứng dụng
   ========================================================== */
(function boot() {
  const work = () => Auth.canWork();
  const lead = () => Auth.isLead();
  const admin = () => Auth.isAdmin();
  Router.add('/login', Pages.login, { bare: true });
  Router.add('/', Pages.home);
  Router.add('/du-an', Pages.projects, { allow: work });
  Router.add('/du-an/:id', Pages.projectDetail, { allow: work });
  Router.add('/ung-vien', Pages.candidates, { allow: work });
  Router.add('/ung-vien/:id', Pages.candidateDetail, { allow: work });
  Router.add('/thu-thap', Pages.collect, { allow: () => Auth.canOperate() || Auth.isQL() }); // Fix Demo: BGĐ không có Thu thập hồ sơ, Quản lý chỉ xem
  Router.add('/de-cu', Pages.recommendations, { allow: work });
  Router.add('/phong-van', Pages.interviews, { allow: work });
  Router.add('/ket-qua', Pages.results, { allow: work });
  Router.add('/khach-hang', Pages.customers, { allow: work });
  Router.add('/khach-hang/:id', Pages.customerDetail, { allow: work });
  Router.add('/bao-cao', Pages.reports, { allow: lead }); // BR12-1
  Router.add('/nhan-su', Pages.staff, { allow: () => lead() || admin() });
  Router.add('/tai-khoan', Pages.accounts, { allow: admin }); // BR2-3
  Router.add('/danh-muc', Pages.catalog, { allow: admin });
  Router.add('/quy-tac-lich', Pages.scheduleRules, { allow: () => Auth.isQL() || admin() }); // BR10-6
  Router.add('/cai-dat', Pages.settings);
  Router.add('/tim-kiem', Pages.search, { allow: work });

  if (!Store.load()) { Store.db = Seed.build(); Store.save(); }
  Auth.restore();
  window.addEventListener('hashchange', () => Router.resolve());
  Router.resolve();
})();
