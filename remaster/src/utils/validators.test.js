import { describe, it, expect } from 'vitest';
import { validateAmount, validateBudgetAmount } from './validators.js';

describe('utils/validators', () => {
  describe('validateAmount', () => {
    it('return parsed number untuk nominal valid', () => {
      expect(validateAmount(1000)).toBe(1000);
      expect(validateAmount('5000')).toBe(5000);
      expect(validateAmount(0.5)).toBe(0.5);
    });

    it('accept nominal dengan string dengan whitespace', () => {
      expect(validateAmount(' 100 ')).toBe(100);
    });

    it('reject 0 (nominal income/expense harus > 0)', () => {
      expect(() => validateAmount(0)).toThrow(/lebih dari 0/);
      expect(() => validateAmount('0')).toThrow(/lebih dari 0/);
    });

    it('reject negative number', () => {
      expect(() => validateAmount(-100)).toThrow(/lebih dari 0/);
    });

    it('reject NaN', () => {
      expect(() => validateAmount('not a number')).toThrow(/lebih dari 0/);
      expect(() => validateAmount(NaN)).toThrow(/lebih dari 0/);
    });

    it('reject Infinity dan -Infinity', () => {
      expect(() => validateAmount(Infinity)).toThrow(/lebih dari 0/);
      expect(() => validateAmount(-Infinity)).toThrow(/lebih dari 0/);
    });

    it('reject null dan undefined', () => {
      expect(() => validateAmount(null)).toThrow();
      expect(() => validateAmount(undefined)).toThrow();
    });

    it('reject nominal > 1e12 (maksimum)', () => {
      expect(() => validateAmount(1_000_000_000_001)).toThrow(/melebihi batas/);
      expect(() => validateAmount(9_999_999_999_999)).toThrow(/melebihi batas/);
    });

    it('accept nominal tepat di batas 1e12', () => {
      expect(validateAmount(1_000_000_000_000)).toBe(1_000_000_000_000);
    });
  });

  describe('validateBudgetAmount', () => {
    it('allow 0 untuk reset budget', () => {
      expect(validateBudgetAmount(0)).toBe(0);
      expect(validateBudgetAmount('0')).toBe(0);
    });

    it('return parsed number untuk budget valid', () => {
      expect(validateBudgetAmount(5000)).toBe(5000);
      expect(validateBudgetAmount('1500')).toBe(1500);
    });

    it('reject negative', () => {
      expect(() => validateBudgetAmount(-100)).toThrow(/budget harus/);
    });

    it('reject NaN/undefined', () => {
      expect(() => validateBudgetAmount('xxx')).toThrow();
      expect(() => validateBudgetAmount(undefined)).toThrow();
    });

    it('reject budget > 1e12', () => {
      expect(() => validateBudgetAmount(1_000_000_000_001)).toThrow(/melebihi batas/);
    });
  });
});
