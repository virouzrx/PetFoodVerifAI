import type {
  CreateAnalysisRequest,
  AnalysisCreatedResponse,
  ApiErrorShape,
} from '../types/analyze';
import type {
  PaginatedAnalysesResponse,
} from '../types/products';
import type { AnalysisDetailDto } from '../types/results';

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

/**
 * Fetches a paginated list of analyses for the authenticated user
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param token - Authentication token
 * @param groupByProduct - If true, returns only latest analysis per product
 * @returns Paginated analyses response
 * @throws ApiErrorShape when the request fails
 */
export const fetchPaginatedAnalyses = async (
  page: number,
  pageSize: number,
  token: string,
  groupByProduct: boolean = false,
): Promise<PaginatedAnalysesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    groupByProduct: groupByProduct.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/analyses?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }
  );

  if (response.ok) {
    return response.json() as Promise<PaginatedAnalysesResponse>;
  }

  throw await parseErrorResponse(response);
};

/**
 * Fetches version history for a specific product
 * @param productId - Product UUID
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param token - Authentication token
 * @returns Paginated analyses response filtered by product
 * @throws ApiErrorShape when the request fails
 */
export const fetchProductVersionHistory = async (
  productId: string,
  page: number,
  pageSize: number,
  token: string,
): Promise<PaginatedAnalysesResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/analyses?productId=${productId}&page=${page}&pageSize=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }
  );

  if (response.ok) {
    return response.json() as Promise<PaginatedAnalysesResponse>;
  }

  throw await parseErrorResponse(response);
};

/**
 * Fetches detailed information for a specific analysis
 * @param analysisId - Analysis UUID
 * @param token - Authentication token
 * @returns Analysis detail DTO
 * @throws ApiErrorShape when the request fails
 */
export const fetchAnalysisDetail = async (
  analysisId: string,
  token: string,
): Promise<AnalysisDetailDto> => {
  const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (response.ok) {
    return response.json() as Promise<AnalysisDetailDto>;
  }

  throw await parseErrorResponse(response);
};

export default createAnalysis;

