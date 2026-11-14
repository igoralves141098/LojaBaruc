import { RotateCcw, SearchX } from 'lucide-react'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import type { Product } from '@/features/catalog/types/product.types'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  onClearFilters: () => void
}

const SKELETON_COUNT = 8

const ProductCardSkeleton = () => (
  <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
    <div className="aspect-square bg-neutral-200/70" />
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3 w-20 rounded bg-neutral-200" />
      <div className="h-5 w-3/4 rounded bg-neutral-200" />
      <div className="h-4 w-full rounded bg-neutral-100" />
      <div className="h-6 w-24 rounded bg-neutral-200" />
      <div className="flex gap-2">
        <div className="h-10 w-10 rounded-lg bg-neutral-100" />
        <div className="h-10 w-10 rounded-lg bg-neutral-100" />
        <div className="h-10 w-10 rounded-lg bg-neutral-100" />
      </div>
      <div className="h-11 w-full rounded-xl bg-baruc-green/20" />
    </div>
  </div>
)

export const ProductGrid = ({ products, isLoading, onClearFilters }: ProductGridProps) => {
  if (isLoading) {
    return (
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Carregando produtos"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-baruc-gold/40 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-baruc-goldLight">
          <SearchX className="h-7 w-7 text-baruc-goldDark" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-baruc-green">Nenhum produto encontrado para sua busca</h2>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Tente outros termos ou selecione uma categoria diferente.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-baruc-gold/30 bg-baruc-green px-5 text-sm font-semibold text-baruc-gold shadow-sm transition-all hover:bg-baruc-greenDark active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </button>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
