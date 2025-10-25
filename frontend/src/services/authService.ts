import type {
  ApiErrorResponse,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
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
): Promise<RegisterResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.status === 201) {
    return response.json() as Promise<RegisterResponseDto>
  }

  throw await parseErrorResponse(response)
}

export default registerUser

export const loginUser = async (payload: LoginRequestDto): Promise<LoginResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

