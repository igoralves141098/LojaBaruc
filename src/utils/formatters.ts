const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0)

export const formatPrice = (value: number | null): string =>
  value === null ? '—' : formatCurrency(value)

export const calculateDiscountPercent = (price: number | null, originalPrice?: number): number | null => {
  if (price === null || !originalPrice || originalPrice <= price || originalPrice <= 0) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}
