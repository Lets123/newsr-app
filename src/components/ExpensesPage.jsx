import { useEffect, useMemo, useState } from "react";
import { financeService } from "../data/financeService";

const expenseCategories = ["Rent", "Salary", "Transport", "Fuel", "Utilities", "Other"];

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    date: "2026-04-27",
    category: expenseCategories[0],
    amount: "",
    paidBy: "",
    note: "",
  });
  const [error, setError] = useState("");

  const totalExpense = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loadedExpenses = await financeService.getExpenses();
        if (!active) return;
        setExpenses(loadedExpenses || []);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Could not load expenses.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.paidBy.trim()) {
      setError("Please enter who paid this expense.");
      return;
    }

    const result = await financeService.addExpense({
      date: form.date,
      category: form.category,
      amount: form.amount,
      paidBy: form.paidBy,
      note: form.note,
    });
    if (!result.ok) {
      setError(result.error || "Could not save expense.");
      return;
    }
    const loadedExpenses = await financeService.getExpenses();
    setExpenses(loadedExpenses || []);
    setForm((prev) => ({ ...prev, amount: "", paidBy: "", note: "" }));
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <h1 className="text-lg font-extrabold text-slate-900">Expenses</h1>
        <p className="text-sm text-slate-600">Track business spending with category and payer details.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Recorded Expense</p>
          <p className="mt-1 text-2xl font-extrabold text-red-700">${totalExpense.toFixed(2)}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Entries</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{expenses.length}</p>
        </article>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Add Expense</h2>
          <form className="mt-2 space-y-2" onSubmit={handleSubmit}>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            >
              {expenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <input
              type="text"
              placeholder="Paid By"
              value={form.paidBy}
              onChange={(event) => setForm((prev) => ({ ...prev, paidBy: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
            {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
            <button className="w-full rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">
              Save Expense
            </button>
          </form>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <h2 className="text-sm font-bold text-slate-900">Expense History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Paid By</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{item.date}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.paidBy}</td>
                    <td className="px-3 py-2 font-semibold text-red-700">${item.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-600">{item.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ExpensesPage;
