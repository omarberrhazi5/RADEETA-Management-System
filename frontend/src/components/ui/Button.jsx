import { Loader } from 'lucide-react';

const variants = {
  primary:  'border-[var(--srm-green)] bg-[var(--srm-green)] text-white shadow-[0_10px_24px_rgb(112_184_48_/_0.18)] hover:bg-[var(--srm-green-dark)]',
  secondary:'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  danger:   'border-[var(--srm-red)] bg-[var(--srm-red-soft)] text-[var(--srm-red)] hover:bg-[var(--srm-red-soft)]',
  success:  'border-[var(--srm-green)] bg-[var(--srm-green-soft)] text-[var(--srm-green)] hover:bg-[var(--srm-green-soft)]',
};

export default function Button({
  children,
  onClick,
  variant = 'secondary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${variants[variant]} ${className}`}
    >
      {loading && <Loader size={12} strokeWidth={1.5} className="animate-spin" />}
      {children}
    </button>
  );
}
