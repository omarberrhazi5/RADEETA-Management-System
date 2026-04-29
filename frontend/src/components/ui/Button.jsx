import { Loader } from 'lucide-react';

const variants = {
  primary:  'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
  secondary:'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
  danger:   'bg-red-50 hover:bg-red-100 text-red-600 border-red-100',
  success:  'bg-green-50 hover:bg-green-100 text-green-600 border-green-100',
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Loader size={12} className="animate-spin" />}
      {children}
    </button>
  );
}
