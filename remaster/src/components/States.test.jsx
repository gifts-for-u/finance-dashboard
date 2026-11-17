import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Wallet } from 'lucide-react';
import { OfflineBanner, SkeletonCard, SkeletonList, EmptyState } from './States';

describe('OfflineBanner', () => {
  it('tidak merender apa pun saat status online', () => {
    const { container } = render(<OfflineBanner isOffline={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('merender banner dengan role status dan aria-live polite saat offline', () => {
    render(<OfflineBanner isOffline={true} />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent(/Mode Offline/i);
  });
});

describe('SkeletonCard & SkeletonList', () => {
  it('merender SkeletonCard dengan role status dan motion-safe:animate-pulse', () => {
    const { container } = render(<SkeletonCard count={3} />);
    const status = screen.getByRole('status', { name: /Memuat ringkasan data/i });
    expect(status).toBeInTheDocument();
    const pulses = container.querySelectorAll('.motion-safe\\:animate-pulse');
    expect(pulses).toHaveLength(3);
  });

  it('merender SkeletonList dengan role status dan motion-safe:animate-pulse', () => {
    const { container } = render(<SkeletonList count={4} />);
    const status = screen.getByRole('status', { name: /Memuat daftar transaksi/i });
    expect(status).toBeInTheDocument();
    const pulses = container.querySelectorAll('.motion-safe\\:animate-pulse');
    expect(pulses).toHaveLength(4);
  });
});

describe('EmptyState', () => {
  it('merender judul, deskripsi, dan memanggil onAction saat tombol CTA diklik', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        icon={Wallet}
        title="Belum ada pemasukan"
        description="Catat pemasukan pertama Anda."
        actionLabel="Tambah Pemasukan"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('Belum ada pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Catat pemasukan pertama Anda.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Tambah Pemasukan/i });
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
