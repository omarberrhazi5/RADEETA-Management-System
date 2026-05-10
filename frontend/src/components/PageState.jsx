import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingState({ label }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm font-medium text-slate-500 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--srm-green)]" strokeWidth={1.5} />
      {label ?? t('common.loading')}
    </div>
  );
}

export function SkeletonGrid({ cards = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-[var(--srm-red-soft)] px-4 py-3 text-sm font-medium text-[var(--srm-red)]">
      {message}
    </div>
  );
}

export function EmptyState({ message }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-[0_8px_30px_rgb(0_0_0_/_0.03)]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--srm-green-soft)] text-[var(--srm-green)]">
        <span className="text-lg font-semibold">SRM</span>
      </div>
      <p className="font-semibold text-slate-700">{message ?? t('common.noData')}</p>
    </div>
  );
}
