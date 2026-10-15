import { describe, expect, it } from 'vitest';
import {
  calculateBudgetItemTotal,
  calculateBudgetTotals,
  hasValidBudgetAmounts,
} from '../src/lib/budgetCalculations';

describe('cálculos do orçamento', () => {
  it('multiplica quantidade pelo preço unitário', () => {
    expect(calculateBudgetItemTotal({ quantity: 3, unit_price: 25, discount: 0 })).toBe(75);
  });

  it('soma os itens e calcula subtotal, desconto fixo e total final', () => {
    expect(calculateBudgetTotals([
      { quantity: 2, unit_price: 20, discount: 5 },
      { quantity: 3, unit_price: 10, discount: 0 },
    ])).toEqual({ subtotal: 70, discount_total: 5, total: 65 });
  });

  it('arredonda cada linha para centavos antes de somar', () => {
    expect(calculateBudgetTotals([
      { quantity: 1, unit_price: 1.005, discount: 0 },
      { quantity: 3, unit_price: 0.1, discount: 0 },
    ])).toEqual({ subtotal: 1.31, discount_total: 0, total: 1.31 });
  });

  it('aceita quantidades fracionárias com valor decimal', () => {
    expect(calculateBudgetTotals([
      { quantity: 1.25, unit_price: 10.1, discount: 0.05 },
    ])).toEqual({ subtotal: 12.63, discount_total: 0.05, total: 12.58 });
  });

  it('limita o desconto ao valor bruto da linha', () => {
    expect(calculateBudgetTotals([
      { quantity: 2, unit_price: 10, discount: 30 },
    ])).toEqual({ subtotal: 20, discount_total: 20, total: 0 });
  });

  it('retorna zero para orçamento sem itens', () => {
    expect(calculateBudgetTotals([])).toEqual({ subtotal: 0, discount_total: 0, total: 0 });
  });

  it('preserva valores zero', () => {
    expect(calculateBudgetTotals([
      { quantity: 0, unit_price: 0, discount: 0 },
    ])).toEqual({ subtotal: 0, discount_total: 0, total: 0 });
  });

  it('ignora entradas negativas, NaN e infinitas no cálculo', () => {
    expect(calculateBudgetTotals([
      { quantity: -1, unit_price: 100, discount: 0 },
      { quantity: 1, unit_price: Number.NaN, discount: 0 },
      { quantity: 1, unit_price: 50, discount: Number.POSITIVE_INFINITY },
    ])).toEqual({ subtotal: 50, discount_total: 0, total: 50 });
  });

  it('recusa quantidades, linhas e subtotais fora dos limites NUMERIC do banco', () => {
    expect(hasValidBudgetAmounts([{ quantity: 1, unit_price: Number.MAX_VALUE, discount: 0 }])).toBe(false);
    expect(hasValidBudgetAmounts([{ quantity: 100_000_000, unit_price: 1, discount: 0 }])).toBe(false);
    expect(hasValidBudgetAmounts([
      { quantity: 1, unit_price: 6_000_000_000, discount: 0 },
      { quantity: 1, unit_price: 6_000_000_000, discount: 0 },
    ])).toBe(false);
  });

  it('permite itens válidos sem desconto', () => {
    expect(hasValidBudgetAmounts([{ quantity: 1, unit_price: 100, discount: 0 }])).toBe(true);
  });
});
