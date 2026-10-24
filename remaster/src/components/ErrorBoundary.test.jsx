import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Komponen yang sengaja melempar error untuk menguji fallback
const ProblemChild = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test render crash');
  }
  return <div>Konten Normal Berhasil Dirender</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress console.error output during deliberate throw test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('merender children secara normal ketika tidak ada error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Konten Normal Berhasil Dirender')).toBeInTheDocument();
  });

  it('menangkap error dan menampilkan UI fallback dengan tombol reload', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Terjadi Kesalahan pada Halaman')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /muat ulang halaman/i })).toBeInTheDocument();
  });
});
