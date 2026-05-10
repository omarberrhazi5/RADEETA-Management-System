import { useState } from 'react';

export default function BrandLogo({ compact = false, className = '' }) {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {imageAvailable ? (
        <img
          src="/srm-logo.jpeg"
          alt="SRM-FM"
          onError={() => setImageAvailable(false)}
          className={`${compact ? 'h-10 max-w-24' : 'h-14 max-w-36'} w-auto object-contain`}
        />
      ) : (
        <div className={`${compact ? 'h-10 w-10 text-xs' : 'h-12 w-12 text-sm'} flex flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--srm-green)] font-bold tracking-tight text-white shadow-[0_12px_28px_rgb(112_184_48_/_0.18)]`}>
          SRM
        </div>
      )}

      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-base font-bold tracking-tight text-slate-800">SRM-FM</div>
          <div className="text-xs font-medium text-slate-500">Fes-Meknes</div>
        </div>
      )}
    </div>
  );
}
