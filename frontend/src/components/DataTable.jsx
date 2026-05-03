import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {showCreate && (
          <Button variant="primary" onClick={onCreate}>
            <Plus size={15} />
            Add New
          </Button>
        )}
      </div>

      <div className="sticky top-16 z-10 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="h-11 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
        {(query || filters) && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {visibleRows.length} of {rows.length} records
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : visibleRows.length === 0 ? (
        <EmptyState message={emptyMessage ?? `No ${title.toLowerCase()} found for the current filters.`} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 hover:text-gray-900">
                        {column.header}
                        {sort.key === column.key ? (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                      </button>
                    </th>
                  ))}
                  {showActions && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedRows.map((row) => (
                  <tr key={row.id ?? row.id_client ?? row.id_compteur ?? row.id_panne ?? row.id_reparation} className="transition hover:bg-blue-50/40">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {column.render ? column.render(row) : row[column.key] ?? '-'}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {showEdit && (
                            <button type="button" onClick={() => onEdit(row)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-blue-50 hover:text-blue-700" title="Edit">
                              <Pencil size={15} />
                            </button>
                          )}
                          {showDelete && (
                            <button type="button" onClick={() => onDelete(row)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700" title="Delete">
                              <Trash2 size={15} />
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
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Page {currentPage} of {totalPages} - {visibleRows.length} records
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft size={15} />
                Previous
              </Button>
              <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                Next
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
