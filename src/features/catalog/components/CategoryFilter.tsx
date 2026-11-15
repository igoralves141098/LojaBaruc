import { X } from 'lucide-react'
import {
  MAIN_TABS,
  getMacroCategory,
  isMainTab,
  type CategoryFilterValue,
} from '@/features/catalog/hooks/useCatalog'

interface CategoryFilterProps {
  categories?: string[]
  selectedCategory: CategoryFilterValue
  onSelect: (category: CategoryFilterValue) => void
}

export const CategoryFilter = ({ selectedCategory, onSelect }: CategoryFilterProps) => {
  const isSubcategorySelected = !isMainTab(selectedCategory)
  const activeTab = isSubcategorySelected ? getMacroCategory(selectedCategory) : selectedCategory

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filtrar por categoria" className="-mx-4 sm:mx-0">
        <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-1 sm:flex-wrap sm:px-0">
          {MAIN_TABS.map((tab) => {
            const isActive = tab === activeTab
            return (
              <li key={tab} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => onSelect(tab)}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 text-sm transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border border-baruc-gold bg-baruc-green font-semibold text-baruc-gold shadow-sm'
                      : 'border border-neutral-200 bg-white font-medium text-neutral-700 hover:border-baruc-gold'
                  }`}
                >
                  {tab}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {isSubcategorySelected && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Modelo selecionado:</span>
          <button
            type="button"
            onClick={() => onSelect(activeTab)}
            aria-label={`Remover filtro de subcategoria ${selectedCategory} e ver tudo em ${activeTab}`}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-baruc-gold/60 bg-baruc-goldLight px-3.5 py-1 text-xs font-semibold text-baruc-green transition-colors hover:bg-baruc-gold/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <span>{selectedCategory}</span>
            <X className="h-3.5 w-3.5 text-baruc-green" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
