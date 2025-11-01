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
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5135/api'

const parseErrorResponse = async (response: Response): Promise<ApiErrorResponse> => {
  let payload: any = undefined
  const text = await response.text()
  try {
    payload = JSON.parse(text)
  } catch (error) {
    payload = { message: text }
    console.warn('Failed to parse error response JSON', error)
  }

  return {
    status: response.status,
    message: payload?.message,
    errors: payload?.errors,
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