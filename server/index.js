import fs from "node:fs";
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { all, dbPath, initDb, nowIso, run, snapshotDb, usePostgres } from "./db.js";

dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../dist");
const hasClientDist = fs.existsSync(clientDist);
const downloadsDir = path.resolve(process.cwd(), "downloads");
const downloadsFallbacks = ["latest.apk", "app-release.apk"];
const androidReleaseOwner = String(process.env.ANDROID_RELEASE_OWNER || "Lets123").trim();
const androidReleaseRepo = String(process.env.ANDROID_RELEASE_REPO || "newsr-app").trim();
const androidReleaseApiUrl = `https://api.github.com/repos/${androidReleaseOwner}/${androidReleaseRepo}/releases/latest`;
const androidReleasePageUrl = `https://github.com/${androidReleaseOwner}/${androidReleaseRepo}/releases/latest`;
const githubToken = String(process.env.GITHUB_TOKEN || "").trim();
const authUser = String(process.env.APP_USERNAME || "").trim();
const authPass = String(process.env.APP_PASSWORD || "").trim();

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use("/downloads", express.static(downloadsDir));

function requireBasicAuth(req, res, next) {
  if (req.path === "/api/v1/health") return next();
  if (req.path === "/api/v1/app-release") return next();
  if (req.path === "/api/v1/android-download") return next();
  if (req.path.startsWith("/downloads/")) return next();
  if (!authUser || !authPass) return next();

  const header = String(req.headers.authorization || "");
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    const user = sep >= 0 ? decoded.slice(0, sep) : "";
    const pass = sep >= 0 ? decoded.slice(sep + 1) : "";
    if (user === authUser && pass === authPass) return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="newsr-app"');
  return res.status(401).send("Authentication required");
}

app.use(requireBasicAuth);

async function fetchAndroidRelease() {
  try {
    const response = await fetch(androidReleaseApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "newsr-app",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub release lookup failed: ${response.status}`);
    }
    const release = await response.json();
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const asset =
      assets.find((item) => item?.name === "newsr-app-release.apk") ||
      assets.find((item) => item?.name === "app-release.apk") ||
      assets.find((item) => String(item?.name || "").endsWith(".apk")) ||
      null;
    const downloadUrl = String(asset?.browser_download_url || asset?.url || "");

    return {
      id: release.id ?? null,
      version: String(release.name || release.tag_name || "Latest Android build"),
      notes: String(release.body || "").trim(),
      downloadUrl: downloadUrl || "/api/v1/android-download",
      releaseUrl: String(release.html_url || androidReleasePageUrl),
      assetName: asset?.name || "app-release.apk",
      updatedAt: release.published_at || null,
      hasRelease: Boolean(asset),
    };
  } catch (error) {
    return {
      id: null,
      version: String(process.env.ANDROID_APP_VERSION || "").trim(),
      notes: String(process.env.ANDROID_APP_NOTES || "").trim(),
      downloadUrl: "/api/v1/android-download",
      releaseUrl: androidReleasePageUrl,
      assetName: "app-release.apk",
      updatedAt: null,
      hasRelease: false,
      error: error.message || "Could not load Android release.",
    };
  }
}

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "inventory-api" });
});

app.get("/api/v1/app-release", async (_req, res) => {
  try {
    const release = await fetchAndroidRelease();
    res.json(release);
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load release info." });
  }
});

app.get("/api/v1/android-download", async (_req, res) => {
  const release = await fetchAndroidRelease();
  if (release.downloadUrl && release.downloadUrl !== "/api/v1/android-download") {
    res.redirect(302, release.downloadUrl);
    return;
  }
  res.redirect(302, androidReleasePageUrl);
});

app.get("/", (_req, res, next) => {
  if (hasClientDist) {
    return res.sendFile(path.join(clientDist, "index.html"));
  }
  return next();
});

app.get("/api/v1/inventory", async (_req, res) => {
  try {
    const shopCode = String(_req.query.shopCode || "default").trim() || "default";
    const rows = await all(
      `SELECT id, sku, name, category, cost_price AS costPrice, selling_price AS sellingPrice,
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

app.get("/api/v1/categories", async (req, res) => {
  try {
    const shopCode = String(req.query.shopCode || "default").trim() || "default";
    const rows = await all(
      `SELECT name FROM inventory_categories WHERE shop_code = ? ORDER BY name ASC`,
      [shopCode],
    );
    res.json(rows.map((row) => row.name));
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load categories." });
  }
});

app.post("/api/v1/categories", async (req, res) => {
  try {
    const { shopCode, name } = req.body || {};
    const shop = String(shopCode || "default").trim() || "default";
    const category = String(name || "").trim();
    if (!category) return res.status(400).json({ error: "Category name is required." });

    await run(
      `INSERT INTO inventory_categories (shop_code, name, created_at) VALUES (?, ?, ?)`,
      [shop, category, nowIso()],
    ).catch((error) => {
      if (!String(error.message || "").includes("UNIQUE")) throw error;
    });
    await snapshotDb("category");
    res.status(201).json({ name: category });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not create category." });
  }
});

app.post("/api/v1/inventory", async (req, res) => {
  try {
    const { sku, name, category, costPrice, sellingPrice, stock, reorderLevel, image, shopCode } = req.body || {};
    if (!sku || !name) return res.status(400).json({ error: "sku and name are required." });

    const now = nowIso();
    const shop = String(shopCode || "default").trim() || "default";
    const categoryName = String(category || "").trim();
    if (categoryName) {
      await run(
        `INSERT INTO inventory_categories (shop_code, name, created_at) VALUES (?, ?, ?)`,
        [shop, categoryName, now],
      ).catch((error) => {
        if (!String(error.message || "").includes("UNIQUE")) throw error;
      });
    }
    const result = await run(
      `INSERT INTO inventory_items
       (sku, name, category, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(sku).trim(),
        String(name).trim(),
        categoryName,
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
      `SELECT id, sku, name, category, cost_price AS costPrice, selling_price AS sellingPrice,
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
    const { name, category, costPrice, sellingPrice, stock, reorderLevel, image } = req.body || {};
    if (!id) return res.status(400).json({ error: "Invalid id." });

    const now = nowIso();
    await run(
      `UPDATE inventory_items
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           cost_price = COALESCE(?, cost_price),
           selling_price = COALESCE(?, selling_price),
           stock = COALESCE(?, stock),
           reorder_level = COALESCE(?, reorder_level),
           image = COALESCE(?, image),
           updated_at = ?
       WHERE id = ? AND is_deleted = 0`,
      [
        name ?? null,
        category ?? null,
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
      `SELECT id, sku, name, category, cost_price AS costPrice, selling_price AS sellingPrice,
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
      `SELECT sku, name, category, cost_price AS costPrice, selling_price AS sellingPrice,
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
            name = ?, category = ?, cost_price = ?, selling_price = ?, stock = ?, reorder_level = ?,
            image = ?, is_deleted = 0, updated_at = ?
           WHERE id = ?`,
          [
            name,
            String(item.category || "").trim(),
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
           (sku, name, category, cost_price, selling_price, stock, reorder_level, image, shop_code, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sku,
            name,
            String(item.category || "").trim(),
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

app.put("/api/v1/app-release", async (req, res) => {
  try {
    const version = String(req.body?.version || "").trim();
    const downloadUrl = String(req.body?.downloadUrl || "").trim();
    const notes = String(req.body?.notes || "").trim();
    const now = nowIso();
    const existing = await all(`SELECT id FROM app_release ORDER BY id DESC LIMIT 1`);

    if (existing.length > 0) {
      await run(
        `UPDATE app_release
         SET version = ?, download_url = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        [version, downloadUrl, notes, now, existing[0].id],
      );
    } else {
      await run(
        `INSERT INTO app_release (version, download_url, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [version, downloadUrl, notes, now, now],
      );
    }

    const [release] = await all(
      `SELECT id, version, download_url AS "downloadUrl", notes, updated_at AS "updatedAt"
       FROM app_release
       ORDER BY id DESC
       LIMIT 1`,
    );
    res.json({ ok: true, release });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not save release info." });
  }
});

if (hasClientDist) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

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
