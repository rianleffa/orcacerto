import type { BudgetItem } from '../types/database';

export interface BudgetTotals {
  subtotal: number;
  discount_total: number;
  total: number;
}

export const MAX_BUDGET_MONEY = 9_999_999_999.99;
const MAX_BUDGET_QUANTITY = 99_999_999.99;
const MAX_SAFE_MONEY = Number.MAX_SAFE_INTEGER / 100;

function toNonNegativeFinite(value: number): number {
  return Number.isFinite(value) && value > 0 && value <= MAX_SAFE_MONEY ? value : 0;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_SAFE_MONEY) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBudgetItemTotal(item: Pick<BudgetItem, 'quantity' | 'unit_price' | 'discount'>): number {
  const quantity = toNonNegativeFinite(item.quantity);
  const unitPrice = toNonNegativeFinite(item.unit_price);
  const gross = roundMoney(quantity * unitPrice);
  const discount = Math.min(gross, roundMoney(toNonNegativeFinite(item.discount)));

  return roundMoney(gross - discount);
}

/** Discounts are fixed currency amounts, as labeled in the budget editor. */
export function calculateBudgetTotals(
  items: readonly Pick<BudgetItem, 'quantity' | 'unit_price' | 'discount'>[]
): BudgetTotals {
  let subtotalCents = 0;
  let discountCents = 0;
  let totalCents = 0;

  for (const item of items) {
    const quantity = toNonNegativeFinite(item.quantity);
    const unitPrice = toNonNegativeFinite(item.unit_price);
    const lineSubtotal = roundMoney(quantity * unitPrice);
    const lineTotal = calculateBudgetItemTotal(item);

    subtotalCents += Math.round(lineSubtotal * 100);
    discountCents += Math.round((lineSubtotal - lineTotal) * 100);
    totalCents += Math.round(lineTotal * 100);
  }

  return {
    subtotal: subtotalCents / 100,
    discount_total: discountCents / 100,
    total: totalCents / 100,
  };
}

export function hasValidBudgetAmounts(
  items: readonly Pick<BudgetItem, 'quantity' | 'unit_price' | 'discount'>[]
): boolean {
  const validItems = items.every((item) => {
    if (
      !Number.isFinite(item.quantity) || item.quantity < 0 || item.quantity > MAX_BUDGET_QUANTITY ||
      !Number.isFinite(item.unit_price) || item.unit_price < 0 || item.unit_price > MAX_BUDGET_MONEY ||
      !Number.isFinite(item.discount) || item.discount < 0 || item.discount > MAX_BUDGET_MONEY
    ) return false;

    const lineSubtotal = roundMoney(item.quantity * item.unit_price);
    return lineSubtotal <= MAX_BUDGET_MONEY;
  });

  if (!validItems) return false;
  return calculateBudgetTotals(items).subtotal <= MAX_BUDGET_MONEY;
}
