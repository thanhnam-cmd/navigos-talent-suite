#!/bin/bash
# ==========================================================
#  Cài đặt / cập nhật Navigos Talent Suite trên VPS aaPanel (Ubuntu, MariaDB, Nginx, PM2)
#  Chạy trên máy chủ:  bash /www/wwwroot/navigosproject/deploy/setup-server.sh
#  Yêu cầu: CSDL + tài khoản đã tạo trong aaPanel (Databases → Add database),
#           .env đã có DB_NAME / DB_USER / DB_PASSWORD / NTS_ACCOUNTS / NTS_RECOVERY.
#  - Lần đầu (CSDL trống): tạo bảng từ database/schema.sql rồi nạp deploy/navigos_talent.sql
#  - Các lần sau: giữ nguyên dữ liệu, chỉ cài thư viện và khởi động lại (migration tự chạy)
# ==========================================================
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$APP_DIR"
APP_NAME=navigos-talent
[ -f .env ] || { echo "✖ Thiếu .env"; exit 1; }
set -a; . ./.env; set +a
: "${PORT:?}" "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASSWORD:?}"
db() { MYSQL_PWD="$DB_PASSWORD" mysql -h 127.0.0.1 -P "${DB_PORT:-3306}" -u "$DB_USER" --default-character-set=utf8mb4 "$@"; }

echo "• $APP_DIR — cổng nội bộ $PORT — CSDL $DB_NAME"
TABLES="$(db -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME'")"
if [ "$TABLES" = "0" ]; then
  echo "• Tạo bảng (database/schema.sql)"; db "$DB_NAME" < database/schema.sql
  if [ -f deploy/navigos_talent.sql ]; then echo "• Nạp dữ liệu (deploy/navigos_talent.sql)"; db "$DB_NAME" < deploy/navigos_talent.sql; fi
else echo "• CSDL đã có $TABLES bảng — giữ nguyên dữ liệu"; fi

npm ci --omit=dev --no-audit --no-fund --loglevel=error

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then pm2 restart "$APP_NAME" --update-env
else pm2 start server/server.js --name "$APP_NAME" --cwd "$APP_DIR" --time; fi
pm2 save >/dev/null
for i in $(seq 1 40); do curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null && break; sleep 1; done
curl -fs "http://127.0.0.1:$PORT/api/health" && echo && echo "✔ Ứng dụng chạy ở 127.0.0.1:$PORT"
