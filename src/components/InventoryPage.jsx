import { useEffect, useMemo, useState } from "react";
import InventoryTable from "./InventoryTable";
import { getActiveShop, inventoryService } from "../data/inventoryService";

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
  const [shopCode] = useState(() => getActiveShop());
  const [categories, setCategories] = useState([]);
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

  const loadCategories = async () => {
    try {
      const loaded = await inventoryService.listCategories(shopCode);
      setCategories(loaded || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [shopCode]);

  const lowStockCount = useMemo(() => items.filter((item) => item.stock <= item.reorderLevel).length, [items]);

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
      await loadCategories();
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

  const handleDelete = async (id) => {
    setError("");
    try {
      await inventoryService.remove(id);
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete product.");
    }
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-600">
          Active shop: <span className="font-semibold">{shopCode}</span> | {lowStockCount} low stock.
        </p>
        <div className="mt-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search product, SKU, category..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
        <div>
          <input
            list="inventory-categories"
            placeholder="Search/select category"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <datalist id="inventory-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
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
