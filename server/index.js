import express from "express";
import cors from "cors";
import { all, dbPath, initDb, nowIso, run, snapshotDb, usePostgres } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "inventory-api" });
});

app.get("/api/v1/inventory", async (_req, res) => {
  try {
    const shopCode = String(_req.query.shopCode || "default").trim() || "default";
    const rows = await all(
      `SELECT id, sku, name, cost_price AS costPrice, selling_price AS sellingPrice,
              stock, reorder_level AS reorderLevel, image
       FROM inventory_items
       WHERE is_deleted = 0 AND shop_code = ?
       ORDER BY id DESC`,
      [shopCode],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load inventory." });
  }
});

app.post("/api/v1/inventory", async (req, res) => {
  try {
    const { sku, name, costPrice, sellingPrice, stock, reorderLevel, image, shopCode } = req.body || {};
    if (!sku || !name) return res.status(400).json({ error: "sku and name are required." });

    const now = nowIso();
    const shop = String(shopCode || "default").trim() || "default";
    const result = await run(
      `INSERT INTO inventory_items
       (sku, name, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(sku).trim(),
        String(name).trim(),
        Number(costPrice || 0),
        Number(sellingPrice || 0),
        Number(stock || 0),
        Number(reorderLevel || 0),
        image || "",
        shop,
        now,
        now,
      ],
    );
    await snapshotDb("write");

    const [created] = await all(
      `SELECT id, sku, name, cost_price AS costPrice, selling_price AS sellingPrice,
              stock, reorder_level AS reorderLevel, image
       FROM inventory_items WHERE shop_code = ? AND sku = ? AND is_deleted = 0
       ORDER BY id DESC LIMIT 1`,
      [shop, String(sku).trim()],
    );

    res.status(201).json(created);
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      res.status(409).json({ error: "SKU already exists." });
      return;
    }
    res.status(500).json({ error: error.message || "Could not create product." });
  }
});

app.put("/api/v1/inventory/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, costPrice, sellingPrice, stock, reorderLevel, image } = req.body || {};
    if (!id) return res.status(400).json({ error: "Invalid id." });

    const now = nowIso();
    await run(
      `UPDATE inventory_items
       SET name = COALESCE(?, name),
           cost_price = COALESCE(?, cost_price),
           selling_price = COALESCE(?, selling_price),
           stock = COALESCE(?, stock),
           reorder_level = COALESCE(?, reorder_level),
           image = COALESCE(?, image),
           updated_at = ?
       WHERE id = ? AND is_deleted = 0`,
      [
        name ?? null,
        costPrice ?? null,
        sellingPrice ?? null,
        stock ?? null,
        reorderLevel ?? null,
        image ?? null,
        now,
        id,
      ],
    );
    await snapshotDb("write");

    const [updated] = await all(
      `SELECT id, sku, name, cost_price AS costPrice, selling_price AS sellingPrice,
              stock, reorder_level AS reorderLevel, image
       FROM inventory_items WHERE id = ? AND is_deleted = 0`,
      [id],
    );
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not update product." });
  }
});

app.delete("/api/v1/inventory/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id." });
    await run(`UPDATE inventory_items SET is_deleted = 1, updated_at = ? WHERE id = ?`, [nowIso(), id]);
    await snapshotDb("write");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not delete product." });
  }
});

app.get("/api/v1/inventory/export", async (req, res) => {
  try {
    const shopCode = String(req.query.shopCode || "default").trim() || "default";
    const items = await all(
      `SELECT sku, name, cost_price AS costPrice, selling_price AS sellingPrice,
              stock, reorder_level AS reorderLevel, image
       FROM inventory_items
       WHERE is_deleted = 0 AND shop_code = ?
       ORDER BY id DESC`,
      [shopCode],
    );
    res.json({ shopCode, exportedAt: nowIso(), items });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not export stock file." });
  }
});

app.post("/api/v1/inventory/import", async (req, res) => {
  try {
    const { shopCode, mode, items } = req.body || {};
    const shop = String(shopCode || "default").trim() || "default";
    const importMode = mode === "replace" ? "replace" : "merge";
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required." });
    }
    if (importMode === "replace") {
      await run(`UPDATE inventory_items SET is_deleted = 1, updated_at = ? WHERE shop_code = ?`, [nowIso(), shop]);
    }

    for (const item of items) {
      const sku = String(item.sku || "").trim();
      const name = String(item.name || "").trim();
      if (!sku || !name) continue;
      const existing = await all(
        `SELECT id FROM inventory_items WHERE shop_code = ? AND sku = ? LIMIT 1`,
        [shop, sku],
      );
      if (existing.length > 0) {
        await run(
          `UPDATE inventory_items SET
            name = ?, cost_price = ?, selling_price = ?, stock = ?, reorder_level = ?,
            image = ?, is_deleted = 0, updated_at = ?
           WHERE id = ?`,
          [
            name,
            Number(item.costPrice || 0),
            Number(item.sellingPrice || 0),
            Number(item.stock || 0),
            Number(item.reorderLevel || 0),
            item.image || "",
            nowIso(),
            existing[0].id,
          ],
        );
      } else {
        await run(
          `INSERT INTO inventory_items
           (sku, name, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sku,
            name,
            Number(item.costPrice || 0),
            Number(item.sellingPrice || 0),
            Number(item.stock || 0),
            Number(item.reorderLevel || 0),
            item.image || "",
            shop,
            nowIso(),
            nowIso(),
          ],
        );
      }
    }
    await snapshotDb("import");
    res.json({ ok: true, shopCode: shop, mode: importMode });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not import stock file." });
  }
});

app.get("/api/v1/backups/create", async (_req, res) => {
  try {
    const file = await snapshotDb("manual");
    res.json({ ok: true, file, dbPath });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not create backup." });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Inventory API running on http://0.0.0.0:${PORT} (${usePostgres ? "postgres" : "sqlite"})`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize DB", error);
    process.exit(1);
  });
