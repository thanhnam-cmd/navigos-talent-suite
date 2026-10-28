#!/bin/bash
# ==========================================================
#  Khởi động MySQL 8 (chỉ nghe 127.0.0.1 bên trong container)
#  rồi chạy máy chủ Node.js. Lần đầu: khởi tạo MySQL, tạo CSDL
#  và tài khoản ứng dụng; máy chủ tự tạo bảng + dữ liệu mẫu.
# ==========================================================
set -euo pipefail

DATADIR="${MYSQL_DATADIR:-/var/lib/mysql/data}"
SOCK=/tmp/mysqld.sock
: "${DB_NAME:=navigos_talent}"
: "${DB_USER:=navigos_app}"
: "${DB_PASSWORD:=$(head -c 24 /dev/urandom | base64 | tr -dc A-Za-z0-9)}"
: "${DB_ROOT_PASSWORD:=$(head -c 24 /dev/urandom | base64 | tr -dc A-Za-z0-9)}"
export DB_PASSWORD

mkdir -p "$DATADIR" /var/run/mysqld
chown -R mysql:mysql "$(dirname "$DATADIR")" /var/run/mysqld

COMMON=(--no-defaults --user=mysql --datadir="$DATADIR" --socket="$SOCK")

if [ ! -d "$DATADIR/mysql" ]; then
  echo "• Khởi tạo thư mục dữ liệu MySQL…"
  mysqld "${COMMON[@]}" --initialize-insecure --innodb-use-native-aio=0 --innodb-buffer-pool-size=32M \
    --performance-schema=OFF --log-error=/tmp/mysqld-init.err || { cat /tmp/mysqld-init.err; exit 1; }
fi

echo "• Khởi động MySQL $(mysqld --version | awk '{print $3}') — RAM máy: $(awk '/MemTotal/{print int($2/1024)" MB"}' /proc/meminfo)…"
# Cấu hình bộ nhớ thấp để vừa gói Free 512 MB; tắt native AIO (một số môi trường container không hỗ trợ)
mysqld "${COMMON[@]}" --port=3306 --bind-address=127.0.0.1 --mysqlx=0 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone=+00:00 \
  --skip-log-bin --skip-name-resolve --performance-schema=OFF --innodb-use-native-aio=0 \
  --innodb-buffer-pool-size=32M --innodb-log-buffer-size=4M --key-buffer-size=4M \
  --temptable-max-ram=16M --tmp-table-size=8M --max-heap-table-size=8M \
  --max-connections=30 --thread-cache-size=4 --table-open-cache=200 --table-definition-cache=400 \
  --log-error=/tmp/mysqld.err &
MYSQL_PID=$!

for i in $(seq 1 120); do
  mysqladmin --socket="$SOCK" ping >/dev/null 2>&1 && break
  if ! kill -0 "$MYSQL_PID" 2>/dev/null; then
    set +e; wait "$MYSQL_PID"; CODE=$?; set -e
    echo "✖ MySQL dừng bất thường (mã thoát $CODE; 137 = bị dừng do thiếu RAM):"; cat /tmp/mysqld.err
    grep -E 'MemTotal|MemAvailable' /proc/meminfo || true
    exit 1
  fi
  sleep 1
done
echo "• MySQL đã nhận kết nối sau ${i} giây"

# Lần đầu (root chưa có mật khẩu): đặt mật khẩu root
if mysql --socket="$SOCK" -uroot -e "SELECT 1" >/dev/null 2>&1; then
  mysql --socket="$SOCK" -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASSWORD}';"
fi

mysql --socket="$SOCK" -uroot -p"${DB_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
SQL
echo "• MySQL sẵn sàng (CSDL ${DB_NAME})"

shutdown() {
  echo "• Đang dừng…"
  kill -TERM "${NODE_PID:-0}" 2>/dev/null || true
  mysqladmin --socket="$SOCK" -uroot -p"${DB_ROOT_PASSWORD}" shutdown 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT

node server/server.js &
NODE_PID=$!
wait "$NODE_PID"
