export default function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   val: 'text-gray-800' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  val: 'text-gray-800' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    val: 'text-red-600'  },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  val: 'text-gray-800' },
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      {/* Icon bubble */}
      <div className={`${c.bg} ${c.text} p-2.5 rounded-lg flex-shrink-0`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-2xl font-semibold mt-0.5 ${c.val}`}>{value}</p>
        {sub && (
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}