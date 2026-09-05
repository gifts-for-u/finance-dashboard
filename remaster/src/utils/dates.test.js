import { describe, it, expect } from 'vitest';
import {
  MONTH_NAMES_ID,
  MONTH_NAMES_LONG_ID,
  extractDate,
  parseDateString,
  formatDateIdLong,
  parseDateToMs,
  getMonthKey,
} from './dates.js';

describe('utils/dates', () => {
  describe('MONTH_NAMES_ID', () => {
    it('memiliki 12 bulan sesuai urutan Date.getMonth()', () => {
      expect(MONTH_NAMES_ID).toHaveLength(12);
      expect(MONTH_NAMES_ID[0]).toBe('Jan');
      expect(MONTH_NAMES_ID[11]).toBe('Des');
    });

    it('mengikuti urutan: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des', () => {
      expect(MONTH_NAMES_ID).toEqual([
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ]);
    });
  });

  describe('MONTH_NAMES_LONG_ID', () => {
    it('memiliki 12 nama panjang', () => {
      expect(MONTH_NAMES_LONG_ID).toHaveLength(12);
      expect(MONTH_NAMES_LONG_ID[0]).toBe('Januari');
      expect(MONTH_NAMES_LONG_ID[11]).toBe('Desember');
    });
  });

  describe('extractDate', () => {
    it('memformat Date object ke "D MMM YYYY"', () => {
      const d = new Date(2026, 2, 1); // 1 Maret 2026
      expect(extractDate(d)).toBe('1 Mar 2026');
    });

    it('memformat ISO string ke "D MMM YYYY"', () => {
      expect(extractDate('2026-03-01T00:00:00Z')).toBe('1 Mar 2026');
    });

    it('mendukung object dengan toDate() (Firestore Timestamp-like)', () => {
      const fakeTs = { toDate: () => new Date(2026, 2, 1) };
      expect(extractDate(fakeTs)).toBe('1 Mar 2026');
    });

    it('fallback ke tanggal hari ini untuk input null/undefined', () => {
      const before = new Date();
      const result = extractDate(null);
      const after = new Date();
      // Tidak error; hasilnya antara before dan after
      expect(result).toMatch(/^\d{1,2} \w{3} \d{4}$/);
      // Extract date dari result - parseable kembali
      const d = parseDateString(result);
      expect(d.getTime()).toBeGreaterThanOrEqual(before.getTime() - 86400000);
      expect(d.getTime()).toBeLessThanOrEqual(after.getTime() + 86400000);
    });

    it('fallback ke tanggal hari ini untuk input invalid', () => {
      const result = extractDate('not a date');
      expect(result).toMatch(/^\d{1,2} \w{3} \d{4}$/);
    });
  });

  describe('parseDateString', () => {
    it('parse string "1 Mar 2026" ke Date', () => {
      const d = parseDateString('1 Mar 2026');
      expect(d.getDate()).toBe(1);
      expect(d.getMonth()).toBe(2); // Maret
      expect(d.getFullYear()).toBe(2026);
    });

    it('handle string dengan zero-padded day "01 Mar 2026"', () => {
      const d = parseDateString('01 Mar 2026');
      expect(d.getDate()).toBe(1);
    });

    it('parse bulan Agu, Sep, Okt dengan benar', () => {
      expect(parseDateString('15 Agu 2026').getMonth()).toBe(7);
      expect(parseDateString('15 Sep 2026').getMonth()).toBe(8);
      expect(parseDateString('15 Okt 2026').getMonth()).toBe(9);
    });

    it('fallback ke Date native untuk format ISO', () => {
      const d = parseDateString('2026-03-01');
      expect(d.getFullYear()).toBe(2026);
    });

    it('return new Date() untuk input invalid', () => {
      const result = parseDateString('xxx yyy zzz');
      // Falls through ke Date constructor (invalid) → return new Date()
      expect(result).toBeInstanceOf(Date);
    });

    it('return new Date() untuk empty string', () => {
      const result = parseDateString('');
      expect(result).toBeInstanceOf(Date);
    });

    it('return new Date() untuk null', () => {
      const result = parseDateString(null);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatDateIdLong', () => {
    it('zero-pad day ke 2 digit', () => {
      const d = new Date(2026, 2, 1); // 1 Maret 2026
      expect(formatDateIdLong(d)).toBe('01 Mar 2026');
    });

    it('tetap 2 digit untuk day >= 10', () => {
      const d = new Date(2026, 11, 25); // 25 Des 2026
      expect(formatDateIdLong(d)).toBe('25 Des 2026');
    });

    it('default ke Date hari ini jika tidak ada argumen', () => {
      const result = formatDateIdLong();
      expect(result).toMatch(/^\d{2} \w{3} \d{4}$/);
    });
  });

  describe('parseDateToMs', () => {
    it('parse "1 Mar 2026" ke milliseconds', () => {
      const ms = parseDateToMs('1 Mar 2026');
      expect(ms).toBe(new Date(2026, 2, 1).getTime());
    });

    it('return 0 untuk input falsy', () => {
      expect(parseDateToMs(null)).toBe(0);
      expect(parseDateToMs(undefined)).toBe(0);
      expect(parseDateToMs('')).toBe(0);
    });

    it('return 0 untuk string yang tidak bisa di-parse', () => {
      expect(parseDateToMs('xxx')).toBe(0);
    });

    it('return 0 untuk input dengan format month invalid', () => {
      // parts.length === 3, tapi month bukan MONTH_NAMES_ID
      expect(parseDateToMs('1 ZZZ 2026')).toBe(0);
    });
  });

  describe('getMonthKey', () => {
    it('format "YYYY-MM" dengan zero-padded month', () => {
      expect(getMonthKey(new Date(2026, 0, 1))).toBe('2026-01');
      expect(getMonthKey(new Date(2026, 8, 1))).toBe('2026-09');
    });

    it('default ke Date hari ini', () => {
      const result = getMonthKey();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
