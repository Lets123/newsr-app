import { useEffect, useMemo, useRef, useState } from "react";
import { financeService } from "../data/financeService";

const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const dateToInput = (value) => value.toISOString().slice(0, 10);

const getMonthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: dateToInput(start), end: dateToInput(end) };
};

const toCsv = (rows) => {
  const header = ["Date", "Type", "Reference", "Party", "Method", "Direction", "Amount", "Note"];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const body = rows.map((row) =>
    [row.date, row.type, row.reference, row.party, row.method, row.direction, row.amount, row.note]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
};

function ReportsPage() {
  const month = getMonthBounds();
  const [entries, setEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [range, setRange] = useState({ start: month.start, end: month.end });
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loadedEntries, loadedInvoices] = await Promise.all([
          financeService.getLedgerEntries(),
          financeService.getInvoices(),
        ]);
        if (!active) return;
        setEntries(loadedEntries || []);
        setInvoices(loadedInvoices || []);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Could not load report data.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      if (range.start && item.date < range.start) return false;
      if (range.end && item.date > range.end) return false;
      const value = query.trim().toLowerCase();
      if (!value) return true;
      return [item.type, item.reference, item.party, item.method, item.note].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(value),
      );
    });
  }, [entries, query, range.end, range.start]);

  const stats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    const typeTotals = {
      Collection: 0,
      Expense: 0,
      "Other Income": 0,
    };

    filteredEntries.forEach((item) => {
      if (item.direction === "in") inflow += item.amount;
      else outflow += item.amount;

      if (typeTotals[item.type] !== undefined) {
        typeTotals[item.type] += item.amount;
      }
    });

    const openDue = invoices.reduce((sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount), 0);
    const today = dateToInput(new Date());
    const overdue = invoices.filter(
      (inv) => Math.max(0, inv.totalAmount - inv.paidAmount) > 0 && inv.dueDate < today,
    ).length;

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      openDue,
      overdue,
      typeTotals,
    };
  }, [filteredEntries, invoices]);

  const exportCsv = () => {
    const csv = toCsv(filteredEntries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ledger-report-${range.start}-to-${range.end}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportBackup = async () => {
    setError("");
    const result = await financeService.exportBackup();
    if (!result.ok) {
      setError(result.error || "Could not export backup.");
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "retailflow-finance-backup.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await financeService.importBackup(parsed);
      if (!result.ok) {
        setError(result.error || "Could not import backup.");
        return;
      }

      const [loadedEntries, loadedInvoices] = await Promise.all([
        financeService.getLedgerEntries(),
        financeService.getInvoices(),
      ]);
      setEntries(loadedEntries || []);
      setInvoices(loadedInvoices || []);
    } catch {
      setError("Invalid JSON backup file.");
    } finally {
      event.target.value = "";
    }
  };

  const resetAllData = async () => {
    setError("");
    const shouldReset = window.confirm("Reset finance data to default sample entries?");
    if (!shouldReset) return;

    const result = await financeService.resetData();
    if (!result.ok) {
      setError(result.error || "Could not reset data.");
      return;
    }

    const [loadedEntries, loadedInvoices] = await Promise.all([
      financeService.getLedgerEntries(),
      financeService.getInvoices(),
    ]);
    setEntries(loadedEntries || []);
    setInvoices(loadedInvoices || []);
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">Date-based finance analytics, exports, and backup management.</p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="date"
            value={range.start}
            onChange={(event) => setRange((prev) => ({ ...prev, start: event.target.value }))}
            className="rounded-md border border-slate-300 px-2 py-1.5"
          />
          <input
            type="date"
            value={range.end}
            onChange={(event) => setRange((prev) => ({ ...prev, end: event.target.value }))}
            className="rounded-md border border-slate-300 px-2 py-1.5"
          />
          <input
            type="text"
            placeholder="Search in filtered ledger"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5"
          />
          <button
            onClick={exportCsv}
            className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Export Ledger CSV
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Inflow</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{money(stats.inflow)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Outflow</p>
          <p className="mt-1 text-2xl font-extrabold text-red-700">{money(stats.outflow)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Net</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{money(stats.net)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Open Dues</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{money(stats.openDue)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Overdue Invoices</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-700">{stats.overdue}</p>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Flow by Type (filtered)</h2>
          <div className="mt-2 space-y-2 text-sm">
            <p className="flex items-center justify-between"><span>Collections</span><strong>{money(stats.typeTotals.Collection)}</strong></p>
            <p className="flex items-center justify-between"><span>Other Income</span><strong>{money(stats.typeTotals["Other Income"])}</strong></p>
            <p className="flex items-center justify-between"><span>Expenses</span><strong>{money(stats.typeTotals.Expense)}</strong></p>
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Backup & Restore</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={exportBackup}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export Backup JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Import Backup JSON
            </button>
            <button
              onClick={resetAllData}
              className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Reset Sample Data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importBackup}
            />
          </div>
        </article>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <h2 className="text-sm font-bold text-slate-900">Filtered Ledger ({filteredEntries.length})</h2>
        </div>
        {error ? <p className="px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{item.date}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{item.type}</td>
                  <td className="px-3 py-2">{item.reference}</td>
                  <td className="px-3 py-2">{item.party}</td>
                  <td className="px-3 py-2">{item.method}</td>
                  <td className={[
                    "px-3 py-2 font-semibold",
                    item.direction === "in" ? "text-emerald-700" : "text-red-700",
                  ].join(" ")}
                  >
                    {item.direction === "in" ? "+" : "-"} {money(item.amount)}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                    No entries in selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
