const styles = {
  green:  'bg-[var(--srm-green-soft)] text-[var(--srm-green)] border-[var(--srm-green)]',
  red:    'bg-[var(--srm-red-soft)] text-[var(--srm-red)] border-[var(--srm-red)]',
  amber:  'bg-amber-50  text-amber-700  border-amber-100',
  blue:   'bg-[var(--srm-green-soft)] text-[var(--srm-green)] border-[var(--srm-green)]',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  gray:   'bg-gray-50   text-gray-500   border-gray-100',
};

const dots = {
  green: 'bg-[var(--srm-green)]',
  red:   'bg-[var(--srm-red)]',
  amber: 'bg-amber-500',
  blue:  'bg-[var(--srm-green)]',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  gray:  'bg-gray-400',
};

export default function Badge({ label, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[color]}`} />
      {label}
    </span>
  );
}
