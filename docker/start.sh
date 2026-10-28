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
  --skip-log-bin --innodb-log-buffer-size=4M --key-buffer-size=4M \
  --temptable-max-ram=16M --tmp-table-size=8M --max-heap-table-size=8M \
  --max-connections=30 --thread-cache-size=4 --table-open-cache=200 --table-definition-cache=400 &
MYSQL_PID=$!

# Chờ MySQL nhận kết nối TCP, đặt mật khẩu root, tạo CSDL & tài khoản ứng dụng (Node.js + mysql2)
DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_ROOT_PASSWORD="$DB_ROOT_PASSWORD" node docker/init-db.js   || { echo "✖ Không chuẩn bị được MySQL"; kill -0 "$MYSQL_PID" 2>/dev/null || echo "  (tiến trình MySQL đã dừng)"; exit 1; }

shutdown() {
  echo "• Đang dừng…"
  kill -TERM "${NODE_PID:-0}" 2>/dev/null || true
  kill -TERM "$MYSQL_PID" 2>/dev/null || true; wait "$MYSQL_PID" 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT

node server/server.js &
NODE_PID=$!
wait "$NODE_PID"
