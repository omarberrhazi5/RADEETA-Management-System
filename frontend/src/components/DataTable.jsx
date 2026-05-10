import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canCreate, canDelete, canUpdate } from '../utils/rbac';
import Button from './ui/Button';
import { EmptyState, LoadingState } from './PageState';

function valueFor(row, key) {
  const value = row[key];
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function searchableText(row) {
  return Object.values(row)
    .map((value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
    .join(' ')
    .toLowerCase();
}

export default function DataTable({
  title,
  subtitle,
  resource,
  role,
  columns,
  rows,
  loading,
  onCreate,
  onEdit,
  onDelete,
  filters,
  emptyMessage,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: columns[0]?.key, direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const showCreate = onCreate && canCreate(role, resource);
  const showEdit = onEdit && canUpdate(role, resource);
  const showDelete = onDelete && canDelete(role, resource);
  const showActions = showEdit || showDelete;
  const visibleRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = search ? rows.filter((row) => searchableText(row).includes(search)) : rows;
    const sorted = [...filtered].sort((a, b) => {
      const left = valueFor(a, sort.key);
      const right = valueFor(b, sort.key);
      return sort.direction === 'asc' ? left.localeCompare(right, undefined, { numeric: true }) : right.localeCompare(left, undefined, { numeric: true });
    });

    return sorted;
  }, [query, rows, sort]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
        </div>
        {showCreate && (
          <Button variant="primary" onClick={onCreate}>
            <Plus size={15} />
            {t('buttons.addNew')}
          </Button>
        )}
      </div>

      <div className="sticky top-16 z-10 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)] backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t('common.searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
        {(query || filters) && (
          <div className="mt-2 text-xs font-medium text-slate-500">
            {t('common.showing', { visible: visibleRows.length, total: rows.length })}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : visibleRows.length === 0 ? (
        <EmptyState message={emptyMessage ?? t('common.emptyFiltered')} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 transition duration-300 hover:text-slate-900">
                        {column.header}
                        {sort.key === column.key ? (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                      </button>
                    </th>
                  ))}
                  {showActions && (
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t('common.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRows.map((row) => (
                  <tr key={row.id ?? row.id_client ?? row.id_compteur ?? row.id_panne ?? row.id_reparation} className="transition duration-300 hover:bg-[var(--srm-green-soft)]">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {column.render ? column.render(row) : row[column.key] ?? '-'}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          {showEdit && (
                            <button type="button" onClick={() => onEdit(row)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition duration-300 hover:bg-[var(--srm-green-soft)] hover:text-[var(--srm-green)]" title={t('buttons.edit')}>
                              <Pencil size={15} strokeWidth={1.5} />
                            </button>
                          )}
                          {showDelete && (
                            <button type="button" onClick={() => onDelete(row)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition duration-300 hover:bg-[var(--srm-red-soft)] hover:text-[var(--srm-red)]" title={t('buttons.delete')}>
                              <Trash2 size={15} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {t('common.pageOf', { current: currentPage, total: totalPages })} - {t('common.records', { count: visibleRows.length })}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft size={15} />
                {t('buttons.previous')}
              </Button>
              <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                {t('buttons.next')}
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
