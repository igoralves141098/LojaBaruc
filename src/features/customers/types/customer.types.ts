export interface Customer {
  uid: string
  fullName: string
  email: string
  cpf: string
  birthDate: string
  phone: string
  emailVerified: boolean
  status: 'pending_verification' | 'active' | 'inactive'
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CustomerSignUpInput {
  fullName: string
  email: string
  cpf: string
  birthDate: string
  phone: string
}

export interface CustomerProfileInput {
  fullName: string
  cpf: string
  birthDate: string
  phone: string
}
