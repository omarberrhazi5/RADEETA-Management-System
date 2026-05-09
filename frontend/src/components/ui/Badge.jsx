const styles = {
  green:  'bg-green-50  text-green-700  border-green-100',
  red:    'bg-red-50    text-red-700    border-red-100',
  amber:  'bg-amber-50  text-amber-700  border-amber-100',
  blue:   'bg-blue-50   text-blue-700   border-blue-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  gray:   'bg-gray-50   text-gray-500   border-gray-100',
};

const dots = {
  green: 'bg-green-500',
  red:   'bg-red-500',
  amber: 'bg-amber-500',
  blue:  'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  gray:  'bg-gray-400',
};

export default function Badge({ label, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[color]}`} />
      {label}
    </span>
  );
}
