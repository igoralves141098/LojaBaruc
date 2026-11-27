export interface Customer {
  uid: string
  fullName: string
  email: string
  cpf: string
  birthDate: string
  phone: string
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
