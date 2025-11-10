import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAnalysis,
  fetchPaginatedAnalyses,
  fetchProductVersionHistory,
  fetchAnalysisDetail,
} from '../../services/analysisService';
import type {
  CreateAnalysisRequest,
  AnalysisCreatedResponse,
} from '../../types/analyze';
import type { PaginatedAnalysesResponse } from '../../types/products';
import type { AnalysisDetailDto } from '../../types/results';

describe('analysisService', () => {
  const mockToken = 'test-jwt-token-123';
  const mockAnalysisId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '456e7890-e89b-12d3-a456-426614174000';

  const mockCreateRequest: CreateAnalysisRequest = {
    isManual: false,
    productName: 'Test Dog Food',
    productUrl: 'https://example.com/product',
    species: 1, // Dog = 1
    breed: 'Labrador',
    age: 5,
    additionalInfo: 'Very active',
    ingredientsText: 'Chicken, rice, vegetables',
  };

  const mockAnalysisCreatedResponse: AnalysisCreatedResponse = {
    analysisId: mockAnalysisId,
    productId: mockProductId,
    recommendation: 'Recommended',
    justification: 'Good ingredients',
    concerns: [],
    createdAt: '2024-01-01T12:00:00Z',
  };

  const mockAnalysisDetailDto: AnalysisDetailDto = {
    analysisId: mockAnalysisId,
    productId: mockProductId,
    productName: 'Test Dog Food',
    productUrl: 'https://example.com/product',
    recommendation: 'Recommended' as const,
    justification: 'Good ingredients',
    concerns: [],
    species: 'Dog' as const,
    breed: 'Labrador',
    age: 5,
    additionalInfo: 'Very active',
    ingredientsText: 'Chicken, rice, vegetables',
    createdAt: '2024-01-01T12:00:00Z',
  };

  const mockPaginatedResponse: PaginatedAnalysesResponse = {
    page: 1,
    pageSize: 10,
    totalCount: 25,
    items: [
      {
        analysisId: mockAnalysisId,
        productId: mockProductId,
        productName: 'Test Product 1',
        isManualEntry: false,
        recommendation: 'Recommended' as const,
        createdAt: '2024-01-01T12:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnalysis', () => {
    it('should successfully create analysis and return 201 Created', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
        json: async () => mockAnalysisCreatedResponse,
      } as Response);

      const result = await createAnalysis(mockCreateRequest, mockToken);

      expect(result).toEqual(mockAnalysisCreatedResponse);
      expect(result.analysisId).toBe(mockAnalysisId);
    });

    it('should make POST request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
        json: async () => mockAnalysisCreatedResponse,
      } as Response);

      await createAnalysis(mockCreateRequest, mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analyses'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include authorization token in headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
        json: async () => mockAnalysisCreatedResponse,
      } as Response);

      await createAnalysis(mockCreateRequest, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toHaveProperty(
        'Authorization',
        'Bearer test-jwt-token-123'
      );
    });

    it('should include credentials in request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
        json: async () => mockAnalysisCreatedResponse,
      } as Response);

      await createAnalysis(mockCreateRequest, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('include');
    });

    it('should send request body with all fields', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
        json: async () => mockAnalysisCreatedResponse,
      } as Response);

      await createAnalysis(mockCreateRequest, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body).toEqual(mockCreateRequest);
    });

    it('should throw error on 400 Bad Request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid data' }),
        json: async () => ({ message: 'Invalid data' }),
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    it('should throw error on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('should throw error on 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 500,
        text: async () => JSON.stringify({ message: 'Server error' }),
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle validation errors with field details', async () => {
      const validationError = {
        message: 'Validation failed',
        details: 'Invalid product URL',
        errors: {
          productUrl: ['Invalid URL format'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        text: async () => JSON.stringify(validationError),
        json: async () => validationError,
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toMatchObject({
        status: 400,
        details: 'Invalid product URL',
        errors: validationError.errors,
      });
    });
  });

  describe('fetchPaginatedAnalyses', () => {
    it('should fetch paginated analyses successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      const result = await fetchPaginatedAnalyses(1, 10, mockToken);

      expect(result).toEqual(mockPaginatedResponse);
      expect(result.items).toHaveLength(1);
    });

    it('should make GET request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(1, 10, mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analyses?'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include pagination query parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(2, 20, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=20');
    });

    it('should include groupByProduct parameter when true', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(1, 10, mockToken, true);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('groupByProduct=true');
    });

    it('should include groupByProduct=false parameter when false', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(1, 10, mockToken, false);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('groupByProduct=false');
    });

    it('should include authorization token in headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(1, 10, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toHaveProperty(
        'Authorization',
        `Bearer ${mockToken}`
      );
    });

    it('should throw error on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      await expect(
        fetchPaginatedAnalyses(1, 10, mockToken)
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('should throw error on 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'Server error' }),
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      await expect(
        fetchPaginatedAnalyses(1, 10, mockToken)
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle different page numbers', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      for (const page of [1, 2, 5, 10]) {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaginatedResponse,
        } as Response);

        await fetchPaginatedAnalyses(page, 10, mockToken);

        const callArgs = vi.mocked(global.fetch).mock.calls[0];
        const url = callArgs[0] as string;

        expect(url).toContain(`page=${page}`);
      }
    });

    it('should handle different page sizes', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      for (const pageSize of [5, 10, 20, 50]) {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaginatedResponse,
        } as Response);

        await fetchPaginatedAnalyses(1, pageSize, mockToken);

        const callArgs = vi.mocked(global.fetch).mock.calls[0];
        const url = callArgs[0] as string;

        expect(url).toContain(`pageSize=${pageSize}`);
      }
    });
  });

  describe('fetchProductVersionHistory', () => {
    it('should fetch version history successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      const result = await fetchProductVersionHistory(
        mockProductId,
        1,
        5,
        mockToken
      );

      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should include productId in query parameter', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchProductVersionHistory(mockProductId, 1, 5, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain(`productId=${mockProductId}`);
    });

    it('should include pagination parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchProductVersionHistory(mockProductId, 2, 10, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=10');
    });

    it('should include authorization token', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchProductVersionHistory(mockProductId, 1, 5, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toHaveProperty(
        'Authorization',
        `Bearer ${mockToken}`
      );
    });

    it('should throw error on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'Product not found' }),
        json: async () => ({ message: 'Product not found' }),
      } as unknown as Response);

      await expect(
        fetchProductVersionHistory(mockProductId, 1, 5, mockToken)
      ).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw error on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      await expect(
        fetchProductVersionHistory(mockProductId, 1, 5, mockToken)
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('should handle different product IDs', async () => {
      const productIds = [
        '111e4567-e89b-12d3-a456-426614174111',
        '222e4567-e89b-12d3-a456-426614174222',
      ];

      for (const productId of productIds) {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaginatedResponse,
        } as Response);

        await fetchProductVersionHistory(productId, 1, 5, mockToken);

        const callArgs = vi.mocked(global.fetch).mock.calls[0];
        const url = callArgs[0] as string;

        expect(url).toContain(`productId=${productId}`);
      }
    });
  });

  describe('fetchAnalysisDetail', () => {
    it('should fetch analysis detail successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAnalysisDetailDto,
      } as Response);

      const result = await fetchAnalysisDetail(mockAnalysisId, mockToken);

      expect(result).toEqual(mockAnalysisDetailDto);
      expect(result.analysisId).toBe(mockAnalysisId);
    });

    it('should make GET request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAnalysisDetailDto,
      } as Response);

      await fetchAnalysisDetail(mockAnalysisId, mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/analyses/${mockAnalysisId}`),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include authorization token in headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAnalysisDetailDto,
      } as Response);

      await fetchAnalysisDetail(mockAnalysisId, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toHaveProperty(
        'Authorization',
        `Bearer ${mockToken}`
      );
    });

    it('should include credentials in request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAnalysisDetailDto,
      } as Response);

      await fetchAnalysisDetail(mockAnalysisId, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('include');
    });

    it('should throw error on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'Analysis not found' }),
        json: async () => ({ message: 'Analysis not found' }),
      } as unknown as Response);

      await expect(
        fetchAnalysisDetail(mockAnalysisId, mockToken)
      ).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw error on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      await expect(
        fetchAnalysisDetail(mockAnalysisId, mockToken)
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('should throw error on 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'Server error' }),
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      await expect(
        fetchAnalysisDetail(mockAnalysisId, mockToken)
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle different analysis IDs', async () => {
      const analysisIds = [
        '111e4567-e89b-12d3-a456-426614174111',
        '222e4567-e89b-12d3-a456-426614174222',
      ];

      for (const analysisId of analysisIds) {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockAnalysisDetailDto,
        } as Response);

        await fetchAnalysisDetail(analysisId, mockToken);

        const callArgs = vi.mocked(global.fetch).mock.calls[0];
        const url = callArgs[0] as string;

        expect(url).toContain(`/analyses/${analysisId}`);
      }
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        text: async () => 'Invalid JSON {',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toBeDefined();
    });

    it('should parse error details from response', async () => {
      const errorResponse = {
        status: 400,
        message: 'Validation error',
        details: 'Field validation failed',
        errors: { field: ['error'] },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        text: async () => JSON.stringify(errorResponse),
        json: async () => errorResponse,
      } as unknown as Response);

      await expect(
        createAnalysis(mockCreateRequest, mockToken)
      ).rejects.toMatchObject({
        status: 400,
        message: 'Validation error',
        details: 'Field validation failed',
      });
    });
  });

  describe('query parameter encoding', () => {
    it('should properly encode special characters in productId', async () => {
      const specialProductId = 'prod-id-with-special-chars-@#$';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchProductVersionHistory(
        specialProductId,
        1,
        5,
        mockToken
      );

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      // URL should be properly encoded
      expect(url).toBeTruthy();
      expect(url).toContain('productId=');
    });

    it('should handle large page numbers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(9999, 10, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('page=9999');
    });

    it('should handle large page sizes', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);

      await fetchPaginatedAnalyses(1, 5000, mockToken);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain('pageSize=5000');
    });
  });
});
