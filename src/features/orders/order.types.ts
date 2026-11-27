export type OrderStatus = 'pending' | 'paid'
export type OrderPaymentMethod = 'PIX' | 'Cartão' | 'Combinar'
export type OrderDeliveryMethod = 'Entrega' | 'Retirada na Loja'

export interface OrderItem {
  productId: string
  name: string
  sku: string
  colorName: string
  colorHex: string
  size: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  orderCode: string
  customerId: string | null
  customerName: string
  customerEmail: string
  customerCpf: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: OrderPaymentMethod
  deliveryMethod: OrderDeliveryMethod
  status: OrderStatus
  createdAt: Date | null
  paidAt: Date | null
}
