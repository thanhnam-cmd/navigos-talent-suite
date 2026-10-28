/* Đọc cấu hình từ biến môi trường / tệp .env ở thư mục gốc (không cần thư viện ngoài) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const e = process.env;
  // DATABASE_URL dạng mysql://user:pass@host:port/dbname?ssl=true (tiện khi deploy cloud)
  let url = {};
  if (e.DATABASE_URL) {
    const u = new URL(e.DATABASE_URL);
    url = { host: u.hostname, port: u.port, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), db: u.pathname.slice(1),
      ssl: /ssl(-mode)?=(true|required|REQUIRED)/i.test(u.search) || undefined };
  }
  const onCloud = !!e.RENDER || e.NODE_ENV === 'production';
  return {
    ROOT,
    APP_PORT: Number(e.PORT || e.APP_PORT || 8080), // Render cấp cổng qua biến PORT
    DB_HOST: url.host || e.DB_HOST || '127.0.0.1',
    DB_PORT: Number(url.port || e.DB_PORT || 3307),
    DB_NAME: url.db || e.DB_NAME || 'navigos_talent',
    DB_USER: url.user || e.DB_USER || 'navigos_app',
    DB_PASSWORD: url.password ?? e.DB_PASSWORD ?? '',
    DB_ROOT_PASSWORD: e.DB_ROOT_PASSWORD || '',
    DB_SSL: url.ssl ?? (e.DB_SSL ? e.DB_SSL === 'true' : false),
    DB_SSL_CA: e.DB_SSL_CA || '', // nội dung chứng chỉ CA (PEM) — nếu có sẽ xác thực máy chủ MySQL
    MYSQL_BASEDIR: e.MYSQL_BASEDIR || 'C:/Program Files/MySQL/MySQL Server 8.0',
    // true: dự án tự quản lý instance MySQL riêng (chỉ dùng trên máy Windows cục bộ)
    MYSQL_MANAGED: (e.MYSQL_MANAGED || (onCloud ? 'false' : 'true')) === 'true',
    DEMO_MODE: (e.DEMO_MODE || 'true') === 'true',
  };
}

/** Tùy chọn SSL cho mysql2 (Aiven / dịch vụ MySQL cloud bắt buộc SSL) */
function sslOptions(cfg) {
  if (!cfg.DB_SSL) return undefined;
  return cfg.DB_SSL_CA ? { ca: cfg.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: false };
}

module.exports = { loadEnv, sslOptions, ROOT };
