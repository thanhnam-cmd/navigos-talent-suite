/* ==========================================================
   Chuẩn bị MySQL trong container (gọi từ docker/start.sh):
   chờ MySQL nhận kết nối TCP, đặt mật khẩu root (lần đầu),
   tạo CSDL & tài khoản ứng dụng. Thoát mã 0 khi sẵn sàng.
   ========================================================== */
const mysql = require('mysql2/promise');

const { DB_NAME = 'navigos_talent', DB_USER = 'navigos_app', DB_PASSWORD, DB_ROOT_PASSWORD } = process.env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const conn = (password) => mysql.createConnection({ host: '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306), user: 'root', password, connectTimeout: 4000 });

(async () => {
  let c = null; const start = Date.now();
  for (let i = 1; !c; i++) {
    try { c = await conn(''); console.log('• Kết nối root lần đầu — đặt mật khẩu root'); await c.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [DB_ROOT_PASSWORD]); }
    catch (e) {
      if (e.code === 'ER_ACCESS_DENIED_ERROR') { c = await conn(DB_ROOT_PASSWORD); break; } // đã có mật khẩu (dữ liệu từ lần chạy trước)
      if (Date.now() - start > 300000) throw new Error('MySQL không sẵn sàng sau 300 giây: ' + e.message);
      if (i % 10 === 0) console.log(`  … chờ MySQL (${Math.round((Date.now() - start) / 1000)}s): ${e.code || e.message}`);
      await sleep(1500);
    }
  }
  console.log(`• MySQL sẵn sàng sau ${Math.round((Date.now() - start) / 1000)} giây`);
  await c.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await c.query("CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?", [DB_USER, DB_PASSWORD]);
  await c.query("ALTER USER ?@'%' IDENTIFIED BY ?", [DB_USER, DB_PASSWORD]);
  await c.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO ?@'%'`, [DB_USER]);
  await c.end();
  console.log(`• Đã chuẩn bị CSDL ${DB_NAME} và tài khoản ${DB_USER}`);
})().catch((e) => { console.error('✖', e.message); process.exit(1); });
