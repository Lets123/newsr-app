function ProductGrid({ products, query, setQuery, onAdd }) {
  return (
    <section className="flex h-full flex-col rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-bold text-slate-900">Products</h2>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search SKU, product, category..."
          className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm outline-none ring-sky-300 transition focus:ring-2"
        />
      </header>
      <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-2 sm:grid-cols-2">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAdd(product)}
            className="flex flex-col items-start rounded-md border border-slate-200 bg-white p-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-20 w-full rounded object-cover"
              loading="lazy"
            />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {product.sku}
            </div>
            {product.category ? (
              <div className="mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {product.category}
              </div>
            ) : null}
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{product.name}</div>
            <div className="mt-1 text-xs text-slate-600">Stock: {product.stock}</div>
            <div className="mt-1 text-sm font-bold text-emerald-700">${product.price.toFixed(2)}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ProductGrid;
