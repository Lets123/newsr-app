const STORAGE_KEY = "retailflow-finance-v1";

const defaultState = {
  invoices: [
    {
      id: "INV-2026-0001",
      customerId: "CUST-001",
      customerName: "Sharma Garments (Wholesale)",
      issueDate: "2026-04-01",
      dueDate: "2026-04-15",
      totalAmount: 2400,
      paidAmount: 1400,
    },
    {
      id: "INV-2026-0002",
      customerId: "CUST-002",
      customerName: "New Star Collection",
      issueDate: "2026-04-10",
      dueDate: "2026-04-24",
      totalAmount: 1890,
      paidAmount: 1890,
    },
    {
      id: "INV-2026-0003",
      customerId: "CUST-001",
      customerName: "Sharma Garments (Wholesale)",
      issueDate: "2026-04-12",
      dueDate: "2026-04-26",
      totalAmount: 3100,
      paidAmount: 900,
    },
    {
      id: "INV-2026-0004",
      customerId: "CUST-003",
      customerName: "Metro Fashion Hub",
      issueDate: "2026-04-18",
      dueDate: "2026-05-02",
      totalAmount: 760,
      paidAmount: 300,
    },
  ],
  payments: [],
  expenses: [
    {
      id: "EXP-001",
      date: "2026-04-01",
      category: "Rent",
      amount: 850,
      paidBy: "Owner",
      note: "Shop monthly rent",
    },
    {
      id: "EXP-002",
      date: "2026-04-05",
      category: "Transport",
      amount: 120,
      paidBy: "Warehouse",
      note: "Delivery van",
    },
    {
      id: "EXP-003",
      date: "2026-04-07",
      category: "Salary",
      amount: 1400,
      paidBy: "Admin",
      note: "Staff advance payout",
    },
  ],
  otherIncome: [
    {
      id: "INC-001",
      date: "2026-04-03",
      type: "Commission",
      source: "Brand Partner",
      amount: 310,
      note: "",
    },
    {
      id: "INC-002",
      date: "2026-04-11",
      type: "Rental",
      source: "Sublet Rack",
      amount: 420,
      note: "Weekly slot",
    },
  ],
};

const parseState = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : defaultState.invoices,
      payments: Array.isArray(parsed.payments) ? parsed.payments : defaultState.payments,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : defaultState.expenses,
      otherIncome: Array.isArray(parsed.otherIncome) ? parsed.otherIncome : defaultState.otherIncome,
    };
  } catch {
    return null;
  }
};

const cloneDefaultState = () => JSON.parse(JSON.stringify(defaultState));

export function loadFinanceState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDefaultState();
  return parseState(raw) ?? cloneDefaultState();
}

export function saveFinanceState(nextState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function getInvoices() {
  return loadFinanceState().invoices;
}

export function getPayments() {
  return loadFinanceState().payments;
}

export function getExpenses() {
  return loadFinanceState().expenses;
}

export function getOtherIncome() {
  return loadFinanceState().otherIncome;
}

export function recordCollection({ invoiceId, amount, method, note }) {
  const state = loadFinanceState();
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return { ok: false, error: "Invalid collection amount." };

  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found." };

  const dueAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
  if (parsedAmount > dueAmount) return { ok: false, error: "Collection exceeds due amount." };

  const updatedInvoices = state.invoices.map((item) =>
    item.id === invoiceId ? { ...item, paidAmount: item.paidAmount + parsedAmount } : item,
  );

  const payment = {
    id: `PAY-${Date.now()}`,
    invoiceId,
    customerName: invoice.customerName,
    amount: parsedAmount,
    method,
    note: note?.trim() || "",
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };

  const nextState = {
    ...state,
    invoices: updatedInvoices,
    payments: [payment, ...state.payments],
  };
  saveFinanceState(nextState);
  return { ok: true, payment };
}

export function addExpense(expense) {
  const state = loadFinanceState();
  const parsedAmount = Number(expense.amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return { ok: false, error: "Invalid expense amount." };

  const nextExpense = {
    id: `EXP-${Date.now()}`,
    date: expense.date,
    category: expense.category,
    amount: parsedAmount,
    paidBy: expense.paidBy?.trim() || "",
    note: expense.note?.trim() || "",
  };
  const nextState = { ...state, expenses: [nextExpense, ...state.expenses] };
  saveFinanceState(nextState);
  return { ok: true, expense: nextExpense };
}

export function addOtherIncome(income) {
  const state = loadFinanceState();
  const parsedAmount = Number(income.amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return { ok: false, error: "Invalid income amount." };

  const nextIncome = {
    id: `INC-${Date.now()}`,
    date: income.date,
    type: income.type,
    source: income.source?.trim() || "",
    amount: parsedAmount,
    note: income.note?.trim() || "",
  };
  const nextState = { ...state, otherIncome: [nextIncome, ...state.otherIncome] };
  saveFinanceState(nextState);
  return { ok: true, income: nextIncome };
}

export function getLedgerEntries() {
  const state = loadFinanceState();
  const paymentEntries = state.payments.map((item) => ({
    id: item.id,
    date: item.date,
    type: "Collection",
    reference: item.invoiceId,
    party: item.customerName,
    method: item.method,
    amount: item.amount,
    direction: "in",
    note: item.note || "",
  }));

  const expenseEntries = state.expenses.map((item) => ({
    id: item.id,
    date: item.date,
    type: "Expense",
    reference: item.category,
    party: item.paidBy,
    method: "Outflow",
    amount: item.amount,
    direction: "out",
    note: item.note || "",
  }));

  const incomeEntries = state.otherIncome.map((item) => ({
    id: item.id,
    date: item.date,
    type: "Other Income",
    reference: item.type,
    party: item.source,
    method: "Inflow",
    amount: item.amount,
    direction: "in",
    note: item.note || "",
  }));

  return [...paymentEntries, ...expenseEntries, ...incomeEntries].sort((a, b) => {
    if (a.date === b.date) return a.id < b.id ? 1 : -1;
    return a.date < b.date ? 1 : -1;
  });
}

export function exportFinanceState() {
  return loadFinanceState();
}

export function importFinanceState(nextState) {
  if (!nextState || typeof nextState !== "object") {
    return { ok: false, error: "Invalid backup file format." };
  }

  const parsed = {
    invoices: Array.isArray(nextState.invoices) ? nextState.invoices : [],
    payments: Array.isArray(nextState.payments) ? nextState.payments : [],
    expenses: Array.isArray(nextState.expenses) ? nextState.expenses : [],
    otherIncome: Array.isArray(nextState.otherIncome) ? nextState.otherIncome : [],
  };

  saveFinanceState(parsed);
  return { ok: true };
}

export function resetFinanceState() {
  const nextState = cloneDefaultState();
  saveFinanceState(nextState);
  return { ok: true };
}
