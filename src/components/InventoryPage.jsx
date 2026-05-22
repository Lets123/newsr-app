import { useEffect, useMemo, useState } from "react";
import InventoryTable from "./InventoryTable";
import { inventoryService } from "../data/inventoryService";

const buildImage = (label, bg) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>
      <rect width='300' height='200' fill='${bg}' />
      <text x='18' y='112' fill='#0f172a' font-family='Manrope, sans-serif' font-size='24' font-weight='700'>
        ${label}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    costPrice: "",
    sellingPrice: "",
    marginPercent: "25",
    stock: "",
    reorderLevel: "",
    image: "",
  });
  const [error, setError] = useState("");
  const [shopCode, setShopCode] = useState("default");
  const [importMode, setImportMode] = useState("merge");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoPricing, setAutoPricing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", category: "", costPrice: "", sellingPrice: "", stock: "" });

  const loadItems = async () => {
    try {
      const loaded = await inventoryService.list(shopCode);
      setItems(loaded || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load inventory.");
    }
  };

  useEffect(() => {
    loadItems();
  }, [shopCode]);

  const lowStockCount = useMemo(() => items.filter((item) => item.stock <= item.reorderLevel).length, [items]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const visibleItems = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      [item.name, item.sku, item.category].some((field) => String(field || "").toLowerCase().includes(value)),
    );
  }, [items, searchTerm]);

  const suggestedSellingPrice = useMemo(() => {
    const cost = Number(form.costPrice);
    const margin = Number(form.marginPercent);
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(margin)) return "";
    return (cost * (1 + margin / 100)).toFixed(2);
  }, [form.costPrice, form.marginPercent]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
    } catch {
      window.alert("Could not load that image. Please try again.");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");

    const hasRequired = form.sku && form.name && form.stock && form.reorderLevel;
    if (!hasRequired) return;

    const finalSellingPrice = autoPricing ? suggestedSellingPrice : form.sellingPrice;
    if (!finalSellingPrice) return;

    try {
      await inventoryService.create({
        sku: form.sku,
        name: form.name,
        category: form.category,
        costPrice: Number(form.costPrice || 0),
        sellingPrice: Number(finalSellingPrice),
        stock: Number(form.stock),
        reorderLevel: Number(form.reorderLevel),
        image: form.image || buildImage(form.name.slice(0, 12), "#e2e8f0"),
      }, shopCode);

      await loadItems();
      setForm({
        sku: "",
        name: "",
        category: "",
        costPrice: "",
        sellingPrice: "",
        marginPercent: "25",
        stock: "",
        reorderLevel: "",
        image: "",
      });
      setAutoPricing(false);
    } catch (createError) {
      setError(createError.message || "Could not add product.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      category: item.category || "",
      costPrice: String(item.costPrice ?? 0),
      sellingPrice: String(item.sellingPrice),
      stock: String(item.stock),
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError("");

    try {
      await inventoryService.update(editingId, {
        name: draft.name,
        category: draft.category,
        costPrice: Number(draft.costPrice),
        sellingPrice: Number(draft.sellingPrice),
        stock: Number(draft.stock),
      });
      await loadItems();
      setEditingId(null);
    } catch (saveError) {
      setError(saveError.message || "Could not update product.");
    }
  };

  const handleCreateCategory = () => {
    const nextCategory = categoryDraft.trim();
    if (!nextCategory) return;
    setForm((prev) => ({ ...prev, category: nextCategory }));
    setSearchTerm(nextCategory);
    setCategoryDraft("");
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await inventoryService.remove(id);
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete product.");
    }
  };

  const handleExportStock = async () => {
    setError("");
    try {
      const payload = await inventoryService.exportStockFile(shopCode);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `stock-${shopCode}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (exportError) {
      setError(exportError.message || "Could not export stock.");
    }
  };

  const handleImportStock = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await inventoryService.importStockFile({
        shopCode,
        mode: importMode,
        items: Array.isArray(payload.items) ? payload.items : [],
      });
      await loadItems();
    } catch (importError) {
      setError(importError.message || "Could not import stock.");
    } finally {
      event.target.value = "";
    }
  };

  const handleCreateBackup = async () => {
    setError("");
    try {
      await inventoryService.createBackup();
      window.alert("Backup snapshot created in data/backups.");
    } catch (backupError) {
      setError(backupError.message || "Could not create backup.");
    }
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-600">
          Central stock storage enabled. Entries are shared across web and mobile via backend API ({lowStockCount} low stock).
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={shopCode}
            onChange={(event) => setShopCode(event.target.value.trim() || "default")}
            placeholder="Shop code (e.g. shop-a)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            value={importMode}
            onChange={(event) => setImportMode(event.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="merge">Import Mode: Merge</option>
            <option value="replace">Import Mode: Replace</option>
          </select>
          <button onClick={handleExportStock} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold">
            Export Stock File
          </button>
          <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-center">
            Import Stock File
            <input type="file" accept="application/json" onChange={handleImportStock} className="hidden" />
          </label>
          <button onClick={handleCreateBackup} className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            Create DB Backup
          </button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search product, SKU, category..."
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={categoryDraft}
            onChange={(event) => setCategoryDraft(event.target.value)}
            placeholder="Create category (e.g. Jeans)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            className="rounded-md border border-sky-300 px-3 py-1.5 text-sm font-semibold text-sky-700"
          >
            Add Category
          </button>
        </div>
      </header>

      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-8"
      >
        <input
          required
          placeholder="SKU"
          value={form.sku}
          onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <input
          required
          placeholder="Item Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <select
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Cost Price"
          value={form.costPrice}
          onChange={(event) => setForm((prev) => ({ ...prev, costPrice: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <input
          required
          type="number"
          step="0.01"
          min="0"
          placeholder={autoPricing ? `Selling (Auto: ${suggestedSellingPrice || "0.00"})` : "Selling Price"}
          value={autoPricing ? suggestedSellingPrice : form.sellingPrice}
          onChange={(event) => setForm((prev) => ({ ...prev, sellingPrice: event.target.value }))}
          disabled={autoPricing}
          className="rounded-md border border-slate-300 px-2 py-1.5 disabled:bg-slate-100"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Markup %"
          value={form.marginPercent}
          onChange={(event) => setForm((prev) => ({ ...prev, marginPercent: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={autoPricing}
            onChange={(event) => setAutoPricing(event.target.checked)}
          />
          Auto-calc selling
        </label>
        <input
          required
          type="number"
          min="0"
          placeholder="Stock"
          value={form.stock}
          onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <input
          required
          type="number"
          min="0"
          placeholder="Reorder At"
          value={form.reorderLevel}
          onChange={(event) => setForm((prev) => ({ ...prev, reorderLevel: event.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:col-span-8">
          <label className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
            Upload from gallery
            <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block w-full" />
          </label>
          <label className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
            Capture with camera (Android)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="mt-1 block w-full"
            />
          </label>
        </div>

        {error ? <p className="text-xs font-semibold text-red-700 xl:col-span-8">{error}</p> : null}

        <button
          type="submit"
          className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 xl:col-span-8"
        >
          Add Product
        </button>
      </form>

      <InventoryTable
        items={visibleItems}
        editingId={editingId}
        draft={draft}
        onEdit={handleEdit}
        onDraft={(field, value) => setDraft((prev) => ({ ...prev, [field]: value }))}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default InventoryPage;
