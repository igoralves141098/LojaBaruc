import { ALL_CATEGORIES, type CategoryFilterValue } from '@/features/catalog/hooks/useCatalog'

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: CategoryFilterValue
  onSelect: (category: CategoryFilterValue) => void
}

export const CategoryFilter = ({ categories, selectedCategory, onSelect }: CategoryFilterProps) => {
  const options: CategoryFilterValue[] = [ALL_CATEGORIES, ...categories]

  return (
    <nav aria-label="Filtrar por categoria" className="-mx-4 sm:mx-0">
      <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-1 sm:flex-wrap sm:px-0">
        {options.map((category) => {
          const isActive = category === selectedCategory
          return (
            <li key={category} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onSelect(category)}
                aria-pressed={isActive}
                className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 text-sm transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 ${
                  isActive
                    ? 'border border-baruc-gold bg-baruc-green font-semibold text-baruc-gold shadow-sm'
                    : 'border border-neutral-200 bg-white font-medium text-neutral-700 hover:border-baruc-gold'
                }`}
              >
                {category}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
