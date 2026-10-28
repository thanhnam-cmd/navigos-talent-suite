/* ==========================================================
   repository.js — Ánh xạ giữa mô hình dữ liệu ứng dụng và
   19 bảng MySQL; đọc toàn bộ khi khởi động và ghi thay đổi
   (INSERT / UPDATE / DELETE) trong một giao dịch sau mỗi thao tác.
   ========================================================== */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { sslOptions } = require('./env');

// Bảng ứng dụng → bảng MySQL, khóa chính, đổi tên cột
const MAP = {
  khu_vuc: { sql: 'KHU_VUC', pk: 'ma_khu_vuc', ren: { ten: 'ten_khu_vuc' } },
  linh_vuc: { sql: 'LINH_VUC', pk: 'ma_linh_vuc', ren: { ten: 'ten_linh_vuc' } },
  cap_bac: { sql: 'CAP_BAC', pk: 'ma_cap_bac', ren: { ten: 'ten_cap_bac', bac: 'thu_tu' } },
  chuyen_mon: { sql: 'CHUYEN_MON', pk: 'ma_chuyen_mon', ren: { ten: 'ten_chuyen_mon' } },
  nhan_su: { sql: 'NHAN_SU', pk: 'ma_nhan_su' },
  khach_hang: { sql: 'KHACH_HANG', pk: 'ma_khach_hang' },
  du_an_tuyen_dung: { sql: 'DU_AN_TUYEN_DUNG', pk: 'ma_du_an' },
  chi_tiet_du_an: { sql: 'CHI_TIET_DU_AN', pk: 'ma_chi_tiet_du_an' },
  kenh_dang_tuyen: { sql: 'KENH_DANG_TUYEN', pk: 'ma_kenh' },
  tin_dang: { sql: 'TIN_DANG', pk: 'ma_tin_dang' },
  phan_cong: { sql: 'PHAN_CONG', pk: 'ma_phan_cong' },
  ung_vien: { sql: 'UNG_VIEN', pk: 'ma_ung_vien' },
  ho_so_ung_tuyen: { sql: 'HO_SO_UNG_TUYEN', pk: 'ma_ho_so_ung_vien' },
  lich_su_trang_thai: { sql: 'LICH_SU_TRANG_THAI', keys: ['ma_ho_so_ung_vien', 'thoi_diem_thay_doi'] },
  de_cu: { sql: 'DE_CU', pk: 'ma_de_cu' },
  lich_phong_van: { sql: 'LICH_PHONG_VAN', pk: 'ma_lich' },
  ket_qua_phong_van: { sql: 'KET_QUA_PHONG_VAN', pk: 'ma_ket_qua' },
  feedback: { sql: 'FEEDBACK', pk: 'ma_feedback' },
  ket_qua_tuyen_dung: { sql: 'KET_QUA_TUYEN_DUNG', pk: 'ma_ket_qua_td' },
};
const ORDER = Object.keys(MAP); // thứ tự cha → con (đảm bảo khóa ngoại khi INSERT)
const LOG_COLS = ['thoi_diem', 'nguoi', 'kenh', 'url', 'tong', 'moi', 'trung', 'gan', 'cho_gan', 'bo_qua'];

// ---- Chuyển đổi thời gian: ứng dụng dùng ISO (UTC), MySQL DATETIME(3) lưu UTC ----
const isoToSql = (v) => { if (v == null || v === '') return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString().slice(0, 23).replace('T', ' '); };
const sqlToIso = (v) => (v == null ? null : String(v).replace(' ', 'T') + (String(v).length <= 19 ? '.000Z' : 'Z'));
const dateOnly = (v) => (v == null || v === '' ? null : String(v).slice(0, 10));

class Repository {
  constructor(cfg) { this.cfg = cfg; this.cols = {}; this.snap = {}; this.logSnap = new Set(); }

  /** Tạo CSDL & bảng nếu chưa có (dùng khi deploy lên MySQL cloud trống) */
  async ensureSchema() {
    const base = { host: this.cfg.DB_HOST, port: this.cfg.DB_PORT, user: this.cfg.DB_USER, password: this.cfg.DB_PASSWORD, ssl: sslOptions(this.cfg), multipleStatements: true, charset: 'utf8mb4' };
    const c = await mysql.createConnection(base);
    try {
      const [db] = await c.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [this.cfg.DB_NAME]);
      if (!db.length) { await c.query(`CREATE DATABASE \`${this.cfg.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); console.log(`• Đã tạo CSDL ${this.cfg.DB_NAME}`); }
      await c.query(`USE \`${this.cfg.DB_NAME}\``);
      const [t] = await c.query("SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND UPPER(TABLE_NAME) = 'NHAN_SU'", [this.cfg.DB_NAME]);
      if (!t[0].n) {
        await c.query(fs.readFileSync(path.join(this.cfg.ROOT, 'database', 'schema.sql'), 'utf8'));
        console.log('• Đã tạo bảng từ database/schema.sql');
      }
    } finally { await c.end(); }
  }

  async connect() {
    this.pool = mysql.createPool({ host: this.cfg.DB_HOST, port: this.cfg.DB_PORT, user: this.cfg.DB_USER, password: this.cfg.DB_PASSWORD, database: this.cfg.DB_NAME,
      ssl: sslOptions(this.cfg), connectionLimit: 5, dateStrings: true, decimalNumbers: true, timezone: 'Z', charset: 'utf8mb4' });
    const [rows] = await this.pool.query('SELECT TABLE_NAME t, COLUMN_NAME c, DATA_TYPE d FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION', [this.cfg.DB_NAME]);
    for (const r of rows) (this.cols[r.t.toUpperCase()] = this.cols[r.t.toUpperCase()] || {})[r.c] = r.d;
    for (const t of ORDER) if (!this.cols[MAP[t].sql]) throw new Error(`Thiếu bảng ${MAP[t].sql} — hãy chạy: npm run setup`);
  }

  // Cột SQL ↔ thuộc tính ứng dụng
  sqlCol(t, f) { const m = MAP[t]; if (f === 'id') return m.pk; return (m.ren && m.ren[f]) || f; }
  appField(t, c) { const m = MAP[t]; if (c === m.pk) return 'id'; const ren = m.ren || {}; for (const k in ren) if (ren[k] === c) return k; return c; }
  key(t, r) { const m = MAP[t]; return m.keys ? m.keys.map((k) => r[k]).join('|') : String(r.id); }

  toSqlRow(t, r) {
    const types = this.cols[MAP[t].sql]; const out = {};
    for (const c of Object.keys(types)) {
      const f = this.appField(t, c); let v = r[f];
      if (v === undefined) v = null;
      if (types[c] === 'datetime') v = isoToSql(v); else if (types[c] === 'date') v = dateOnly(v);
      out[c] = v;
    }
    return out;
  }
  fromSqlRow(t, row) {
    const types = this.cols[MAP[t].sql]; const out = {};
    for (const c of Object.keys(row)) out[this.appField(t, c)] = types[c] === 'datetime' ? sqlToIso(row[c]) : row[c];
    return out;
  }

  async isEmpty() { const [r] = await this.pool.query('SELECT COUNT(*) n FROM NHAN_SU'); return r[0].n === 0; }

  /** Đọc toàn bộ CSDL vào bộ nhớ (định dạng của tầng nghiệp vụ) */
  async loadAll(empty) {
    const db = empty;
    for (const t of ORDER) {
      const m = MAP[t];
      const [rows] = await this.pool.query(`SELECT * FROM ${m.sql} ORDER BY ${m.keys ? m.keys.join(',') : m.pk}`);
      db[t] = rows.map((r) => this.fromSqlRow(t, r));
      if (!m.keys) db._seq[t] = db[t].reduce((x, r) => Math.max(x, r.id), 0);
    }
    const [logs] = await this.pool.query('SELECT * FROM NHAT_KY_DONG_BO ORDER BY thoi_diem DESC, ma_nhat_ky DESC LIMIT 30');
    db._sync_log = logs.map((l) => ({ ...l, thoi_diem: sqlToIso(l.thoi_diem) }));
    this.takeSnapshot(db);
    return db;
  }

  takeSnapshot(db) {
    this.snap = {};
    for (const t of ORDER) this.snap[t] = new Map(db[t].map((r) => [this.key(t, r), JSON.stringify(r)]));
    this.logSnap = new Set(db._sync_log.map((l) => l.thoi_diem + '|' + l.kenh));
  }

  /** Ghi các thay đổi kể từ lần chụp trước xuống MySQL trong một giao dịch */
  async persist(db) {
    const ins = {}, upd = {}, del = {}; let n = 0;
    for (const t of ORDER) {
      const old = this.snap[t] || new Map(); const seen = new Set();
      ins[t] = []; upd[t] = []; del[t] = [];
      for (const r of db[t]) {
        const k = this.key(t, r); seen.add(k);
        if (!old.has(k)) ins[t].push(r); else if (old.get(k) !== JSON.stringify(r)) upd[t].push(r);
      }
      for (const k of old.keys()) if (!seen.has(k)) del[t].push(k);
      n += ins[t].length + upd[t].length + del[t].length;
    }
    const newLogs = db._sync_log.filter((l) => !this.logSnap.has(l.thoi_diem + '|' + l.kenh));
    if (!n && !newLogs.length) return { changed: 0 };

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const t of ORDER) {
        if (!ins[t].length) continue;
        const rows = ins[t].map((r) => this.toSqlRow(t, r)); const cols = Object.keys(rows[0]);
        for (let i = 0; i < rows.length; i += 500)
          await conn.query(`INSERT INTO ${MAP[t].sql} (${cols.join(',')}) VALUES ?`, [rows.slice(i, i + 500).map((r) => cols.map((c) => r[c]))]);
      }
      for (const t of ORDER) for (const r of upd[t]) {
        const m = MAP[t]; const row = this.toSqlRow(t, r); const keyCols = m.keys || [m.pk];
        const setCols = Object.keys(row).filter((c) => !keyCols.includes(c));
        await conn.query(`UPDATE ${m.sql} SET ${setCols.map((c) => c + ' = ?').join(', ')} WHERE ${keyCols.map((c) => c + ' = ?').join(' AND ')}`, [...setCols.map((c) => row[c]), ...keyCols.map((c) => row[c])]);
      }
      for (const t of [...ORDER].reverse()) for (const k of del[t]) {
        const m = MAP[t];
        if (m.keys) { const [a, b] = k.split('|'); await conn.query(`DELETE FROM ${m.sql} WHERE ${m.keys[0]} = ? AND ${m.keys[1]} = ?`, [a, isoToSql(b)]); }
        else await conn.query(`DELETE FROM ${m.sql} WHERE ${m.pk} = ?`, [k]);
      }
      for (const l of newLogs) await conn.query(`INSERT INTO NHAT_KY_DONG_BO (${LOG_COLS.join(',')}) VALUES (?)`, [LOG_COLS.map((c) => (c === 'thoi_diem' ? isoToSql(l[c]) : l[c] ?? null))]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    this.takeSnapshot(db);
    return { changed: n + newLogs.length };
  }

  /** Xóa toàn bộ dữ liệu (dùng khi khôi phục dữ liệu mẫu) */
  async truncateAll() {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const t of [...ORDER].reverse()) await conn.query(`DELETE FROM ${MAP[t].sql}`); // con → cha (giữ ràng buộc khóa ngoại)
      await conn.query('DELETE FROM NHAT_KY_DONG_BO');
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    for (const t of ORDER) this.snap[t] = new Map(); this.logSnap = new Set();
  }
}

module.exports = { Repository };
