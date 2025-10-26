import type {
  AnalysisDetailDto,
  AnalysisResultViewModel,
  RecommendationKind,
  SpeciesKind,
  PageErrorState,
  ReanalyzePayload,
} from '../types/results';

/**
 * Maps backend AnalysisDetailDto to frontend AnalysisResultViewModel
 */
export const mapAnalysisDetailToViewModel = (
  dto: AnalysisDetailDto
): AnalysisResultViewModel => {
  return {
    analysisId: dto.analysisId,
    productId: dto.productId,
    productName: dto.productName,
    productUrl: dto.productUrl || null,
    recommendation: dto.recommendation,
    justification: dto.justification,
    concerns: dto.concerns || [], // Map concerns array
    species: dto.species,
    breed: dto.breed,
    age: dto.age,
    additionalInfo: dto.additionalInfo,
    ingredientsText: dto.ingredientsText,
    createdAt: dto.createdAt,
  };
};

/**
 * Formats an ISO date string to a localized date-time string
 */
export const formatAnalysisDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString; // Fallback to raw string if parsing fails
  }
};

/**
 * Formats a relative date string (e.g., "2 days ago")
 */
export const formatRelativeDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatAnalysisDate(isoString);
    }
  } catch {
    return isoString;
  }
};

/**
 * Generates a human-readable pet summary string
 */
export const formatPetSummary = (
  species: SpeciesKind,
  breed: string | null,
  age: number | null
): string => {
  const parts: string[] = [];

  if (age !== null) {
    const ageStr = age === 1 ? '1 year old' : `${age} years old`;
    parts.push(ageStr);
  }

  if (breed) {
    parts.push(breed);
  }

  parts.push(species);

  return parts.join(' ');
};

/**
 * Checks if a URL is valid
 */
export const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Classifies an API error response into a PageErrorState
 */
export const classifyApiError = (
  statusCode: number,
  message?: string
): PageErrorState => {
  switch (statusCode) {
    case 401:
      return {
        type: 'unauthorized',
        message: message || 'You must be logged in to view this analysis.',
      };
    case 404:
      return {
        type: 'notFound',
        message:
          message ||
          'Analysis not found. It may have been deleted or you may not have access to it.',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'server',
        message:
          message ||
          'A server error occurred. Please try again in a few moments.',
      };
    default:
      return {
        type: 'network',
        message:
          message ||
          'Unable to load analysis. Please check your connection and try again.',
      };
  }
};

/**
 * Validates if an analysisId is a valid UUID
 */
export const isValidUuid = (id: string | undefined): boolean => {
  if (!id) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Maps an AnalysisResultViewModel to a ReanalyzePayload for prefilling the analyze form
 */
export const mapToReanalyzePayload = (
  analysis: AnalysisResultViewModel
): ReanalyzePayload | null => {
  // Ensure required fields exist
  if (
    !analysis.productName ||
    !analysis.productUrl ||
    !analysis.breed ||
    analysis.age === null
  ) {
    return null;
  }

  return {
    productName: analysis.productName,
    productUrl: analysis.productUrl,
    species: analysis.species,
    breed: analysis.breed,
    age: analysis.age,
    additionalInfo: analysis.additionalInfo || undefined,
    ingredientsText: analysis.ingredientsText || undefined,
  };
};

/**
 * Gets a CSS class name for the recommendation badge
 */
export const getRecommendationBadgeClass = (
  recommendation: RecommendationKind
): string => {
  return recommendation === 'Recommended'
    ? 'bg-green-700 text-white border-green-900 shadow-lg'
    : 'bg-red-700 text-white border-red-900 shadow-lg';
};

/**
 * Gets an icon class or name for the recommendation badge
 */
export const getRecommendationLabel = (
  recommendation: RecommendationKind
): string => {
  return recommendation === 'Recommended'
    ? 'Recommended'
    : 'Not Recommended';
};

