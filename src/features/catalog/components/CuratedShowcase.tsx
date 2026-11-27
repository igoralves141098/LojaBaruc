import { useState } from 'react'
import { ArrowRight, Eye } from 'lucide-react'
import { ProductColorPicker } from '@/features/catalog/components/ProductColorPicker'
import { getMacroCategory, MACRO_CATEGORIES, type MacroCategory } from '@/features/catalog/hooks/useCatalog'
import { isOutOfStock } from '@/features/catalog/stock'
import type { Product } from '@/features/catalog/types/product.types'
import { formatCurrency } from '@/utils/formatters'

interface CuratedShowcaseProps {
  products: Product[]
  onSelectCategory: (category: MacroCategory) => void
  onOpenProduct: (product: Product) => void
}

interface ShowcaseCardProps {
  product: Product
  onOpen: () => void
}

const ShowcaseCard = ({ product, onOpen }: ShowcaseCardProps) => {
  const variants = product.variants ?? []
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(variants[0]?.id)
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
  const displayImage = selectedVariant?.imageUrl || product.imageUrl
  const outOfStock = isOutOfStock(product)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative block aspect-[4/5] overflow-hidden bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baruc-gold"
      >
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={640}
          height={800}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            outOfStock ? 'opacity-60 grayscale' : ''
          }`}
        />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full border border-baruc-gold/50 bg-baruc-green px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-baruc-gold">
            Esgotado
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <button
          type="button"
          onClick={onOpen}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
        >
          <h4 className="line-clamp-1 font-serif text-lg font-semibold leading-tight text-baruc-green">
            {product.name}
          </h4>
        </button>
        <p className="font-bold text-neutral-900">{formatCurrency(product.price ?? 0)}</p>

        {variants.length > 0 && (
          <div className="mt-1">
            <ProductColorPicker
              variants={variants}
              selectedId={selectedVariantId}
              onSelect={(variant) => setSelectedVariantId(variant.id)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onOpen}
          className="mt-2 inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border border-baruc-green/20 bg-baruc-cream px-3 text-xs font-semibold text-baruc-green transition-colors hover:border-baruc-gold hover:bg-baruc-goldLight active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Ver detalhes
        </button>
      </div>
    </article>
  )
}

export const CuratedShowcase = ({ products, onSelectCategory, onOpenProduct }: CuratedShowcaseProps) => {
  const groups = MACRO_CATEGORIES.map((niche) => {
    const items = products
      .filter((product) => getMacroCategory(product.category) === niche)
      .sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b)))
      .slice(0, 2)
    return { niche, items }
  }).filter((group) => group.items.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ niche, items }) => (
        <section key={niche} className="flex flex-col gap-4" aria-labelledby={`showcase-${niche}`}>
          <div className="flex items-end justify-between gap-3 border-b border-baruc-gold/25 pb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-baruc-goldDark">
                Destaques
              </span>
              <h2 id={`showcase-${niche}`} className="font-serif text-2xl font-semibold text-baruc-green sm:text-3xl">
                {niche}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectCategory(niche)}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-baruc-gold/50 bg-baruc-green px-4 text-xs font-semibold text-baruc-gold transition-colors hover:bg-baruc-greenDark active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
            >
              Ver todas as {niche}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-5">
            {items.map((product) => (
              <li key={product.id}>
                <ShowcaseCard product={product} onOpen={() => onOpenProduct(product)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
