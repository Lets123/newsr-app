import { useMemo, useState } from "react";
import InventoryTable from "./InventoryTable";

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

const baseItems = [
  {
    id: 1,
    sku: "RFL-101",
    name: "Basmati Rice 5kg",
    costPrice: 14.2,
    sellingPrice: 18.5,
    stock: 24,
    reorderLevel: 15,
    image: buildImage("Rice", "#fde68a"),
  },
  {
    id: 2,
    sku: "RFL-102",
    name: "Sunflower Oil 1L",
    costPrice: 4.25,
    sellingPrice: 5.75,
    stock: 72,
    reorderLevel: 20,
    image: buildImage("Oil", "#fef3c7"),
  },
  {
    id: 3,
    sku: "RFL-103",
    name: "Whole Wheat Flour 2kg",
    costPrice: 3.5,
    sellingPrice: 4.9,
    stock: 9,
    reorderLevel: 12,
    image: buildImage("Flour", "#f5deb8"),
  },
  {
    id: 4,
    sku: "RFL-104",
    name: "Black Tea 500g",
    costPrice: 4.7,
    sellingPrice: 6.4,
    stock: 11,
    reorderLevel: 10,
    image: buildImage("Tea", "#fecaca"),
  },
];

function InventoryPage() {
  const [items, setItems] = useState(baseItems);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    costPrice: "",
    sellingPrice: "",
    marginPercent: "25",
    stock: "",
    reorderLevel: "",
    image: "",
  });
  const [autoPricing, setAutoPricing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", costPrice: "", sellingPrice: "", stock: "" });

  const lowStockCount = useMemo(
    () => items.filter((item) => item.stock <= item.reorderLevel).length,
    [items],
  );

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

  const handleCreate = (event) => {
    event.preventDefault();
    const hasRequired = form.sku && form.name && form.stock && form.reorderLevel;
    if (!hasRequired) return;

    const finalSellingPrice = autoPricing ? suggestedSellingPrice : form.sellingPrice;
    if (!finalSellingPrice) return;

    const next = {
      id: Date.now(),
      sku: form.sku,
      name: form.name,
      costPrice: Number(form.costPrice || 0),
      sellingPrice: Number(finalSellingPrice),
      stock: Number(form.stock),
      reorderLevel: Number(form.reorderLevel),
      image: form.image || buildImage(form.name.slice(0, 12), "#e2e8f0"),
    };
    setItems((prev) => [next, ...prev]);
    setForm({
      sku: "",
      name: "",
      costPrice: "",
      sellingPrice: "",
      marginPercent: "25",
      stock: "",
      reorderLevel: "",
      image: "",
    });
    setAutoPricing(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      costPrice: String(item.costPrice ?? 0),
      sellingPrice: String(item.sellingPrice),
      stock: String(item.stock),
    });
  };

  const handleSave = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: draft.name,
              costPrice: Number(draft.costPrice),
              sellingPrice: Number(draft.sellingPrice),
              stock: Number(draft.stock),
            }
          : item,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-600">
          SKU management with Android-friendly image capture, pricing fields, and low-stock alerts (
          {lowStockCount} active).
        </p>
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
        {form.image ? (
          <div className="xl:col-span-8">
            <img src={form.image} alt="Preview" className="h-20 w-32 rounded border border-slate-300 object-cover" />
          </div>
        ) : null}
        <button className="rounded-md bg-sky-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-900 xl:col-span-8">
          Add Item
        </button>
      </form>

      <InventoryTable
        items={items}
        editingId={editingId}
        draft={draft}
        onEdit={handleEdit}
        onDraft={(field, value) => setDraft((prev) => ({ ...prev, [field]: value }))}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
        onDelete={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
      />
    </div>
  );
}

export default InventoryPage;
