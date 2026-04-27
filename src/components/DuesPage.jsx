import { useEffect, useMemo, useState } from "react";
import { financeService } from "../data/financeService";

const paymentMethods = ["Cash", "Bank Transfer", "Cheque"];

const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

function DuesPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [collectionAmount, setCollectionAmount] = useState("");
  const [collectionMethod, setCollectionMethod] = useState(paymentMethods[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [collections, setCollections] = useState([]);

  const today = new Date("2026-04-27");

  const duesInvoices = useMemo(
    () =>
      invoices
        .map((invoice) => ({ ...invoice, dueAmount: Math.max(0, invoice.totalAmount - invoice.paidAmount) }))
        .filter((invoice) => invoice.dueAmount > 0),
    [invoices],
  );

  const selectedInvoice = useMemo(
    () => duesInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [duesInvoices, selectedInvoiceId],
  );

  const overdueCount = duesInvoices.filter((invoice) => new Date(invoice.dueDate) < today).length;
  const totalDue = duesInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);
  const totalCollected = collections.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loadedInvoices, loadedPayments] = await Promise.all([
          financeService.getInvoices(),
          financeService.getPayments(),
        ]);
        if (!active) return;
        setInvoices(loadedInvoices || []);
        setCollections(loadedPayments || []);
        if (loadedInvoices?.length) {
          setSelectedInvoiceId((prev) => prev || loadedInvoices[0].id);
        }
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Could not load dues data.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCollect = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedInvoice) {
      setError("Please select an invoice with pending due.");
      return;
    }

    const result = await financeService.recordCollection({
      invoiceId: selectedInvoice.id,
      amount: collectionAmount,
      method: collectionMethod,
      note,
    });

    if (!result.ok) {
      setError(result.error || "Could not save collection.");
      return;
    }
    const [loadedInvoices, loadedPayments] = await Promise.all([
      financeService.getInvoices(),
      financeService.getPayments(),
    ]);
    setInvoices(loadedInvoices || []);
    setCollections(loadedPayments || []);

    setCollectionAmount("");
    setNote("");
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Customer Dues & Collections</h1>
        <p className="text-sm text-slate-600">
          Phase 1 wholesale collections. Expenses and other income will connect in the next step.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Open Dues Invoices</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{duesInvoices.length}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Overdue</p>
          <p className="mt-1 text-2xl font-extrabold text-red-700">{overdueCount}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Due</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{formatCurrency(totalDue)}</p>
        </article>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <h2 className="text-sm font-bold text-slate-900">Pending Dues</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Due Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {duesInvoices.map((invoice) => {
                  const isOverdue = new Date(invoice.dueDate) < today;
                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className={[
                        "cursor-pointer border-t border-slate-200",
                        selectedInvoiceId === invoice.id ? "bg-sky-50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <td className="px-3 py-2 font-semibold text-slate-800">{invoice.id}</td>
                      <td className="px-3 py-2">{invoice.customerName}</td>
                      <td className="px-3 py-2">{invoice.dueDate}</td>
                      <td className="px-3 py-2 font-semibold text-amber-700">{formatCurrency(invoice.dueAmount)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={[
                            "rounded-full px-2 py-1 text-xs font-semibold",
                            isOverdue ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
                          ].join(" ")}
                        >
                          {isOverdue ? "Overdue" : "Open"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Collect Payment</h2>
          <form onSubmit={handleCollect} className="mt-2 space-y-2">
            <select
              value={selectedInvoiceId}
              onChange={(event) => setSelectedInvoiceId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            >
              {duesInvoices.length === 0 ? <option value="">No pending dues</option> : null}
              {duesInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.id} - {invoice.customerName}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Collection Amount"
              value={collectionAmount}
              onChange={(event) => setCollectionAmount(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <select
              value={collectionMethod}
              onChange={(event) => setCollectionMethod(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            {selectedInvoice ? (
              <p className="text-xs text-slate-600">
                Selected due: <span className="font-semibold">{formatCurrency(selectedInvoice.dueAmount)}</span>
              </p>
            ) : null}
            {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
            <button className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Save Collection
            </button>
          </form>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Collected This Session</p>
            <p className="text-xl font-extrabold text-emerald-700">{formatCurrency(totalCollected)}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DuesPage;
