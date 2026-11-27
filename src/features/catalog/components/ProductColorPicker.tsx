import type { ProductColorVariant } from '@/features/catalog/types/product.types'

interface ProductColorPickerProps {
  variants: ProductColorVariant[]
  selectedId?: string
  onSelect: (variant: ProductColorVariant) => void
  disabled?: boolean
}

export const ProductColorPicker = ({ variants, selectedId, onSelect, disabled = false }: ProductColorPickerProps) => {
  if (variants.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-500">
        Cores disponíveis:{' '}
        <span className="font-semibold text-neutral-800">
          {variants.find((variant) => variant.id === selectedId)?.colorName}
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cores disponíveis">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={variant.colorName}
              title={variant.colorName}
              disabled={disabled}
              onClick={() => onSelect(variant)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-1 ${
                isSelected
                  ? 'border-baruc-gold ring-2 ring-baruc-green ring-offset-1'
                  : 'border-neutral-300 hover:border-baruc-gold'
              }`}
            >
              <span
                className="h-full w-full rounded-full"
                style={{ backgroundColor: variant.colorHex }}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
