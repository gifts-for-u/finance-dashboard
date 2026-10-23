import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDatePicker, CustomSelect } from './CustomInputs';

describe('CustomDatePicker', () => {
  it('merender tombol trigger dengan tanggal yang diformat', () => {
    render(<CustomDatePicker value="23 Okt 2026" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: /Pilih tanggal/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('23 Okt 2026');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('membuka dialog kalender saat trigger diklik', () => {
    render(<CustomDatePicker value="23 Okt 2026" onChange={() => {}} />);
    const trigger = screen.getByRole('button', { name: /Pilih tanggal/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: /Pilih tanggal/i });
    expect(dialog).toBeInTheDocument();

    // Memiliki quick presets
    expect(screen.getByRole('button', { name: /Pilih hari ini/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pilih kemarin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tutup kalender/i })).toBeInTheDocument();

    // Memiliki dropdown bulan dan tahun
    expect(screen.getByLabelText(/Pilih Bulan/i)).toHaveValue('9'); // Okt = 9 (0-indexed)
    expect(screen.getByLabelText(/Pilih Tahun/i)).toHaveValue('2026');
  });

  it('memanggil onChange saat tanggal dipilih dari grid', () => {
    const handleChange = vi.fn();
    render(<CustomDatePicker value="23 Okt 2026" onChange={handleChange} />);
    
    // Buka kalender
    fireEvent.click(screen.getByRole('button', { name: /Pilih tanggal/i }));

    // Klik tanggal 15
    const dayBtn = screen.getByRole('button', { name: /15 Oktober 2026/i });
    fireEvent.click(dayBtn);

    expect(handleChange).toHaveBeenCalledWith('15 Okt 2026');
    // Dialog tertutup setelah memilih
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('memanggil onChange saat tombol quick preset "Hari Ini" diklik', () => {
    const handleChange = vi.fn();
    render(<CustomDatePicker value="01 Jan 2025" onChange={handleChange} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Pilih tanggal/i }));
    const todayBtn = screen.getByRole('button', { name: /Pilih hari ini/i });
    fireEvent.click(todayBtn);

    expect(handleChange).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('menutup dialog saat tombol Escape ditekan', () => {
    render(<CustomDatePicker value="23 Okt 2026" onChange={() => {}} />);
    const trigger = screen.getByRole('button', { name: /Pilih tanggal/i });
    
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('mengubah bulan saat dropdown bulan diubah', () => {
    render(<CustomDatePicker value="23 Okt 2026" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Pilih tanggal/i }));

    const monthSelect = screen.getByLabelText(/Pilih Bulan/i);
    fireEvent.change(monthSelect, { target: { value: '11' } }); // Desember = 11

    expect(screen.getByRole('button', { name: /25 Desember 2026/i })).toBeInTheDocument();
  });
});

describe('CustomSelect', () => {
  const options = [
    { value: 'cat-1', label: 'Makanan & Minuman' },
    { value: 'cat-2', label: 'Transportasi' },
  ];

  it('merender dengan label opsi terpilih dan tombol ber-ARIA', () => {
    render(<CustomSelect value="cat-1" onChange={() => {}} options={options} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Makanan & Minuman');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('membuka opsi dan memanggil onChange saat opsi diklik', () => {
    const handleChange = vi.fn();
    render(<CustomSelect value="cat-1" onChange={handleChange} options={options} />);
    
    fireEvent.click(screen.getByRole('button'));
    const optionBtn = screen.getByRole('option', { name: /Transportasi/i });
    fireEvent.click(optionBtn);

    expect(handleChange).toHaveBeenCalledWith('cat-2');
  });
});
