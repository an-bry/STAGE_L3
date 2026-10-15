import { type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyState?: ReactNode;
  loading?: boolean;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sortBy,
  sortDir = 'asc',
  onSort,
  emptyState,
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-card border border-line rounded-lg p-8 text-center text-sm text-ink-soft">
        Chargement...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-card border border-line rounded-lg">
        {emptyState || (
          <div className="p-12 text-center text-sm text-ink-soft">Aucune donnée.</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink-soft text-left">
            <tr>
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`
                      px-4 py-2.5 font-medium text-xs uppercase tracking-wide whitespace-nowrap
                      ${col.align === 'right' ? 'text-right' : ''}
                      ${col.align === 'center' ? 'text-center' : ''}
                    `}
                  >
                    {col.sortable && onSort ? (
                      <button
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-ink transition-colors"
                      >
                        {col.header}
                        {isSorted ? (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ChevronDown size={12} className="opacity-30" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-surface' : ''} transition-colors`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-4 py-3 text-ink
                      ${col.align === 'right' ? 'text-right' : ''}
                      ${col.align === 'center' ? 'text-center' : ''}
                    `}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}