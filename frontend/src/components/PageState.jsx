import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingState({ label }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500 shadow-sm">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label ?? t('common.loading')}
    </div>
  );
}

export function SkeletonGrid({ cards = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="mt-4 h-8 w-16 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function EmptyState({ message }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
        <span className="text-lg font-semibold">SRM</span>
      </div>
      <p className="font-medium text-gray-700">{message ?? t('common.noData')}</p>
    </div>
  );
}
