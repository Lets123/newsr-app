import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "";
const usePostgres = DATABASE_URL.startsWith("postgres://") || DATABASE_URL.startsWith("postgresql://");

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "retailflow.db");
const backupDir = path.join(dataDir, "backups");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const nowIso = () => new Date().toISOString();

const seedRows = [
  ["RFL-101", "Basmati Rice 5kg", 14.2, 18.5, 24, 15, "", "default"],
  ["RFL-102", "Sunflower Oil 1L", 4.25, 5.75, 72, 20, "", "default"],
  ["RFL-103", "Whole Wheat Flour 2kg", 3.5, 4.9, 9, 12, "", "default"],
  ["RFL-104", "Black Tea 500g", 4.7, 6.4, 11, 10, "", "default"],
];

let db = null;
let pool = null;
let sqlite3 = null;

function toPgSql(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => {
    idx += 1;
    return `$${idx}`;
  });
}

async function run(sql, params = []) {
  if (usePostgres) {
    await pool.query(toPgSql(sql), params);
    return { lastID: null };
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

async function all(sql, params = []) {
  if (usePostgres) {
    const result = await pool.query(toPgSql(sql), params);
    return result.rows;
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

async function initPostgres() {
  const parsed = new URL(DATABASE_URL);
  parsed.searchParams.set("sslmode", "require");
  parsed.searchParams.set("uselibpqcompat", "true");

  pool = new Pool({
    connectionString: parsed.toString(),
    ssl: { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id BIGSERIAL PRIMARY KEY,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      selling_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 0,
      shop_code TEXT NOT NULL DEFAULT 'default',
      image TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_shop_sku ON inventory_items(shop_code, sku)`);

  const existing = await pool.query("SELECT id FROM inventory_items WHERE is_deleted = 0 LIMIT 1");
  if (existing.rows.length === 0) {
    const now = nowIso();
    for (const row of seedRows) {
      await pool.query(
        `INSERT INTO inventory_items
         (sku, name, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [...row, now, now],
      );
    }
  }
}

async function initSqlite() {
  const sqliteModule = await import("sqlite3");
  sqlite3 = sqliteModule.default || sqliteModule;
  sqlite3.verbose();
  db = new sqlite3.Database(dbPath);

  await run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 0,
      shop_code TEXT NOT NULL DEFAULT 'default',
      image TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  const cols = await all(`PRAGMA table_info(inventory_items)`);
  if (!cols.some((col) => col.name === "shop_code")) {
    await run(`ALTER TABLE inventory_items ADD COLUMN shop_code TEXT NOT NULL DEFAULT 'default'`);
  }
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_shop_sku ON inventory_items(shop_code, sku)`);

  const existing = await all("SELECT id FROM inventory_items WHERE is_deleted = 0 LIMIT 1");
  if (existing.length === 0) {
    const now = nowIso();
    for (const row of seedRows) {
      await run(
        `INSERT INTO inventory_items
         (sku, name, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...row, now, now],
      );
    }
  }
}

async function initDb() {
  if (usePostgres) {
    await initPostgres();
    return;
  }
  await initSqlite();
}

async function snapshotDb(reason = "manual") {
  if (usePostgres) {
    const stamp = new Date().toISOString().replaceAll(":", "-");
    const filePath = path.join(backupDir, `retailflow-${reason}-${stamp}.json`);
    const rows = await all(
      `SELECT sku, name, cost_price AS "costPrice", selling_price AS "sellingPrice", stock,
              reorder_level AS "reorderLevel", shop_code AS "shopCode", image
       FROM inventory_items WHERE is_deleted = 0 ORDER BY id DESC`,
    );
    await fs.promises.writeFile(filePath, JSON.stringify({ exportedAt: nowIso(), items: rows }, null, 2));
    return filePath;
  }

  const stamp = new Date().toISOString().replaceAll(":", "-");
  const filePath = path.join(backupDir, `retailflow-${reason}-${stamp}.db`);
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("PRAGMA wal_checkpoint(FULL)", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  await fs.promises.copyFile(dbPath, filePath);
  return filePath;
}

export { run, all, nowIso, initDb, snapshotDb, dbPath, usePostgres };
