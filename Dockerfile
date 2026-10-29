# ==========================================================
#  Navigos Talent Suite — một container gồm MySQL 8 + Node.js
#  Dùng để deploy lên Render (không cần dịch vụ MySQL bên ngoài)
# ==========================================================

# --- Giai đoạn 1: cài thư viện Node ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Giai đoạn 2: ảnh MySQL 8.0 chính thức + Node.js ---
FROM mysql:8.0
RUN microdnf install -y libstdc++ && microdnf clean all
COPY --from=deps /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chmod +x docker/start.sh

ENV NODE_ENV=production \
    TZ=Asia/Ho_Chi_Minh \
    MYSQL_MANAGED=false \
    DB_HOST=127.0.0.1 \
    DB_PORT=3306 \
    DB_NAME=navigos_talent \
    DB_USER=navigos_app \
    MYSQL_DATADIR=/var/lib/mysql/data \
    PORT=10000

EXPOSE 10000
ENTRYPOINT ["/app/docker/start.sh"]
