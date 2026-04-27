import { useMemo, useState } from "react";
import ProductGrid from "./ProductGrid";
import CalculationCart from "./CalculationCart";

const buildImage = (label, bg) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${bg}' />
          <stop offset='100%' stop-color='#ffffff' stop-opacity='0.6' />
        </linearGradient>
      </defs>
      <rect width='320' height='220' fill='url(#g)' />
      <text x='20' y='126' fill='#0f172a' font-family='Manrope, sans-serif' font-size='26' font-weight='700'>
        ${label}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const products = [
  {
    id: 1,
    sku: "RFL-101",
    name: "Basmati Rice 5kg",
    price: 18.5,
    stock: 24,
    image: buildImage("Basmati Rice", "#ffe7c7"),
  },
  {
    id: 2,
    sku: "RFL-102",
    name: "Sunflower Oil 1L",
    price: 5.75,
    stock: 72,
    image: buildImage("Sunflower Oil", "#fde68a"),
  },
  {
    id: 3,
    sku: "RFL-103",
    name: "Whole Wheat Flour 2kg",
    price: 4.9,
    stock: 39,
    image: buildImage("Wheat Flour", "#f5deb8"),
  },
  {
    id: 4,
    sku: "RFL-104",
    name: "Black Tea 500g",
    price: 6.4,
    stock: 28,
    image: buildImage("Black Tea", "#ffd4c3"),
  },
  {
    id: 5,
    sku: "RFL-105",
    name: "Toothpaste FreshMint",
    price: 2.35,
    stock: 63,
    image: buildImage("Toothpaste", "#ccfbf1"),
  },
  {
    id: 6,
    sku: "RFL-106",
    name: "Laundry Detergent 2kg",
    price: 8.95,
    stock: 19,
    image: buildImage("Detergent", "#dbeafe"),
  },
  {
    id: 7,
    sku: "RFL-107",
    name: "Eggs (12 pack)",
    price: 3.15,
    stock: 42,
    image: buildImage("Eggs", "#fef3c7"),
  },
  {
    id: 8,
    sku: "RFL-108",
    name: "Milk 1L",
    price: 1.9,
    stock: 80,
    image: buildImage("Milk", "#dbeafe"),
  },
];

function BillingPage() {
  const [query, setQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);

  const visibleProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) || product.sku.toLowerCase().includes(value),
    );
  }, [query]);

  const handleAdd = (product) => {
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleQtyChange = (id, qty) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const handleRemove = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    window.alert(`Checkout complete for ${cartItems.length} item types.`);
    setCartItems([]);
  };

  const handlePrintBill = () => {
    if (cartItems.length === 0) return;
    window.print();
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-600">Fast checkout with searchable catalog and live totals.</p>
      </header>
      <div className="grid min-h-[640px] grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1fr]">
        <ProductGrid products={visibleProducts} query={query} setQuery={setQuery} onAdd={handleAdd} />
        <CalculationCart
          cartItems={cartItems}
          onQtyChange={handleQtyChange}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          onPrint={handlePrintBill}
        />
      </div>
    </div>
  );
}

export default BillingPage;
