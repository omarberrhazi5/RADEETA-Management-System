export default function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-[var(--srm-green-soft)]', text: 'text-[var(--srm-green)]', val: 'text-slate-800' },
    green:  { bg: 'bg-[var(--srm-green-soft)]', text: 'text-[var(--srm-green)]', val: 'text-slate-800' },
    red:    { bg: 'bg-[var(--srm-red-soft)]', text: 'text-[var(--srm-red)]', val: 'text-[var(--srm-red)]' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  val: 'text-gray-800' },
  };

  const c = colors[color];

  return (
    <div className="flex min-h-[116px] items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)] transition duration-300 hover:scale-[1.02]">
      <div className={`${c.bg} ${c.text} flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg`}>
        <Icon size={18} strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="text-xs font-semibold leading-5 text-slate-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-semibold leading-8 ${c.val}`}>{value}</p>
        {sub && (
          <p className="mt-0.5 text-xs font-medium leading-5 text-slate-400">{sub}</p>
        )}
      </div>
    </div>
  );
}
