import type {
  CreateAnalysisRequest,
  AnalysisCreatedResponse,
  ApiErrorShape,
} from '../types/analyze';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5135/api';

const parseErrorResponse = async (response: Response): Promise<ApiErrorShape> => {
  let payload: any = undefined;
  const text = await response.text();
  try {
    payload = JSON.parse(text);
  } catch (error) {
    payload = { message: text };
    console.warn('Failed to parse error response JSON', error);
  }

  return {
    status: response.status,
    message: payload?.message || 'An unexpected error occurred',
    details: payload?.details,
    errors: payload?.errors,
  };
};

/**
 * Creates a new pet food analysis
 * @param payload - The analysis request data
 * @param token - Authentication token
 * @returns The created analysis response
 * @throws ApiErrorShape when the request fails
 */
export const createAnalysis = async (
  payload: CreateAnalysisRequest,
  token: string,
): Promise<AnalysisCreatedResponse> => {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    return response.json() as Promise<AnalysisCreatedResponse>;
  }

  throw await parseErrorResponse(response);
};

export default createAnalysis;

