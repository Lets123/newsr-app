const INVENTORY_STORAGE_KEY = "retailflow-inventory-v1";
const ACTIVE_SHOP_KEY = "retailflow-active-shop";
const CATEGORY_STORAGE_KEY = "retailflow-categories-v1";

const buildImage = (label, bg) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'>
      <rect width='320' height='220' fill='${bg}' />
      <text x='20' y='126' fill='#0f172a' font-family='Manrope, sans-serif' font-size='24' font-weight='700'>
        ${label}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const defaultInventory = [
  { id: 1, sku: "RFL-101", name: "Basmati Rice 5kg", category: "Groceries", costPrice: 14.2, sellingPrice: 18.5, stock: 24, reorderLevel: 15, image: buildImage("Rice", "#fde68a") },
  { id: 2, sku: "RFL-102", name: "Sunflower Oil 1L", category: "Groceries", costPrice: 4.25, sellingPrice: 5.75, stock: 72, reorderLevel: 20, image: buildImage("Oil", "#fef3c7") },
  { id: 3, sku: "RFL-103", name: "Whole Wheat Flour 2kg", category: "Groceries", costPrice: 3.5, sellingPrice: 4.9, stock: 9, reorderLevel: 12, image: buildImage("Flour", "#f5deb8") },
  { id: 4, sku: "RFL-104", name: "Black Tea 500g", category: "Groceries", costPrice: 4.7, sellingPrice: 6.4, stock: 11, reorderLevel: 10, image: buildImage("Tea", "#fecaca") },
];

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
}

const useApi = String(import.meta.env.VITE_USE_API || "").toLowerCase() === "true";
const apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const withBase = (path) => `${apiBase}${path}`;

const normalizeItem = (item) => ({
  id: item.id,
  sku: item.sku,
  name: item.name,
  category: item.category || "",
  costPrice: Number(item.costPrice ?? item.costprice ?? 0),
  sellingPrice: Number(item.sellingPrice ?? item.sellingprice ?? 0),
  stock: Number(item.stock ?? 0),
  reorderLevel: Number(item.reorderLevel ?? item.reorderlevel ?? 0),
  image: item.image || "",
});

function readLocal() {
  const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
  if (!raw) return defaultInventory;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultInventory;
  } catch {
    return defaultInventory;
  }
}

function saveLocal(next) {
  window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(next));
}

function readLocalCategories(shopCode = "default") {
  const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.isArray(parsed[shopCode]) ? parsed[shopCode] : [];
  } catch {
    return [];
  }
}

function saveLocalCategories(shopCode, categories) {
  const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  parsed[shopCode] = categories;
  window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(parsed));
}

export function getActiveShop() {
  return window.localStorage.getItem(ACTIVE_SHOP_KEY) || "default";
}

export function setActiveShop(shopCode) {
  const nextShop = String(shopCode || "default").trim() || "default";
  window.localStorage.setItem(ACTIVE_SHOP_KEY, nextShop);
  return nextShop;
}

const localInventoryService = {
  async list() {
    return readLocal();
  },
  async listCategories(shopCode = "default") {
    const itemCategories = readLocal().map((item) => item.category).filter(Boolean);
    return [...new Set([...itemCategories, ...readLocalCategories(shopCode)])].sort((a, b) => a.localeCompare(b));
  },
  async createCategory(name, shopCode = "default") {
    const category = String(name || "").trim();
    if (!category) throw new Error("Category name is required.");
    const categories = readLocalCategories(shopCode);
    const next = categories.includes(category) ? categories : [...categories, category];
    saveLocalCategories(shopCode, next);
    return { name: category };
  },
  async create(item) {
    const state = readLocal();
    if (state.some((entry) => entry.sku === item.sku)) throw new Error("SKU already exists.");
    const created = { ...item, id: Date.now() };
    saveLocal([created, ...state]);
    return created;
  },
  async update(id, patch) {
    const state = readLocal();
    let updated = null;
    const next = state.map((entry) => {
      if (String(entry.id) !== String(id)) return entry;
      updated = { ...entry, ...patch };
      return updated;
    });
    saveLocal(next);
    if (!updated) throw new Error("Item not found.");
    return updated;
  },
  async remove(id) {
    const state = readLocal();
    saveLocal(state.filter((entry) => String(entry.id) !== String(id)));
    return { ok: true };
  },
  async exportStockFile() {
    return { shopCode: "default", exportedAt: new Date().toISOString(), items: readLocal() };
  },
  async importStockFile(payload) {
    const mode = payload?.mode === "replace" ? "replace" : "merge";
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const current = readLocal();
    let next = mode === "replace" ? [] : [...current];
    for (const item of items) {
      const sku = String(item.sku || "").trim();
      if (!sku) continue;
      const idx = next.findIndex((row) => row.sku === sku);
      if (idx >= 0) next[idx] = { ...next[idx], ...item };
      else next.unshift({ ...item, id: Date.now() + Math.floor(Math.random() * 1000) });
    }
    saveLocal(next);
    return { ok: true };
  },
  async createBackup() {
    return { ok: true, file: "local-storage-only" };
  },
};

const apiInventoryService = {
  async list(shopCode = "default") {
    const items = await parseJsonResponse(
      await fetch(withBase(`/api/v1/inventory?shopCode=${encodeURIComponent(shopCode)}`)),
    );
    return Array.isArray(items) ? items.map(normalizeItem) : [];
  },
  async listCategories(shopCode = "default") {
    return parseJsonResponse(await fetch(withBase(`/api/v1/categories?shopCode=${encodeURIComponent(shopCode)}`)));
  },
  async createCategory(name, shopCode = "default") {
    return parseJsonResponse(
      await fetch(withBase("/api/v1/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shopCode }),
      }),
    );
  },
  async create(input, shopCode = "default") {
    const created = await parseJsonResponse(
      await fetch(withBase("/api/v1/inventory"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, shopCode }),
      }),
    );
    return normalizeItem(created);
  },
  async update(id, patch) {
    const item = await parseJsonResponse(
      await fetch(withBase(`/api/v1/inventory/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
    return normalizeItem(item);
  },
  async remove(id) {
    return parseJsonResponse(
      await fetch(withBase(`/api/v1/inventory/${id}`), {
        method: "DELETE",
      }),
    );
  },
  async exportStockFile(shopCode = "default") {
    return parseJsonResponse(
      await fetch(withBase(`/api/v1/inventory/export?shopCode=${encodeURIComponent(shopCode)}`)),
    );
  },
  async importStockFile(payload) {
    return parseJsonResponse(
      await fetch(withBase("/api/v1/inventory/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },
  async createBackup() {
    return parseJsonResponse(await fetch(withBase("/api/v1/backups/create")));
  },
};

export const inventoryService = useApi ? apiInventoryService : localInventoryService;
