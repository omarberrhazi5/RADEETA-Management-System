export default function ConsumptionChart({ releves = [] }) {
  const rows = releves.slice(0, 8).reverse();
  const max = Math.max(1, ...rows.map((row) => Number(row.consommation ?? 0)));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Consumption history</h3>
        <p className="text-xs text-gray-500">Latest readings by period</p>
      </div>
      <div className="flex h-52 items-end gap-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-1 items-center justify-center text-sm text-gray-500">No readings yet.</div>
        ) : rows.map((row) => {
          const value = Number(row.consommation ?? 0);
          return (
            <div key={row.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-md bg-gray-50">
                <div
                  className="w-full rounded-md bg-blue-600"
                  style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
                  title={`${value} units`}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-800">{value}</div>
                <div className="truncate text-[10px] text-gray-500">{row.periode_fin ?? '-'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
