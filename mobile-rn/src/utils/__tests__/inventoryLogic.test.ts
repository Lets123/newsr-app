import {
  calculateSellingPrice,
  isSellingPriceValid,
  lookupProductByCode,
  normalizeProductCode,
} from "../inventoryLogic";

describe("inventoryLogic", () => {
  describe("normalizeProductCode", () => {
    it("trims and uppercases product codes", () => {
      expect(normalizeProductCode("  blk001  ")).toBe("BLK001");
    });
  });

  describe("lookupProductByCode", () => {
    it("finds mapped products using normalized input", () => {
      expect(lookupProductByCode(" pNW101 ")).toEqual({
        name: "Pillow",
        category: "Home",
      });
    });

    it("returns null when a product code does not exist in mapping", () => {
      expect(lookupProductByCode("unknown")).toBeNull();
    });
  });

  describe("calculateSellingPrice", () => {
    it("calculates selling price from cost and markup", () => {
      expect(calculateSellingPrice("100", "25")).toBe("125.00");
    });

    it("returns empty for invalid inputs", () => {
      expect(calculateSellingPrice("-1", "20")).toBe("");
      expect(calculateSellingPrice("100", "abc")).toBe("");
    });
  });

  describe("isSellingPriceValid", () => {
    it("requires selling price to be at least cost price", () => {
      expect(isSellingPriceValid(100, 100)).toBe(true);
      expect(isSellingPriceValid(100, 95)).toBe(false);
    });
  });
});
