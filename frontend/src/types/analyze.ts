// Type definitions for the Analyze Product view

export type SpeciesOption = "Cat" | "Dog" | "";

export type AnalyzeFormValues = {
  productName: string;
  productUrl: string;
  species: SpeciesOption;
  breed: string;
  age: number | "";
  additionalInfo: string;
  ingredientsText: string;
  hasManualIngredients: boolean;
  noIngredientsAvailable: boolean;
};

export type AnalyzeFormErrors = {
  productName?: string;
  productUrl?: string;
  species?: string;
  breed?: string;
  age?: string;
  ingredientsText?: string;
  manualAcknowledgement?: string;
  global?: string;
};

export type ScrapeState = "idle" | "scraping" | "awaitingManual" | "manualReady" | "submitting";

export type ManualIngredientsState = {
  isVisible: boolean;
  value: string;
  noIngredientsAvailable: boolean;
};

export type SubmitStatus = "idle" | "submitting" | "succeeded" | "failed";

export type ApiErrorShape = {
  status: number;
  message: string;
  details?: string;
  errors?: Record<string, string[]>;
};

// API Request/Response types matching backend DTOs
export type CreateAnalysisRequest = {
  productName: string;
  productUrl: string;
  ingredientsText?: string | null;
  species: 0 | 1; // 0 = Cat, 1 = Dog (enum values)
  breed: string;
  age: number;
  additionalInfo?: string | null;
};

// Helper to convert species string to enum value
export const speciesStringToEnum = (species: 'Cat' | 'Dog'): 0 | 1 => {
  return species === 'Cat' ? 0 : 1;
};

export type AnalysisCreatedResponse = {
  analysisId: string;
  productId: string;
  recommendation: "Recommended" | "NotRecommended";
  justification: string;
  concerns: IngredientConcernDto[];
  createdAt: string;
};

export type IngredientConcernDto = {
  type: string;
  ingredient: string;
  reason: string;
};

