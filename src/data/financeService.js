import {
  addExpense,
  addOtherIncome,
  getExpenses,
  getInvoices,
  getLedgerEntries,
  getOtherIncome,
  getPayments,
  importFinanceState,
  recordCollection,
  exportFinanceState,
  resetFinanceState,
} from "./financeStore";
import {
  FINANCE_ENDPOINTS,
  validateCreateExpensePayload,
  validateCreateOtherIncomePayload,
  validateCreatePaymentPayload,
} from "../api/financeContracts";

const useApi = String(import.meta.env.VITE_USE_API || "").toLowerCase() === "true";

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return payload;
}

const localFinanceService = {
  async getInvoices() {
    return getInvoices();
  },
  async getPayments() {
    return getPayments();
  },
  async getExpenses() {
    return getExpenses();
  },
  async getOtherIncome() {
    return getOtherIncome();
  },
  async getLedgerEntries() {
    return getLedgerEntries();
  },
  async recordCollection(input) {
    return recordCollection(input);
  },
  async addExpense(input) {
    return addExpense(input);
  },
  async addOtherIncome(input) {
    return addOtherIncome(input);
  },
  async exportBackup() {
    return { ok: true, data: exportFinanceState() };
  },
  async importBackup(input) {
    return importFinanceState(input);
  },
  async resetData() {
    return resetFinanceState();
  },
};

const apiFinanceService = {
  async getInvoices() {
    return parseJsonResponse(await fetch(FINANCE_ENDPOINTS.invoices));
  },
  async getPayments() {
    return parseJsonResponse(await fetch(FINANCE_ENDPOINTS.payments));
  },
  async getExpenses() {
    return parseJsonResponse(await fetch(FINANCE_ENDPOINTS.expenses));
  },
  async getOtherIncome() {
    return parseJsonResponse(await fetch(FINANCE_ENDPOINTS.otherIncome));
  },
  async getLedgerEntries() {
    return parseJsonResponse(await fetch(FINANCE_ENDPOINTS.ledger));
  },
  async recordCollection(input) {
    const error = validateCreatePaymentPayload(input);
    if (error) return { ok: false, error };
    const created = await parseJsonResponse(
      await fetch(FINANCE_ENDPOINTS.payments, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return { ok: true, payment: created };
  },
  async addExpense(input) {
    const error = validateCreateExpensePayload(input);
    if (error) return { ok: false, error };
    const created = await parseJsonResponse(
      await fetch(FINANCE_ENDPOINTS.expenses, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return { ok: true, expense: created };
  },
  async addOtherIncome(input) {
    const error = validateCreateOtherIncomePayload(input);
    if (error) return { ok: false, error };
    const created = await parseJsonResponse(
      await fetch(FINANCE_ENDPOINTS.otherIncome, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return { ok: true, income: created };
  },
  async exportBackup() {
    return { ok: false, error: "Backup export is only available in local mode." };
  },
  async importBackup() {
    return { ok: false, error: "Backup import is only available in local mode." };
  },
  async resetData() {
    return { ok: false, error: "Data reset is only available in local mode." };
  },
};

export const financeService = useApi ? apiFinanceService : localFinanceService;
