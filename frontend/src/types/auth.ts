export type RegisterFormValues = {
  email: string
  password: string
}

export type RegisterRequestDto = {
  email: string
  password: string
}

export type RegisterResponseDto = {
  userId: string
  token: string
}

export type LoginRequestDto = {
  email: string
  password: string
}

export type LoginResponseDto = {
  userId: string
  token: string
}

export type ApiErrorField = {
  field?: 'email' | 'password' | 'form'
  message: string
}

export type ApiErrorResponse = {
  status: number
  message?: string
  errors?: ApiErrorField[]
}

export type FieldErrorMap = {
  email?: string
  password?: string
  form?: string
}

export type PasswordStrengthResult = {
  score: 0 | 1 | 2 | 3 | 4
  checks: {
    minLength8: boolean
    hasUpper: boolean
    hasLower: boolean
    hasDigit: boolean
    hasSpecial: boolean
  }
}

export type AuthUser = {
  userId: string
  email: string
}

export type AuthState = {
  user?: AuthUser
  token?: string
}

