export type ProductCodeMapping = {
  name: string;
  category: string;
};

export const PRODUCT_CODE_MAP: Record<string, ProductCodeMapping> = {
  BLK001: { name: "Blanket", category: "Home" },
  PNW101: { name: "Pillow", category: "Home" },
  ELX500: { name: "Extension Cord", category: "Electronics" },
};

export function normalizeProductCode(value: string): string {
  return value.trim().toUpperCase();
}

export function lookupProductByCode(value: string): ProductCodeMapping | null {
  const normalized = normalizeProductCode(value);
  if (!normalized) return null;
  return PRODUCT_CODE_MAP[normalized] ?? null;
}

export function calculateSellingPrice(costInput: string, markupInput: string): string {
  const cost = Number(costInput);
  const markup = Number(markupInput);
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(markup)) return "";
  return (cost * (1 + markup / 100)).toFixed(2);
}

export function isSellingPriceValid(costInput: number, sellingInput: number): boolean {
  if (!Number.isFinite(costInput) || !Number.isFinite(sellingInput)) return false;
  if (costInput < 0 || sellingInput < 0) return false;
  return sellingInput >= costInput;
}
