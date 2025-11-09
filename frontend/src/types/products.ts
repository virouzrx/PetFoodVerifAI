// Type definitions for the My Products View

import type { RecommendationKind, SpeciesKind } from './results';

// Maps to backend AnalysisSummaryDto (returned by GET /api/analyses)
export type AnalysisSummaryDto = {
  analysisId: string;
  productId: string;
  productName: string;
  productUrl?: string | null; // Nullable for manual entries
  isManualEntry: boolean; // Explicit flag to determine if product was manually entered
  recommendation: RecommendationKind;
  createdAt: string; // ISO date string
};

// Maps to backend PaginatedAnalysesResponse
export type PaginatedAnalysesResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: AnalysisSummaryDto[];
};

// Frontend view model for product analysis summary
export type ProductAnalysisSummary = {
  analysisId: string;
  productId: string;
  productName: string;
  recommendation: RecommendationKind;
  createdAt: string; // ISO date string
  // Optional fields for reanalysis context
  species?: SpeciesKind;
  age?: number;
  breed?: string;
  productUrl?: string;
  isManualEntry?: boolean; // Explicit flag to determine if product was manually entered
  additionalInfo?: string;
};

// Frontend view model for paginated list
export type PaginatedAnalysesViewModel = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: ProductAnalysisSummary[];
  isEmpty: boolean;
  hasMore: boolean;
  maxPage: number;
};

// Version history entry (alias for product analysis summary)
export type VersionHistoryEntry = ProductAnalysisSummary;

// Reanalyze navigation payload
export type ReanalyzeNavigationPayload = {
  analysisId: string;
  productName: string;
  productUrl?: string;
  isManualEntry?: boolean; // Explicit flag to determine if product was manually entered
  species?: SpeciesKind;
  breed?: string;
  age?: number;
  additionalInfo?: string;
};

// Pagination state
export type PaginationState = {
  page: number;
  pageSize: number;
  totalCount: number;
  maxPage: number;
};

// Version history drawer state
export type VersionHistoryDrawerState = {
  isOpen: boolean;
  productId: string | null;
  productName: string;
  page: number;
  versions: VersionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
};

// Hook return types
export type UsePaginatedAnalysesResult = {
  status: 'loading' | 'ready' | 'error';
  data: PaginatedAnalysesViewModel | null;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
};

export type UseVersionHistoryResult = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: VersionHistoryEntry[];
  error: string | null;
  hasMore: boolean;
  fetchNextPage: () => void;
  reset: () => void;
};

