'use client'

import { useState } from 'react'
import { Search, Filter, Download, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, any>) => void
  filters?: Array<{
    label: string
    key: string
    type: 'text' | 'select' | 'range' | 'date'
    options?: Array<{ label: string; value: string }>
    min?: number
    max?: number
  }>
  onExport?: () => void
  placeholder?: string
}

export function SearchFilter({
  onSearch,
  onFilter,
  filters = [],
  onExport,
  placeholder = 'Search properties, names, symbols...'
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const handleFilterChange = (key: string, value: any) => {
    const updated = { ...activeFilters, [key]: value }
    setActiveFilters(updated)
    onFilter(updated)
  }

  const clearFilters = () => {
    setActiveFilters({})
    onFilter({})
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
        <Search size={18} className="text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearch}
          className="bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
        />
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title="Export"
            >
              <Download size={16} className="text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showFilters ? 'bg-secondary' : 'hover:bg-secondary'
            )}
            title="Filters"
          >
            <Filter size={16} className={showFilters ? 'text-primary' : 'text-muted-foreground'} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            {Object.keys(activeFilters).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:text-blue-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {filter.label}
                </label>

                {filter.type === 'text' && (
                  <Input
                    type="text"
                    placeholder={filter.label}
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="bg-card border-border text-foreground text-sm"
                  />
                )}

                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">All</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'range' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      min={filter.min}
                      max={filter.max}
                      value={activeFilters[`${filter.key}_min`] || ''}
                      onChange={(e) =>
                        handleFilterChange(`${filter.key}_min`, e.target.value)
                      }
                      className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      min={filter.min}
                      max={filter.max}
                      value={activeFilters[`${filter.key}_max`] || ''}
                      onChange={(e) =>
                        handleFilterChange(`${filter.key}_max`, e.target.value)
                      }
                      className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
