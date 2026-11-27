import { env } from '@/config/env'
import type { CartItem } from '@/features/cart/types/cart.types'
import type { Product } from '@/features/catalog/types/product.types'
import { formatCurrency, formatPrice } from '@/utils/formatters'

const WHATSAPP_BASE_URL = 'https://wa.me'
const DEFAULT_WHATSAPP_PHONE = '5583999091885'
const DIVIDER = '------------------------------'

export interface CartCheckoutParams {
  items: CartItem[]
  subtotal: number
  totalDiscount: number
  totalPrice: number
  hasPriceOnRequest?: boolean
  customerName?: string
  paymentMethod?: string
  deliveryType?: string
  orderShortCode?: string
}

const buildUrl = (message: string): string =>
  `${WHATSAPP_BASE_URL}/${env.whatsappPhone || DEFAULT_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`

const clean = (value: string | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim()

const buildItemLines = (item: CartItem, index: number): string[] => {
  const { product, selectedSize, selectedColor, quantity } = item
  const variant = selectedColor ? `Tam: ${selectedSize} | Cor: ${selectedColor}` : `Tam: ${selectedSize}`
  return [
    `*${index + 1}. ${product.name}*`,
    `   ${product.category}`,
    `   ${variant} | SKU: ${product.sku}`,
    `   Qtd: ${quantity} x ${formatPrice(product.price)}`,
    `   Subtotal: ${product.price === null ? formatPrice(null) : formatCurrency(product.price * quantity)}`,
  ]
}

const buildCheckoutMessage = ({
  items,
  subtotal,
  totalDiscount,
  totalPrice,
  hasPriceOnRequest = false,
  customerName,
  paymentMethod,
  deliveryType,
  orderShortCode,
}: CartCheckoutParams): string => {
  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0)
  const lines: string[] = [
    `Olá! Gostaria de finalizar meu pedido na *${env.storeName}*:`,
    '',
    '*ITENS DO PEDIDO*',
    DIVIDER,
  ]

  items.forEach((item, index) => {
    lines.push(...buildItemLines(item, index))
    if (index < items.length - 1) lines.push('')
  })

  lines.push(DIVIDER, '*RESUMO*', `Total de peças: ${totalPieces}`)

  if (totalDiscount > 0) {
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`, `Desconto total: -${formatCurrency(totalDiscount)}`)
  }

  if (hasPriceOnRequest && totalPrice === 0) {
    lines.push('*VALOR TOTAL A CONFIRMAR*', 'Aguardo o orçamento das peças selecionadas.')
  } else if (hasPriceOnRequest) {
    lines.push(`*VALOR DOS ITENS COM PREÇO: ${formatCurrency(totalPrice)}*`, 'Itens a confirmar: aguardo o orçamento.')
  } else {
    lines.push(`*VALOR TOTAL DO PEDIDO: ${formatCurrency(totalPrice)}*`)
  }

  if (orderShortCode) {
    lines.push('', DIVIDER, '*CÓDIGO DO PEDIDO*')
    lines.push(`Código: ${orderShortCode}`)
  }

  const name = clean(customerName)
  const payment = clean(paymentMethod)
  const delivery = clean(deliveryType)

  if (name || payment || delivery) {
    lines.push('', DIVIDER, '*DADOS DO CLIENTE*')
    if (name) lines.push(`Nome: ${name}`)
    if (payment) lines.push(`Forma de pagamento: ${payment}`)
    if (delivery) lines.push(`Entrega: ${delivery}`)
  }

  lines.push('', 'Aguardo a confirmação. Obrigado!')

  return lines.join('\n')
}

const buildAvailabilityMessage = (product: Product): string =>
  [
    `Olá! Tenho interesse em um produto da *${env.storeName}* que está esgotado no catálogo:`,
    '',
    `*Produto:* ${product.name}`,
    `*SKU:* ${product.sku}`,
    `*Tamanhos:* ${product.sizes.join(', ')}`,
    `*Preço:* ${formatPrice(product.price)}`,
    '',
    'Poderia me avisar quando houver reposição?',
  ].join('\n')

const buildCategoryMessage = (category: string): string =>
  `Olá! Vim pelo catálogo online da *${env.storeName}* e gostaria de ver as opções de *${category}*.`

const buildGeneralMessage = (): string =>
  `Olá! Vim pelo catálogo online da *${env.storeName}* e gostaria de atendimento.`

export const WhatsAppService = {
  generateCartCheckoutUrl(params: CartCheckoutParams): string {
    return buildUrl(buildCheckoutMessage(params))
  },

  generateAvailabilityUrl(product: Product): string {
    return buildUrl(buildAvailabilityMessage(product))
  },

  generateCategoryUrl(category: string): string {
    return buildUrl(buildCategoryMessage(category))
  },

  generateGeneralUrl(): string {
    return buildUrl(buildGeneralMessage())
  },

  redirect(url: string): void {
    window.location.assign(url)
  },
} as const
