// Vitest setup file.
// Auto-load jest-dom matchers (toBeInTheDocument, dll.) untuk komponen test.
import '@testing-library/jest-dom/vitest';

// Polyfill crypto.randomUUID untuk environment Node lama.
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}
