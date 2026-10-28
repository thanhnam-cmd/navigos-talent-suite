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

# Cấu hình InnoDB nhẹ cho gói Free (512 MB RAM, CPU thấp): tắt native AIO, redo log nhỏ, không doublewrite.
# Log của MySQL ghi thẳng ra stderr để hiển thị trong log Render.
INNODB=(--performance-schema=OFF --innodb-use-native-aio=0 --innodb-buffer-pool-size=32M
  --innodb-redo-log-capacity=8M --innodb-doublewrite=OFF --innodb-flush-log-at-trx-commit=2)

if [ ! -d "$DATADIR/mysql" ]; then
  echo "• Khởi tạo thư mục dữ liệu MySQL…"
  rm -rf "${DATADIR:?}"/*
  mysqld "${COMMON[@]}" "${INNODB[@]}" --initialize-insecure --console
  echo "• Khởi tạo xong"
fi

echo "• Khởi động MySQL $(mysqld --version | awk '{print $3}')…"
mysqld "${COMMON[@]}" "${INNODB[@]}" --console --port=3306 --bind-address=127.0.0.1 --mysqlx=0 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone=+00:00 \
  --skip-log-bin --skip-name-resolve --innodb-log-buffer-size=4M --key-buffer-size=4M \
  --temptable-max-ram=16M --tmp-table-size=8M --max-heap-table-size=8M \
  --max-connections=30 --thread-cache-size=4 --table-open-cache=200 --table-definition-cache=400 &
MYSQL_PID=$!

READY=0
for i in $(seq 1 300); do
  if timeout 5 mysqladmin --connect-timeout=3 --socket="$SOCK" ping >/dev/null 2>&1; then READY=1; break; fi
  if ! kill -0 "$MYSQL_PID" 2>/dev/null; then
    set +e; wait "$MYSQL_PID"; CODE=$?; set -e
    echo "✖ MySQL dừng bất thường (mã thoát $CODE; 137 = bị dừng do thiếu RAM)"
    exit 1
  fi
  [ $((i % 15)) -eq 0 ] && echo "  … chờ MySQL (${i}s)"
  sleep 1
done
[ "$READY" = 1 ] || { echo "✖ MySQL không sẵn sàng sau 300 giây"; exit 1; }
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
