import { describe, it, expect } from 'vitest';
import * as lucide from 'lucide-react';
import { IconMap, getIcon } from './iconMap.js';

describe('lib/iconMap', () => {
  describe('IconMap', () => {
    it('memiliki minimal 25 icon entry untuk kategori', () => {
      const keys = Object.keys(IconMap);
      expect(keys.length).toBeGreaterThanOrEqual(25);
    });

    it('setiap value adalah React component (function atau forwardRef object)', () => {
      // lucide-react v0.575+ mengekspor komponen sebagai forwardRef object
      // (typeof === 'object' dengan $$typeof symbol), atau function biasa
      // di versi yang lebih lama. Keduanya valid untuk JSX.
      Object.entries(IconMap).forEach(([key, value]) => {
        const isFn = typeof value === 'function';
        const isForwardRef =
          typeof value === 'object' &&
          value !== null &&
          value.$$typeof !== undefined;
        expect(isFn || isForwardRef, `IconMap[${key}] harus component valid`).toBe(true);
      });
    });

    it('icon yang di-mapping ada di lucide-react', () => {
      // Spot-check: Wallet di IconMap harus dari lucide-react yang sama
      const lucideWallet = lucide.Wallet;
      expect(IconMap.Wallet).toBe(lucideWallet);
      expect(IconMap.Tag).toBe(lucide.Tag);
    });

    it('Home di-map ke HomeIcon (alias lucide-react Home)', () => {
      // iconMap.js pakai `Home as HomeIcon` untuk hindari konflik.
      // IconMap key 'Home' harus resolve ke komponen yang valid.
      expect(IconMap.Home).toBe(lucide.Home);
    });
  });

  describe('getIcon', () => {
    it('return komponen icon yang valid untuk nama yang ada', () => {
      const Icon = getIcon('Wallet');
      expect(Icon).not.toBeNull();
      expect(Icon).toBe(lucide.Wallet);
    });

    it('return null untuk nama icon yang tidak ada', () => {
      expect(getIcon('NonExistentIcon')).toBeNull();
      expect(getIcon('')).toBeNull();
      expect(getIcon(null)).toBeNull();
      expect(getIcon(undefined)).toBeNull();
    });

    it('tidak throw untuk input non-string', () => {
      expect(() => getIcon(123)).not.toThrow();
      expect(() => getIcon({})).not.toThrow();
      expect(() => getIcon([])).not.toThrow();
    });
  });
});
