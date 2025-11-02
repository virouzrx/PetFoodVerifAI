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
  email: string
  token: string
  emailConfirmed: boolean
}

export type LoginRequestDto = {
  email: string
  password: string
}

export type LoginResponseDto = {
  userId: string
  email: string
  token: string
  emailConfirmed: boolean
}

export type ApiErrorField = {
  field?: 'email' | 'password' | 'form'
  message: string
}

export type ApiErrorResponse = {
  status: number
  message?: string
  errors?: ApiErrorField[] | Record<string, string[]>
}

export type FieldErrorMap = {
  email?: string
  password?: string
  newPassword?: string
  token?: string
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

// Email Verification Types
export type VerificationFormValues = {
  verificationCode: string
}

export type VerifyEmailRequestDto = {
  userId: string
  verificationToken: string
}

export type VerifyEmailResponseDto = {
  userId: string
  email: string
  emailConfirmed: boolean
  token: string
}

export type ResendVerificationEmailDto = {
  email: string
}

export type EmailVerificationStatus = {
  pendingEmail: string
  userId: string
  expiresAt?: Date
}

export type PendingVerificationResponse = {
  userId: string
  email: string
  expiresAt: Date
}

// Forgot Password Types
export type ForgotPasswordRequestDto = {
  email: string
}

// Reset Password Types
export type ResetPasswordRequestDto = {
  email: string
  token: string
  newPassword: string
}
