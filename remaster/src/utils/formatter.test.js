import { describe, it, expect } from 'vitest';
import { formatRupiah, formatNumberWithDots } from './formatter';

describe('formatRupiah', () => {
  it('memformat angka menjadi format mata uang Rupiah', () => {
    const formatted = formatRupiah(50000);
    // id-ID Intl currency format: "Rp 50.000" or "Rp50.000" with non-breaking space
    expect(formatted).toMatch(/Rp\s?50\.000/);
  });
});

describe('formatNumberWithDots', () => {
  it('memformat angka dan string angka dengan titik pemisah ribuan', () => {
    expect(formatNumberWithDots(1000)).toBe('1.000');
    expect(formatNumberWithDots('50000')).toBe('50.000');
    expect(formatNumberWithDots('1250000')).toBe('1.250.000');
    expect(formatNumberWithDots(0)).toBe('0');
    expect(formatNumberWithDots('0')).toBe('0');
  });

  it('mengembalikan string kosong untuk input kosong, null, atau non-numeric', () => {
    expect(formatNumberWithDots('')).toBe('');
    expect(formatNumberWithDots(null)).toBe('');
    expect(formatNumberWithDots(undefined)).toBe('');
    expect(formatNumberWithDots('abc')).toBe('');
  });

  it('membersihkan karakter non-digit sebelum memformat', () => {
    expect(formatNumberWithDots('Rp 50.000')).toBe('50.000');
    expect(formatNumberWithDots('10,000,000')).toBe('10.000.000');
  });
});
