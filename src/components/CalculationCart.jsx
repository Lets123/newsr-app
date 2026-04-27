import { Minus, Plus, Trash2 } from "lucide-react";

function CalculationCart({ cartItems, onQtyChange, onRemove, onCheckout, onPrint }) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.13;
  const discount = subtotal > 150 ? subtotal * 0.04 : 0;
  const total = subtotal + tax - discount;

  return (
    <section className="flex h-full flex-col rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-bold text-slate-900">Cart</h2>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {cartItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-sm text-slate-500">
            Add products from the left panel.
          </div>
        ) : (
          cartItems.map((item) => (
            <article key={item.id} className="rounded-md border border-slate-200 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-600">${item.price.toFixed(2)} each</p>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="rounded p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onQtyChange(item.id, item.qty - 1)}
                    className="rounded border border-slate-300 p-1 transition hover:bg-slate-100"
                    title="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => onQtyChange(item.id, item.qty + 1)}
                    className="rounded border border-slate-300 p-1 transition hover:bg-slate-100"
                    title="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-sm font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</div>
              </div>
            </article>
          ))
        )}
      </div>
      <footer className="space-y-1 border-t border-slate-200 bg-slate-50 p-3 text-sm">
        <div className="flex justify-between text-slate-700">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-700">
          <span>Tax (13%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-700">
          <span>Promo Discount</span>
          <span>- ${discount.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="mt-2 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Checkout
        </button>
        <button
          onClick={onPrint}
          disabled={cartItems.length === 0}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Print Bill
        </button>
      </footer>
    </section>
  );
}

export default CalculationCart;
