export interface Order {
  id: string
  uid: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
    color?: string
    size?: string
  }[]
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  paymentMethod?: 'PIX' | 'Cartão' | 'Combinar'
  deliveryType?: 'Entrega' | 'Retirada na Loja'
  createdAt: Date
  updatedAt: Date
}