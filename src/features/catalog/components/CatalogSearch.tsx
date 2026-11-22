import { Search, X } from 'lucide-react'

interface CatalogSearchProps {
  value: string
  onChange: (value: string) => void
}

export const CatalogSearch = ({ value, onChange }: CatalogSearchProps) => {
  const hasValue = value.length > 0

  return (
    <div className="rounded-2xl border border-baruc-gold/30 bg-white p-3 shadow-sm sm:p-4">
      <label htmlFor="page-catalog-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-baruc-goldDark">
        Encontre sua peça
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-baruc-goldDark"
          aria-hidden="true"
        />
        <input
          id="page-catalog-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Busque por nome, categoria, cor, SKU ou descrição..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-baruc-cream pl-12 pr-12 text-base text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpar busca"
            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-baruc-green active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
