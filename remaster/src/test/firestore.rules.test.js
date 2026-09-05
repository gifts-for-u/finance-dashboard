/**
 * Static analysis tests untuk firestore.rules.
 *
 * Catatan: Test ini BUKAN pengganti Firebase Emulator. Mereka hanya
 * mengecek struktur & konsistensi internal rules (catch typo, missing
 * function, unbalanced braces). Untuk validasi runtime (izin read/write
 * aktual), WAJIB jalankan `firebase emulators:start` di workstation
 * lokal (lihat AGENTS.md Section 4.6).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Path dari src/test/ naik 3 level: src/test → src → remaster → repo root
const RULES_PATH = resolve(__dirname, '..', '..', '..', 'firestore.rules');
const RULES_SOURCE = readFileSync(RULES_PATH, 'utf8');

describe('firestore.rules (static analysis)', () => {
  it('file exists dan non-empty', () => {
    expect(RULES_SOURCE).toBeTruthy();
    expect(RULES_SOURCE.length).toBeGreaterThan(100);
  });

  it('menggunakan rules_version = \'2\'', () => {
    expect(RULES_SOURCE).toMatch(/rules_version\s*=\s*['"]2['"]/);
  });

  it('declare service cloud.firestore', () => {
    expect(RULES_SOURCE).toMatch(/service\s+cloud\.firestore\s*\{/);
  });

  it('memiliki satu top-level database match', () => {
    // Firestore rules: exactly one `match /databases/{...}/documents` per file
    const matches = RULES_SOURCE.match(/match\s+\/databases\/\{database\}\/documents/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(1);
  });

  describe('brace balance', () => {
    it('kurung kurawal buka dan tutup seimbang', () => {
      const opens = (RULES_SOURCE.match(/\{/g) || []).length;
      const closes = (RULES_SOURCE.match(/\}/g) || []).length;
      expect(opens).toBe(closes);
    });

    it('kurung biasa buka dan tutup seimbang', () => {
      const opens = (RULES_SOURCE.match(/\(/g) || []).length;
      const closes = (RULES_SOURCE.match(/\)/g) || []).length;
      expect(opens).toBe(closes);
    });

    it('bracket buka dan tutup seimbang', () => {
      const opens = (RULES_SOURCE.match(/\[/g) || []).length;
      const closes = (RULES_SOURCE.match(/\]/g) || []).length;
      expect(opens).toBe(closes);
    });
  });

  describe('security invariants', () => {
    it('TIDAK ada "allow read, write: if true"', () => {
      // Hard rule dari AGENTS.md Section 2.1
      expect(RULES_SOURCE).not.toMatch(/allow\s+read,\s*write:\s*if\s+true/);
    });

    it('TIDAK ada "allow write: if true" tanpa kondisi', () => {
      // Block sebagai boolean true tanpa ekspresi
      const lines = RULES_SOURCE.split('\n');
      lines.forEach((line, i) => {
        expect(line, `line ${i + 1}: ${line.trim()}`).not.toMatch(/allow\s+write:\s*if\s+true\s*;?\s*$/);
        expect(line, `line ${i + 1}: ${line.trim()}`).not.toMatch(/allow\s+read:\s*if\s+true\s*;?\s*$/);
      });
    });

    it('default deny catch-all di akhir (di luar /users)', () => {
      // Wajib ada match /{document=**} dengan allow read, write: if false
      const hasDefaultDeny = /match\s+\/\{document=\*\*\}\s*\{[^}]*allow\s+read,\s*write:\s*if\s+false/m.test(
        RULES_SOURCE
      );
      expect(hasDefaultDeny).toBe(true);
    });

    it('user root document read OK, write deny', () => {
      // /users/{uid} root punya read OK, write deny
      const userRootSection = RULES_SOURCE.match(
        /match\s+\/users\/\{userId\}\s*\{([\s\S]*?)\n\s*match\s+\/categories/
      );
      expect(userRootSection).not.toBeNull();
      expect(userRootSection[1]).toMatch(/allow\s+read:\s*if\s+isOwner/);
      expect(userRootSection[1]).toMatch(/allow\s+write:\s*if\s+false/);
    });
  });

  describe('helper functions', () => {
    it('mendefinisikan isAuthenticated()', () => {
      expect(RULES_SOURCE).toMatch(/function\s+isAuthenticated\s*\(\s*\)\s*\{/);
    });

    it('mendefinisikan isOwner(userId)', () => {
      expect(RULES_SOURCE).toMatch(/function\s+isOwner\s*\(\s*userId\s*\)\s*\{/);
    });

    it('isOwner menggunakan request.auth.uid', () => {
      const isOwnerBody = RULES_SOURCE.match(
        /function\s+isOwner\s*\(\s*userId\s*\)\s*\{([^}]+)\}/
      );
      expect(isOwnerBody).not.toBeNull();
      expect(isOwnerBody[1]).toMatch(/request\.auth\.uid/);
    });

    it('mendefinisikan isValidAmount', () => {
      expect(RULES_SOURCE).toMatch(/function\s+isValidAmount\s*\(/);
      const body = RULES_SOURCE.match(
        /function\s+isValidAmount\s*\([^)]*\)\s*\{([^}]+)\}/
      );
      expect(body).not.toBeNull();
      expect(body[1]).toMatch(/val\s+is\s+number/);
    });

    it('isValidAmount punya upper bound <= 1e12', () => {
      // Accept "val <= 1e12" atau "val <= 1000000000000" atau "val <= MAX_AMOUNT()"
      expect(RULES_SOURCE).toMatch(/val\s*<=\s*(1e12|1000000000000|MAX_AMOUNT\(\))/);
    });

    it('mendefinisikan isValidCategory dengan hasOnly', () => {
      expect(RULES_SOURCE).toMatch(/function\s+isValidCategory\s*\(/);
      const body = RULES_SOURCE.match(
        /function\s+isValidCategory\s*\([^)]*\)\s*\{([\s\S]+?)\n\s*\}/
      );
      expect(body).not.toBeNull();
      expect(body[1]).toMatch(/hasOnly/);
    });
  });

  describe('collection validation', () => {
    it('/users/{uid}/categories validate keys hasOnly', () => {
      const catMatch = RULES_SOURCE.match(
        /match\s+\/categories\/\{catId\}\s*\{([\s\S]*?)\n\s*\}/
      );
      expect(catMatch).not.toBeNull();
      expect(catMatch[1]).toMatch(/hasOnly\s*\(\s*\[\s*['"]categories['"]\s*\]/);
      expect(catMatch[1]).toMatch(/categories\.all\s*\(\s*isValidCategory\s*\)/);
    });

    it('/users/{uid}/months validate keys hasOnly + list type', () => {
      const monthsMatch = RULES_SOURCE.match(
        /match\s+\/months\/\{monthId\}\s*\{([\s\S]*?)\n\s*\}/
      );
      expect(monthsMatch).not.toBeNull();
      const body = monthsMatch[1];
      expect(body).toMatch(/hasOnly\s*\(\s*\[\s*['"]incomes['"]\s*,\s*['"]expenses['"]\s*,\s*['"]budgets['"]/);
      expect(body).toMatch(/incomes\s+is\s+list/);
      expect(body).toMatch(/expenses\s+is\s+list/);
    });

    it('/users/{uid}/months budgets di-validate sebagai map', () => {
      const monthsMatch = RULES_SOURCE.match(
        /match\s+\/months\/\{monthId\}\s*\{([\s\S]*?)\n\s*\}/
      );
      const body = monthsMatch[1];
      expect(body).toMatch(/budgets\s+is\s+map/);
      expect(body).toMatch(/budgets\.values\(\)\.all\s*\(\s*isValidAmount\s*\)/);
    });

    it('/templates & /migration write deny', () => {
      const templatesMatch = RULES_SOURCE.match(
        /match\s+\/templates\/\{templateId\}\s*\{([\s\S]*?)\n\s*\}/
      );
      expect(templatesMatch).not.toBeNull();
      expect(templatesMatch[1]).toMatch(/allow\s+write:\s*if\s+false/);

      const migrationMatch = RULES_SOURCE.match(
        /match\s+\/migration\/\{migrationId\}\s*\{([\s\S]*?)\n\s*\}/
      );
      expect(migrationMatch).not.toBeNull();
      expect(migrationMatch[1]).toMatch(/allow\s+write:\s*if\s+false/);
    });
  });
});
