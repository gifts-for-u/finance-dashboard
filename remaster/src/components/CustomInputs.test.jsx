import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDatePicker, CustomSelect, CurrencyInput } from './CustomInputs';
import { formatNumberWithDots } from '../utils/formatter';

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

describe('CurrencyInput', () => {
  it('merender input dengan nilai yang diformat dan prefix Rp', () => {
    render(<CurrencyInput value="50000" onChange={() => {}} placeholder="0" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('50.000');
    expect(screen.getByText('Rp')).toHaveAttribute('aria-hidden', 'true');
  });

  it('memiliki atribut aksesibilitas input numeric mobile yang tepat', () => {
    render(
      <CurrencyInput 
        value="" 
        onChange={() => {}} 
        id="test-amount"
        aria-label="Nominal Pengeluaran"
      />
    );
    
    const input = screen.getByRole('textbox', { name: 'Nominal Pengeluaran' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('pattern', '[0-9.]*');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('id', 'test-amount');
  });

  it('mengirimkan unformatted raw digits ke callback onChange', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value="1000" onChange={handleChange} name="amount" />);
    
    const input = screen.getByRole('textbox');
    // Simulasikan user mengetik '0' di belakang '1.000'
    fireEvent.change(input, { target: { value: '1.0000' } });
    
    expect(handleChange).toHaveBeenCalled();
    const eventArg = handleChange.mock.calls[0][0];
    expect(eventArg.target.value).toBe('10000');
    expect(eventArg.target.name).toBe('amount');
  });

  it('menormalkan leading zero saat user mengetik angka setelah 0', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value="0" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '05' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].target.value).toBe('5');
  });

  it('merender varian destructive dengan styling yang sesuai', () => {
    render(<CurrencyInput value="25000" onChange={() => {}} variant="destructive" />);
    
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('text-destructive');
  });
});
