export default function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   val: 'text-gray-800' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  val: 'text-gray-800' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    val: 'text-red-600'  },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  val: 'text-gray-800' },
  };

  const c = colors[color];

  return (
    <div className="flex min-h-[116px] items-center gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <div className={`${c.bg} ${c.text} flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="text-xs font-medium leading-5 text-gray-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-semibold leading-8 ${c.val}`}>{value}</p>
        {sub && (
          <p className="mt-0.5 text-xs leading-5 text-gray-400">{sub}</p>
        )}
      </div>
    </div>
  );
}
