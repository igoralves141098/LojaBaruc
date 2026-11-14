const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0)

export const calculateDiscountPercent = (price: number, originalPrice?: number): number | null => {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}
