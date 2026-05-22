import { useEffect, useState } from "react";
import { getActiveShop, inventoryService, setActiveShop } from "../data/inventoryService";

function StockSetupPage() {
  const [shopCode, setShopCodeState] = useState(() => getActiveShop());
  const [importMode, setImportMode] = useState("merge");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  const loadCategories = async (shop = shopCode) => {
    try {
      const loaded = await inventoryService.listCategories(shop);
      setCategories(loaded || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load categories.");
    }
  };

  useEffect(() => {
    loadCategories(shopCode);
  }, [shopCode]);

  const handleShopChange = (value) => {
    const nextShop = setActiveShop(value);
    setShopCodeState(nextShop);
  };

  const handleCreateCategory = async () => {
    const category = categoryDraft.trim();
    if (!category) return;
    setError("");
    try {
      await inventoryService.createCategory(category, shopCode);
      setCategoryDraft("");
      await loadCategories(shopCode);
    } catch (createError) {
      setError(createError.message || "Could not create category.");
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
      await loadCategories(shopCode);
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
      window.alert("Backup snapshot created.");
    } catch (backupError) {
      setError(backupError.message || "Could not create backup.");
    }
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Stock Setup</h1>
        <p className="text-sm text-slate-600">Shop, category, import, export, and backup controls.</p>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Shop & Files</h2>
          <div className="mt-2 space-y-2">
            <input
              value={shopCode}
              onChange={(event) => handleShopChange(event.target.value)}
              placeholder="Shop code"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={importMode}
              onChange={(event) => setImportMode(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="merge">Import Mode: Merge</option>
              <option value="replace">Import Mode: Replace</option>
            </select>
            <div className="grid gap-2 sm:grid-cols-3">
              <button onClick={handleExportStock} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                Export
              </button>
              <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-semibold">
                Import
                <input type="file" accept="application/json" onChange={handleImportStock} className="hidden" />
              </label>
              <button onClick={handleCreateBackup} className="rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700">
                Backup
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Categories</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={categoryDraft}
              onChange={(event) => setCategoryDraft(event.target.value)}
              placeholder="Create category"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button onClick={handleCreateCategory} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {category}
              </span>
            ))}
          </div>
        </article>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export default StockSetupPage;
