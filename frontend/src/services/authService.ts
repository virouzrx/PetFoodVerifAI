import type {
  ApiErrorResponse,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
  ResendVerificationEmailDto,
  PendingVerificationResponse,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  ApiErrorField,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5135/api'

type ErrorPayload = {
  message?: string
  errors?: unknown
}

const isErrorPayload = (value: unknown): value is ErrorPayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  const messageValid = record.message === undefined || typeof record.message === 'string'
  const errorsValid = record.errors === undefined || typeof record.errors === 'object'

  return messageValid && errorsValid
}

const normalizeErrorFields = (value: unknown): ApiErrorResponse['errors'] => {
  if (!value) {
    return undefined
  }

  if (Array.isArray(value)) {
    const normalized = value.filter((item): item is ApiErrorField => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ApiErrorField).message === 'string'
      )
    })

    return normalized.length > 0 ? normalized : undefined
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const normalizedRecord: Record<string, string[]> = {}

    for (const [field, messages] of Object.entries(record)) {
      if (Array.isArray(messages)) {
        const filtered = messages.filter(
          (message): message is string => typeof message === 'string' && message.trim().length > 0,
        )

        if (filtered.length > 0) {
          normalizedRecord[field] = filtered
        }
      } else if (typeof messages === 'string' && messages.trim()) {
        normalizedRecord[field] = [messages]
      }
    }

    return Object.keys(normalizedRecord).length > 0 ? normalizedRecord : undefined
  }

  return undefined
}

const parseErrorResponse = async (response: Response): Promise<ApiErrorResponse> => {
  let payload: unknown = undefined
  const text = await response.text()
  try {
    payload = JSON.parse(text)
  } catch (error) {
    payload = { message: text }
    console.warn('Failed to parse error response JSON', error)
  }

  return {
    status: response.status,
    message: isErrorPayload(payload) ? payload.message : undefined,
    errors: isErrorPayload(payload) ? normalizeErrorFields(payload.errors) : undefined,
  }
}

export const registerUser = async (
  payload: RegisterRequestDto,
): Promise<PendingVerificationResponse> => {
  const url = `${API_BASE_URL}/auth/register`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.status === 201) {
    const data = await response.json() as RegisterResponseDto
    return {
      userId: data.userId,
      email: data.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  throw await parseErrorResponse(response)
}

export default registerUser

export const loginUser = async (payload: LoginRequestDto): Promise<LoginResponseDto> => {
  const url = `${API_BASE_URL}/auth/login`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return response.json() as Promise<LoginResponseDto>
  }

  throw await parseErrorResponse(response)
}

export const verifyEmail = async (
  userId: string,
  verificationToken: string,
): Promise<VerifyEmailResponseDto> => {
  const payload: VerifyEmailRequestDto = {
    userId,
    verificationToken,
  }

  const url = `${API_BASE_URL}/auth/verify-email`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return response.json() as Promise<VerifyEmailResponseDto>
  }

  throw await parseErrorResponse(response)
}

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  const payload: ResendVerificationEmailDto = { email }

  const url = `${API_BASE_URL}/auth/resend-verification-email`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return response.json() as Promise<{ message: string }>
  }

  throw await parseErrorResponse(response)
}

export const googleLogin = async (googleToken: string): Promise<LoginResponseDto> => {
  const url = `${API_BASE_URL}/auth/google-login`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify({ googleToken }),
  })

  if (response.ok) {
    return response.json() as Promise<LoginResponseDto>
  }

  throw await parseErrorResponse(response)
}

export const forgotPassword = async (payload: ForgotPasswordRequestDto): Promise<void> => {
  const url = `${API_BASE_URL}/auth/forgot-password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return
  }

  throw await parseErrorResponse(response)
}

export const resetPassword = async (payload: ResetPasswordRequestDto): Promise<void> => {
  const url = `${API_BASE_URL}/auth/reset-password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return
  }

  throw await parseErrorResponse(response)
}