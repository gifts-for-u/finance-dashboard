import React from 'react';
import { WifiOff, Plus } from 'lucide-react';

export const OfflineBanner = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-medium"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <span>
        Mode Offline — Menampilkan data tersimpan di perangkat. Perubahan akan disinkronkan saat koneksi kembali.
      </span>
    </div>
  );
};

export const SkeletonCard = ({ count = 6 }) => {
  return (
    <div
      role="status"
      aria-label="Memuat ringkasan data"
      className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8 mb-8"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-card p-5 sm:p-6 md:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4 min-h-[145px] sm:min-h-[160px] md:min-h-[190px] motion-safe:animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-800/70" />
          </div>
          <div className="space-y-2.5">
            <div className="h-6 md:h-8 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList = ({ count = 4 }) => {
  return (
    <div role="status" aria-label="Memuat daftar transaksi" className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 motion-safe:animate-pulse"
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1 max-w-[180px]">
              <div className="h-4 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <div className="h-4 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-12 rounded-md bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'primary',
}) => {
  const iconContainerClass =
    variant === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-primary/10 text-primary';

  const buttonClass =
    variant === 'destructive'
      ? 'bg-destructive text-destructive-foreground shadow-destructive/20 focus:ring-destructive/30'
      : 'bg-primary text-primary-foreground shadow-primary/20 focus:ring-primary/30';

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      {Icon && (
        <div className={`p-4 rounded-3xl mb-4 ${iconContainerClass}`} aria-hidden="true">
          <Icon className="w-7 h-7" aria-hidden="true" />
        </div>
      )}
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-4 ${buttonClass}`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
