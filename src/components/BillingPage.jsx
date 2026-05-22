import { useEffect, useMemo, useState } from "react";
import ProductGrid from "./ProductGrid";
import CalculationCart from "./CalculationCart";
import { inventoryService } from "../data/inventoryService";

const FINGERPRINT_SIZE = 16;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

async function buildFingerprint(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = FINGERPRINT_SIZE;
      canvas.height = FINGERPRINT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas not available."));
        return;
      }
      context.drawImage(image, 0, 0, FINGERPRINT_SIZE, FINGERPRINT_SIZE);
      const { data } = context.getImageData(0, 0, FINGERPRINT_SIZE, FINGERPRINT_SIZE);
      const vector = [];
      for (let index = 0; index < data.length; index += 4) {
        const luma = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
        vector.push(Math.round(luma));
      }
      resolve(vector);
    };
    image.onerror = () => reject(new Error("Could not process image."));
    image.src = imageSrc;
  });
}

function compareFingerprint(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff += Math.abs(a[index] - b[index]);
  }
  return diff / a.length;
}

function BillingPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [billType, setBillType] = useState("retail");
  const [cameraPreview, setCameraPreview] = useState("");
  const [cameraMatches, setCameraMatches] = useState([]);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loaded = await inventoryService.list();
        if (!active) return;
        setProducts(
          (loaded || []).map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category || "",
            price: Number(item.sellingPrice || 0),
            stock: Number(item.stock || 0),
            image: item.image,
          })),
        );
      } catch (error) {
        if (!active) return;
        setCameraError(error.message || "Could not load inventory products.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        product.category.toLowerCase().includes(value),
    );
  }, [products, query]);

  const handleAdd = (product) => {
    const unitPrice = billType === "wholesale" ? Number((product.price * 0.9).toFixed(2)) : product.price;
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1, price: unitPrice }];
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

  const handlePriceChange = (id, nextPrice) => {
    const parsed = Number(nextPrice);
    if (!Number.isFinite(parsed)) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: clamp(parsed, 0, 999999) } : item)),
    );
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCameraError("");
    setCameraMatches([]);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read the captured image."));
      reader.readAsDataURL(file);
    }).catch(() => null);

    if (!dataUrl) {
      setCameraError("Could not read captured image.");
      return;
    }
    setCameraPreview(dataUrl);

    try {
      const capturedPrint = await buildFingerprint(dataUrl);
      const scores = await Promise.all(
        products.map(async (product) => {
          const productPrint = await buildFingerprint(product.image);
          const score = compareFingerprint(capturedPrint, productPrint);
          return { product, score };
        }),
      );
      const nextMatches = scores.sort((a, b) => a.score - b.score).slice(0, 3);
      setCameraMatches(nextMatches);
    } catch {
      setCameraError("Could not analyze image for matching.");
    } finally {
      event.target.value = "";
    }
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Bill Type</span>
          <button
            onClick={() => setBillType("retail")}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-semibold",
              billType === "retail" ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            Retail
          </button>
          <button
            onClick={() => setBillType("wholesale")}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-semibold",
              billType === "wholesale" ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            Wholesale
          </button>
          <span className="text-xs text-slate-600">
            {billType === "wholesale" ? "Default item price uses wholesale base (-10%)." : "Default item price uses retail base."}
          </span>
        </div>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-bold text-slate-900">Camera Item Match</h2>
        <p className="text-xs text-slate-600">Capture an item photo and auto-match against stock catalog.</p>
        <label className="mt-2 inline-flex cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Capture Item
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </label>
        {cameraError ? <p className="mt-2 text-xs font-semibold text-red-700">{cameraError}</p> : null}
        {cameraPreview ? (
          <div className="mt-2 flex flex-wrap items-start gap-3">
            <img src={cameraPreview} alt="Captured item" className="h-24 w-24 rounded-md border border-slate-200 object-cover" />
            <div className="min-w-56 flex-1 space-y-1">
              {cameraMatches.map((match) => (
                <button
                  key={match.product.id}
                  onClick={() => handleAdd(match.product)}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold text-slate-900">{match.product.name}</span>
                  <span className="text-xs text-slate-600">
                    {billType === "wholesale"
                      ? `$${(match.product.price * 0.9).toFixed(2)}`
                      : `$${match.product.price.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      <div className="grid min-h-[640px] grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1fr]">
        <ProductGrid products={visibleProducts} query={query} setQuery={setQuery} onAdd={handleAdd} />
        <CalculationCart
          cartItems={cartItems}
          billType={billType}
          onQtyChange={handleQtyChange}
          onPriceChange={handlePriceChange}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          onPrint={handlePrintBill}
        />
      </div>
    </div>
  );
}

export default BillingPage;
