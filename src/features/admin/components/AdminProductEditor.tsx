import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { deriveNiche, slugify } from '@/features/catalog/product-normalizer'
import { OFFICIAL_SIZES, type Product, type ProductTechnicalSheet } from '@/features/catalog/types/product.types'

interface AdminProductEditorProps {
  product: Product | null
  isSaving: boolean
  error: string
  onSave: (product: Product) => void
  onCancel: () => void
}

interface ProductFormState {
  name: string
  sku: string
  category: string
  price: string
  stock: string
  imageUrl: string
  badge: string
  colors: string
  sizes: string
  description: string
  fullDescription: string
  fabric: string
  fit: string
  composition: string
  origin: string
  care: string
  specifications: string
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const TEXTAREA_CLASS =
  'min-h-24 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wide text-neutral-500'

const toFormState = (product: Product | null): ProductFormState => ({
  name: product?.name ?? '',
  sku: product?.sku ?? '',
  category: product?.category ?? '',
  price: product?.price === null || product?.price === undefined ? '' : String(product.price),
  stock: product ? String(product.stock) : '10',
  imageUrl: product?.imageUrl ?? '',
  badge: product?.badge ?? '',
  colors: product?.colors.join(', ') ?? '',
  sizes: (product?.sizes ?? [...OFFICIAL_SIZES]).join(', '),
  description: product?.description ?? '',
  fullDescription: product?.fullDescription ?? '',
  fabric: product?.technicalSheet?.fabric ?? '',
  fit: product?.technicalSheet?.fit ?? '',
  composition: product?.technicalSheet?.composition ?? '',
  origin: product?.technicalSheet?.origin ?? '',
  care: product?.technicalSheet?.care ?? '',
  specifications: product?.specifications?.join('\n') ?? '',
})

const splitList = (value: string): string[] =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const buildTechnicalSheet = (form: ProductFormState): ProductTechnicalSheet | undefined => {
  const sheet: ProductTechnicalSheet = {}
  if (form.fabric.trim()) sheet.fabric = form.fabric.trim()
  if (form.fit.trim()) sheet.fit = form.fit.trim()
  if (form.composition.trim()) sheet.composition = form.composition.trim()
  if (form.origin.trim()) sheet.origin = form.origin.trim()
  if (form.care.trim()) sheet.care = form.care.trim()
  return Object.keys(sheet).length > 0 ? sheet : undefined
}

export const AdminProductEditor = ({ product, isSaving, error, onSave, onCancel }: AdminProductEditorProps) => {
  const [form, setForm] = useState<ProductFormState>(() => toFormState(product))
  const [validationError, setValidationError] = useState<string>('')
  const formId = useId()

  const update = (field: keyof ProductFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError('')

    const name = form.name.trim()
    if (name.length === 0) {
      setValidationError('Informe o nome do produto.')
      return
    }

    const stock = Number.parseInt(form.stock, 10)
    if (!Number.isFinite(stock) || stock < 0) {
      setValidationError('Informe uma quantidade de estoque válida (0 ou mais).')
      return
    }

    const priceValue = form.price.trim() === '' ? null : Number(form.price.replace(',', '.'))
    if (priceValue !== null && !Number.isFinite(priceValue)) {
      setValidationError('Informe um preço válido.')
      return
    }

    const category = form.category.trim() || 'Camisas'
    const specifications = form.specifications
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    const sizes = splitList(form.sizes)

    const nextProduct: Product = {
      id: product?.id ?? `${slugify(name) || 'produto'}-${Date.now().toString(36)}`,
      sku: form.sku.trim() || name.toUpperCase().slice(0, 12),
      name,
      description: form.description.trim() || form.fullDescription.trim() || name,
      price: priceValue,
      originalPrice: product?.originalPrice,
      imageUrl: form.imageUrl.trim(),
      category,
      categorySlug: slugify(category),
      niche: deriveNiche(category),
      sizes: sizes.length > 0 ? sizes : [...OFFICIAL_SIZES],
      colors: splitList(form.colors),
      inStock: stock > 0,
      stock,
      fullDescription: form.fullDescription.trim() || undefined,
      technicalSheet: buildTechnicalSheet(form),
      specifications: specifications.length > 0 ? specifications : undefined,
      badge: form.badge.trim() || undefined,
    }

    onSave(nextProduct)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div onClick={onCancel} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-baruc-gold/25 bg-baruc-green px-5 py-4 text-baruc-gold">
          <h2 className="font-serif text-xl font-semibold">{product ? 'Editar produto' : 'Novo produto'}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar editor"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form id={formId} onSubmit={handleSubmit} className="no-scrollbar flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={LABEL_CLASS}>Nome</label>
              <input className={INPUT_CLASS} value={form.name} onChange={update('name')} placeholder="Camisa Linho Premium" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>SKU</label>
              <input className={INPUT_CLASS} value={form.sku} onChange={update('sku')} placeholder="BRC-CLP-01" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Categoria / Modelo</label>
              <input className={INPUT_CLASS} value={form.category} onChange={update('category')} placeholder="Camisa Linho" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Preço (R$)</label>
              <input
                className={INPUT_CLASS}
                inputMode="decimal"
                value={form.price}
                onChange={update('price')}
                placeholder="129.90"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Estoque</label>
              <input
                className={INPUT_CLASS}
                type="number"
                min={0}
                inputMode="numeric"
                value={form.stock}
                onChange={update('stock')}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={LABEL_CLASS}>URL da imagem</label>
              <input
                className={INPUT_CLASS}
                value={form.imageUrl}
                onChange={update('imageUrl')}
                placeholder="produtos/camisa-linho/camisa-linho-01.jpg ou https://..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Cores (separadas por vírgula)</label>
              <input className={INPUT_CLASS} value={form.colors} onChange={update('colors')} placeholder="Preto, Bege" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Tamanhos (separados por vírgula)</label>
              <input className={INPUT_CLASS} value={form.sizes} onChange={update('sizes')} placeholder="P, M, G, GG" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Selo (opcional)</label>
              <input className={INPUT_CLASS} value={form.badge} onChange={update('badge')} placeholder="Novo" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Descrição curta</label>
              <input className={INPUT_CLASS} value={form.description} onChange={update('description')} placeholder="Camisa com caimento premium." />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={LABEL_CLASS}>Descrição completa</label>
              <textarea
                className={TEXTAREA_CLASS}
                value={form.fullDescription}
                onChange={update('fullDescription')}
                placeholder="Detalhes da peça, caimento, ocasião de uso..."
              />
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-baruc-green">Ficha Técnica</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Tecido</label>
                <input className={INPUT_CLASS} value={form.fabric} onChange={update('fabric')} placeholder="Linho" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Modelagem</label>
                <input className={INPUT_CLASS} value={form.fit} onChange={update('fit')} placeholder="Regular" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Composição</label>
                <input className={INPUT_CLASS} value={form.composition} onChange={update('composition')} placeholder="100% algodão" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Origem</label>
                <input className={INPUT_CLASS} value={form.origin} onChange={update('origin')} placeholder="Brasil" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={LABEL_CLASS}>Cuidados</label>
                <input className={INPUT_CLASS} value={form.care} onChange={update('care')} placeholder="Lavar à mão em água fria" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Especificações (uma por linha)
            </label>
            <textarea
              className={TEXTAREA_CLASS}
              value={form.specifications}
              onChange={update('specifications')}
              placeholder={'Costura reforçada\nToque macio\nNão encolhe'}
            />
          </div>

          {(validationError || error) && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {validationError || error}
            </p>
          )}
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 bg-baruc-cream px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSaving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-5 text-sm font-bold text-baruc-gold transition-all hover:bg-baruc-greenDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Salvar produto
          </button>
        </div>
      </div>
    </div>
  )
}
