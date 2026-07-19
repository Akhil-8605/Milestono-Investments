'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T
  label: string
  width?: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: keyof T
  onRowClick?: (row: T) => void
  sortable?: boolean
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  sortable = true,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T
    direction: 'asc' | 'desc'
  } | null>(null)

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (aVal === bVal) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        return 0
      })
    : data

  const handleSort = (key: keyof T) => {
    if (!sortable) return

    setSortConfig((prev) =>
      prev?.key === key && prev.direction === 'asc'
        ? { key, direction: 'desc' }
        : { key, direction: 'asc' }
    )
  }

  return (
    <div className="overflow-x-auto bg-card border border-border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-6 py-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider',
                  col.width,
                  col.sortable !== false && sortable && 'cursor-pointer hover:text-foreground'
                )}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortable && col.sortable !== false && (
                    <span className="opacity-50">
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={String(row[rowKey])}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border hover:bg-secondary/50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn('px-6 py-4 text-foreground', col.width)}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {sortedData.length === 0 && (
        <div className="px-6 py-12 text-center text-muted-foreground">
          No data found
        </div>
      )}
    </div>
  )
}
