/* ==========================================================
   Quản lý instance MySQL 8 riêng của dự án
   node scripts/mysql.js <init|start|stop|status|setup|reset>
     init   : tạo .env (nếu chưa có), khởi tạo thư mục dữ liệu MySQL
     start  : chạy mysqld (cổng DB_PORT) ở chế độ nền
     stop   : tắt mysqld an toàn
     status : kiểm tra kết nối
     setup  : init + start + tạo CSDL, tài khoản ứng dụng, nạp schema.sql
     reset  : xóa & tạo lại CSDL (dữ liệu mẫu được nạp lại khi máy chủ khởi động)
   ========================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const { ROOT, loadEnv } = require('../server/env');

const DATA_DIR = path.join(ROOT, 'database', 'mysql-data');
const INI = path.join(ROOT, 'database', 'my.ini');
const LOG = path.join(ROOT, 'database', 'mysql-error.log');
const fwd = (p) => p.replace(/\\/g, '/');

function ensureEnv() {
  const file = path.join(ROOT, '.env');
  if (fs.existsSync(file)) return;
  const rnd = () => crypto.randomBytes(12).toString('base64url');
  const tpl = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8')
    .replace(/^DB_PASSWORD=.*$/m, 'DB_PASSWORD=' + rnd())
    .replace(/^DB_ROOT_PASSWORD=.*$/m, 'DB_ROOT_PASSWORD=' + rnd());
  fs.writeFileSync(file, tpl);
  console.log('• Đã tạo .env với mật khẩu CSDL ngẫu nhiên');
}

function writeIni(cfg) {
  fs.writeFileSync(INI, `# Tự sinh bởi scripts/mysql.js — instance MySQL riêng của dự án
[mysqld]
basedir="${fwd(cfg.MYSQL_BASEDIR)}"
datadir="${fwd(DATA_DIR)}"
port=${cfg.DB_PORT}
bind-address=127.0.0.1
mysqlx=0
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
default-time-zone='+00:00'
log-error="${fwd(LOG)}"
max_allowed_packet=64M
`);
}

const mysqld = (cfg) => path.join(cfg.MYSQL_BASEDIR, 'bin', 'mysqld.exe');

async function connect(cfg, asRoot = false, db = null) {
  const mysql = require('mysql2/promise');
  return mysql.createConnection({ host: cfg.DB_HOST, port: cfg.DB_PORT, user: asRoot ? 'root' : cfg.DB_USER, password: asRoot ? cfg.DB_ROOT_PASSWORD : cfg.DB_PASSWORD, database: db || undefined, multipleStatements: true });
}
async function reachable(cfg) {
  const net = require('net');
  return new Promise((res) => { const s = net.connect(cfg.DB_PORT, cfg.DB_HOST); s.on('connect', () => { s.end(); res(true); }); s.on('error', () => res(false)); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function init(cfg) {
  ensureEnv(); writeIni(cfg);
  if (fs.existsSync(path.join(DATA_DIR, 'mysql'))) { console.log('• Thư mục dữ liệu MySQL đã tồn tại'); return false; }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('• Khởi tạo thư mục dữ liệu MySQL (có thể mất 20–60 giây)…');
  const r = spawnSync(mysqld(cfg), [`--defaults-file=${INI}`, '--initialize-insecure', '--console'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); throw new Error('Khởi tạo MySQL thất bại'); }
  console.log('• Đã khởi tạo MySQL');
  return true;
}

async function start(cfg) {
  if (await reachable(cfg)) { console.log(`• MySQL đang chạy ở cổng ${cfg.DB_PORT}`); return; }
  writeIni(cfg);
  const child = spawn(mysqld(cfg), [`--defaults-file=${INI}`], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  for (let i = 0; i < 60; i++) { await sleep(500); if (await reachable(cfg)) { console.log(`• MySQL đã khởi động ở cổng ${cfg.DB_PORT}`); return; } }
  throw new Error('MySQL không khởi động được — xem database/mysql-error.log');
}

async function stop(cfg) {
  if (!(await reachable(cfg))) { console.log('• MySQL không chạy'); return; }
  const c = await connect(cfg, true); await c.query('SHUTDOWN'); await c.end();
  for (let i = 0; i < 40 && (await reachable(cfg)); i++) await sleep(500);
  console.log('• Đã tắt MySQL');
}

async function createDatabase(cfg, drop = false) {
  const c = await connect(cfg, true);
  if (drop) await c.query(`DROP DATABASE IF EXISTS \`${cfg.DB_NAME}\``);
  const [rows] = await c.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [cfg.DB_NAME]);
  if (!rows.length) {
    await c.query(`CREATE DATABASE \`${cfg.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.query(`USE \`${cfg.DB_NAME}\``);
    await c.query(fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
    console.log(`• Đã tạo CSDL ${cfg.DB_NAME} và nạp database/schema.sql`);
  } else console.log(`• CSDL ${cfg.DB_NAME} đã tồn tại`);
  await c.query(`CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`, [cfg.DB_USER, cfg.DB_PASSWORD]);
  await c.query(`ALTER USER ?@'localhost' IDENTIFIED BY ?`, [cfg.DB_USER, cfg.DB_PASSWORD]);
  // ALL trên riêng CSDL dự án: cần cho migration tự động (ALTER/CREATE) khi nâng cấp lược đồ
  await c.query(`GRANT ALL PRIVILEGES ON \`${cfg.DB_NAME}\`.* TO ?@'localhost'`, [cfg.DB_USER]);
  await c.end();
}

async function setup() {
  ensureEnv(); let cfg = loadEnv();
  const fresh = init(cfg);
  await start(cfg);
  if (fresh) { // instance mới: đặt mật khẩu root
    const mysql = require('mysql2/promise');
    const c = await mysql.createConnection({ host: cfg.DB_HOST, port: cfg.DB_PORT, user: 'root', password: '' });
    await c.query(`ALTER USER 'root'@'localhost' IDENTIFIED BY ?`, [cfg.DB_ROOT_PASSWORD]); await c.end();
    console.log('• Đã đặt mật khẩu root (lưu trong .env)');
  }
  await createDatabase(cfg);
}

async function main() {
  const cmd = process.argv[2] || 'status';
  if (cmd === 'init') { ensureEnv(); return void init(loadEnv()); }
  if (cmd === 'setup') return setup();
  const cfg = loadEnv();
  if (!cfg.MYSQL_MANAGED && ['start', 'stop'].includes(cmd)) return console.log('• MYSQL_MANAGED=false — dùng máy chủ MySQL bên ngoài, bỏ qua.');
  if (cmd === 'start') return start(cfg);
  if (cmd === 'stop') return stop(cfg);
  if (cmd === 'reset') { await start(cfg); return createDatabase(cfg, true); }
  if (cmd === 'status') { const ok = await reachable(cfg); console.log(ok ? `• MySQL đang chạy (${cfg.DB_HOST}:${cfg.DB_PORT})` : '• MySQL chưa chạy'); if (ok) { const c = await connect(cfg, false, cfg.DB_NAME); const [r] = await c.query('SELECT VERSION() v'); console.log('• Phiên bản:', r[0].v); await c.end(); } return; }
  console.log('Lệnh: init | start | stop | status | setup | reset');
}

if (require.main === module) main().catch((e) => { console.error('✖', e.message); process.exit(1); });
module.exports = { start, reachable };
