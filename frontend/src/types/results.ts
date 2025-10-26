// Type definitions for the Results View

// Core domain types
export type RecommendationKind = 'Recommended' | 'NotRecommended';
export type SpeciesKind = 'Cat' | 'Dog';

// Maps to backend IngredientConcernDto
export type IngredientConcern = {
  type: 'questionable' | 'unacceptable';
  ingredient: string;
  reason: string;
};

// Maps to backend AnalysisDetailsDto (returned by GET /api/analyses/{id})
export type AnalysisDetailDto = {
  analysisId: string;
  productId: string;
  productName: string;
  productUrl: string;
  recommendation: RecommendationKind;
  justification: string;
  concerns: IngredientConcern[]; // List of ingredient concerns
  ingredientsText: string | null;
  species: SpeciesKind;
  breed: string | null;
  age: number | null;
  additionalInfo: string | null;
  createdAt: string; // ISO date string
};

// View model for rendering the results page
export type AnalysisResultViewModel = {
  analysisId: string;
  productId: string;
  productName: string;
  productUrl: string | null;
  recommendation: RecommendationKind;
  justification: string;
  concerns: IngredientConcern[]; // List of ingredient concerns
  species: SpeciesKind;
  breed: string | null;
  age: number | null;
  additionalInfo: string | null;
  ingredientsText: string | null;
  createdAt: string; // ISO date string
};

// Feedback-related types
export type FeedbackDirection = 'up' | 'down';

export type FeedbackState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  lastSubmitted?: FeedbackDirection;
  message?: string;
};

// Maps to backend CreateFeedbackRequest
export type FeedbackRequestDto = {
  isPositive: boolean;
};

// Page status and error types
export type PageStatus = 'loading' | 'ready' | 'error' | 'notFound';

export type PageErrorState = {
  type: 'notFound' | 'unauthorized' | 'server' | 'network';
  message: string;
};

// Hook return types
export type UseAnalysisDetailResult = {
  status: PageStatus;
  data: AnalysisResultViewModel | null;
  error: PageErrorState | null;
  refetch: () => void;
};

export type UseFeedbackSubmissionResult = {
  feedbackState: FeedbackState;
  submitFeedback: (direction: FeedbackDirection) => Promise<void>;
};

// Reanalyze payload
export type ReanalyzePayload = {
  productName: string;
  productUrl: string;
  species: SpeciesKind;
  breed: string;
  age: number;
  additionalInfo?: string;
  ingredientsText?: string;
};

