export const FINANCE_ENDPOINTS = {
  invoices: "/api/v1/invoices",
  payments: "/api/v1/payments",
  expenses: "/api/v1/expenses",
  otherIncome: "/api/v1/other-income",
  ledger: "/api/v1/ledger",
};

export const CUSTOMER_CHANNELS = {
  wholesale: "wholesale",
  retail: "retail",
};

export const PRICE_CHANNELS = {
  wholesale: "wholesale",
  retail: "retail",
};

export const PAYMENT_METHODS = {
  cash: "cash",
  bankTransfer: "bank_transfer",
  cheque: "cheque",
};

export function validateCreatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object") return "Payload is required.";
  if (!payload.invoiceId) return "invoiceId is required.";
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "amount must be > 0.";
  if (!payload.method) return "method is required.";
  return "";
}

export function validateCreateExpensePayload(payload) {
  if (!payload || typeof payload !== "object") return "Payload is required.";
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "amount must be > 0.";
  if (!payload.category) return "category is required.";
  if (!payload.paidBy) return "paidBy is required.";
  return "";
}

export function validateCreateOtherIncomePayload(payload) {
  if (!payload || typeof payload !== "object") return "Payload is required.";
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "amount must be > 0.";
  if (!payload.type) return "type is required.";
  if (!payload.source) return "source is required.";
  return "";
}
