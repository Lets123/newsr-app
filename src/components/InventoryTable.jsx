import { Pencil, Save, Trash2, X } from "lucide-react";

function InventoryTable({
  items,
  editingId,
  draft,
  onEdit,
  onDraft,
  onSave,
  onCancel,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            <th className="px-3 py-2">Image</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Cost</th>
            <th className="px-3 py-2">Selling</th>
            <th className="px-3 py-2">Margin</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const lowStock = item.stock <= item.reorderLevel;

            return (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-10 w-14 rounded border border-slate-200 object-cover"
                  />
                </td>
                <td className="px-3 py-2 font-semibold text-slate-800">{item.sku}</td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      value={draft.name}
                      onChange={(event) => onDraft("name", event.target.value)}
                      className="w-56 rounded border border-slate-300 px-2 py-1"
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.costPrice}
                      onChange={(event) => onDraft("costPrice", event.target.value)}
                      className="w-28 rounded border border-slate-300 px-2 py-1"
                    />
                  ) : (
                    `$${(item.costPrice ?? 0).toFixed(2)}`
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.sellingPrice}
                      onChange={(event) => onDraft("sellingPrice", event.target.value)}
                      className="w-28 rounded border border-slate-300 px-2 py-1"
                    />
                  ) : (
                    `$${item.sellingPrice.toFixed(2)}`
                  )}
                </td>
                <td className="px-3 py-2">
                  {item.costPrice > 0
                    ? `${((((item.sellingPrice - item.costPrice) / item.costPrice) * 100) || 0).toFixed(1)}%`
                    : "-"}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={draft.stock}
                      onChange={(event) => onDraft("stock", event.target.value)}
                      className="w-24 rounded border border-slate-300 px-2 py-1"
                    />
                  ) : (
                    item.stock
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      lowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    {lowStock ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded border border-emerald-300 p-1 text-emerald-700 hover:bg-emerald-50"
                        onClick={onSave}
                        title="Save row"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        className="rounded border border-slate-300 p-1 text-slate-700 hover:bg-slate-100"
                        onClick={onCancel}
                        title="Cancel edit"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded border border-slate-300 p-1 text-slate-700 hover:bg-slate-100"
                        onClick={() => onEdit(item)}
                        title="Edit row"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="rounded border border-red-300 p-1 text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(item.id)}
                        title="Delete row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
