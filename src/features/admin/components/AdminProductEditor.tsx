import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Loader2, Palette, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import { deriveNiche, slugify } from '@/features/catalog/product-normalizer'
import {
  OFFICIAL_SIZES,
  type Product,
  type ProductColorVariant,
  type ProductTechnicalSheet,
} from '@/features/catalog/types/product.types'
import { uploadProductImage } from '@/services/imageUpload'

interface AdminProductEditorProps {
  product: Product | null
  isSaving: boolean
  error: string
  onSave: (product: Product) => void
  onCancel: () => void
}

interface VariantFormState {
  id: string
  colorName: string
  colorHex: string
  imageUrl: string
  sizes: Record<string, string>
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
  variants: VariantFormState[]
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const TEXTAREA_CLASS =
  'min-h-24 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wide text-neutral-500'

const QUICK_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'Preto', hex: '#111111' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Verde', hex: '#233827' },
  { name: 'Azul Marinho', hex: '#1B2A4A' },
  { name: 'Bege', hex: '#D8C3A5' },
  { name: 'Cinza', hex: '#9CA3AF' },
  { name: 'Vinho', hex: '#6E1F2A' },
]

const createEmptyVariant = (): VariantFormState => ({
  id: `variant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  colorName: '',
  colorHex: '#233827',
  imageUrl: '',
  sizes: Object.fromEntries(OFFICIAL_SIZES.map((size) => [size, '0'])),
})

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
  variants:
    product?.variants?.map((variant) => ({
      id: variant.id,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      imageUrl: variant.imageUrl,
      sizes: {
        ...Object.fromEntries(OFFICIAL_SIZES.map((size) => [size, '0'])),
        ...Object.fromEntries(variant.sizes.map((entry) => [entry.size, String(entry.stock)])),
      },
    })) ?? [],
})

const splitList = (value: string): string[] =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const toStockNumber = (value: string): number => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

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
  const [isUploadingMain, setIsUploadingMain] = useState<boolean>(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)
  const formId = useId()

  const update = (field: keyof ProductFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addVariant = () => {
    setForm((current) => ({ ...current, variants: [...current.variants, createEmptyVariant()] }))
  }

  const removeVariant = (id: string) => {
    setForm((current) => ({ ...current, variants: current.variants.filter((variant) => variant.id !== id) }))
  }

  const updateVariant = (id: string, patch: Partial<Omit<VariantFormState, 'id' | 'sizes'>>) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    }))
  }

  const updateVariantSize = (id: string, size: string, value: string) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, sizes: { ...variant.sizes, [size]: value } } : variant,
      ),
    }))
  }

  const handleMainImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setValidationError('')
    setIsUploadingMain(true)
    try {
      const url = await uploadProductImage(file)
      setForm((current) => ({ ...current, imageUrl: url }))
    } catch (uploadError) {
      setValidationError(uploadError instanceof Error ? uploadError.message : 'Falha ao enviar a imagem.')
    } finally {
      setIsUploadingMain(false)
    }
  }

  const handleVariantImageChange = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setValidationError('')
    setUploadingVariantId(id)
    try {
      const url = await uploadProductImage(file)
      updateVariant(id, { imageUrl: url })
    } catch (uploadError) {
      setValidationError(uploadError instanceof Error ? uploadError.message : 'Falha ao enviar a imagem.')
    } finally {
      setUploadingVariantId(null)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError('')

    const name = form.name.trim()
    if (name.length === 0) {
      setValidationError('Informe o nome do produto.')
      return
    }

    const variants: ProductColorVariant[] = form.variants
      .map((variant) => ({
        id: variant.id,
        colorName: variant.colorName.trim(),
        colorHex: variant.colorHex,
        imageUrl: variant.imageUrl.trim() || form.imageUrl.trim(),
        sizes: Object.entries(variant.sizes).map(([size, stock]) => ({ size, stock: toStockNumber(stock) })),
      }))
      .filter((variant) => variant.colorName.length > 0)

    const variantTotalStock = variants.reduce(
      (total, variant) => total + variant.sizes.reduce((sum, entry) => sum + entry.stock, 0),
      0,
    )
    const rootStock = Number.parseInt(form.stock, 10)
    const finalStock = variants.length > 0 ? variantTotalStock : rootStock

    if (!Number.isFinite(finalStock) || finalStock < 0) {
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
    const rootSizes = splitList(form.sizes)
    const variantSizes = Array.from(new Set(variants.flatMap((variant) => variant.sizes.map((entry) => entry.size))))
    const variantColors = variants.map((variant) => variant.colorName)
    const sizes = variants.length > 0 ? variantSizes : rootSizes

    const nextProduct: Product = {
      id: product?.id ?? `${slugify(name) || 'produto'}-${Date.now().toString(36)}`,
      sku: form.sku.trim() || name.toUpperCase().slice(0, 12),
      name,
      description: form.description.trim() || form.fullDescription.trim() || name,
      price: priceValue,
      originalPrice: product?.originalPrice,
      imageUrl: form.imageUrl.trim() || variants[0]?.imageUrl || '',
      category,
      categorySlug: slugify(category),
      niche: deriveNiche(category),
      sizes: sizes.length > 0 ? sizes : [...OFFICIAL_SIZES],
      colors: variants.length > 0 ? variantColors : splitList(form.colors),
      inStock: finalStock > 0,
      stock: finalStock,
      variants: variants.length > 0 ? variants : undefined,
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
              <label className={LABEL_CLASS}>Estoque (sem variações)</label>
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
              <label className={LABEL_CLASS}>Foto do produto (upload)</label>
              <div className="flex items-start gap-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-baruc-gold/50 bg-baruc-cream">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Pré-visualização" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-7 w-7 text-baruc-goldDark" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-baruc-gold/50 bg-white px-4 text-sm font-semibold text-baruc-green transition-colors hover:border-baruc-gold hover:bg-baruc-goldLight">
                    {isUploadingMain ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isUploadingMain ? 'Enviando...' : 'Enviar arquivo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleMainImageChange(event)} />
                  </label>
                  <input
                    className={INPUT_CLASS}
                    value={form.imageUrl}
                    onChange={update('imageUrl')}
                    placeholder="ou cole uma URL: https://..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Cores (legado, separadas por vírgula)</label>
              <input className={INPUT_CLASS} value={form.colors} onChange={update('colors')} placeholder="Preto, Bege" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Tamanhos (separados por vírgula)</label>
              <input className={INPUT_CLASS} value={form.sizes} onChange={update('sizes')} placeholder="P, M, G, GG" />
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-baruc-goldDark" aria-hidden="true" />
                <h3 className="font-serif text-lg font-semibold text-baruc-green">Cores, Fotos e Estoque por Tamanho</h3>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-baruc-gold bg-baruc-green px-3.5 text-sm font-bold text-baruc-gold transition-colors hover:bg-baruc-greenDark active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Adicionar Cor
              </button>
            </div>

            {form.variants.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-baruc-gold/40 bg-baruc-cream px-3.5 py-3 text-sm text-neutral-500">
                Nenhuma variação cadastrada. O produto usará a foto, os tamanhos e o estoque acima.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {form.variants.map((variant) => (
                  <li key={variant.id} className="rounded-2xl border border-neutral-200 bg-baruc-cream/60 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt={variant.colorName || 'Cor'} className="h-full w-full object-cover" />
                        ) : (
                          <span
                            className="h-full w-full"
                            style={{ backgroundColor: variant.colorHex }}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            className={INPUT_CLASS}
                            value={variant.colorName}
                            onChange={(event) => updateVariant(variant.id, { colorName: event.target.value })}
                            placeholder="Nome da cor (ex.: Branca)"
                          />
                          <input
                            type="color"
                            value={variant.colorHex}
                            onChange={(event) => updateVariant(variant.id, { colorHex: event.target.value })}
                            aria-label="Selecionar cor"
                            className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            aria-label={`Remover cor ${variant.colorName || 'sem nome'}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_COLORS.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              title={color.name}
                              aria-label={`Usar cor ${color.name}`}
                              onClick={() => updateVariant(variant.id, { colorHex: color.hex, colorName: variant.colorName || color.name })}
                              className="h-7 w-7 rounded-full border border-neutral-300 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>

                        <label className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-baruc-gold/40 bg-white px-3 text-xs font-semibold text-baruc-green transition-colors hover:border-baruc-gold hover:bg-baruc-goldLight">
                          {uploadingVariantId === variant.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {uploadingVariantId === variant.id ? 'Enviando foto...' : 'Enviar foto desta cor'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => void handleVariantImageChange(variant.id, event)}
                          />
                        </label>
                        <input
                          className={INPUT_CLASS}
                          value={variant.imageUrl}
                          onChange={(event) => updateVariant(variant.id, { imageUrl: event.target.value })}
                          placeholder="ou cole uma URL da foto desta cor"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {Object.entries(variant.sizes).map(([size, stock]) => (
                        <div key={size} className="flex flex-col gap-1">
                          <label className="text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            {size}
                          </label>
                          <input
                            className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-2 text-center text-sm text-neutral-900 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={stock}
                            onChange={(event) => updateVariantSize(variant.id, size, event.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2">
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
