# Analyze View Dual Input Mode Implementation Plan

## Overview

This document outlines the implementation plan for modifying the analyze view to support two distinct input modes:
1. **URL Mode (Scraping)**: User provides only a URL, system scrapes product name and ingredients
2. **Manual Mode**: User manually enters product name and ingredients (no URL required)

**Key Constraint**: Manually-added products cannot be re-analyzed since they have no URL source.

**Date**: November 9, 2025  
**Status**: ✅ **IMPLEMENTED** - All phases completed. The dual input mode functionality is now live:
- URL Mode: Product name and ingredients are automatically extracted from URL (product name no longer requires user input)
- Manual Mode: Users can manually enter product name and ingredients without providing a URL
- Database migration completed with `IsManualEntry` flag
- Frontend supports mode switching and appropriate field visibility

---

## Table of Contents

1. [Phase 1: Backend Changes](#phase-1-backend-changes)
2. [Phase 2: Frontend Changes](#phase-2-frontend-changes)
3. [Phase 3: Testing & Edge Cases](#phase-3-testing--edge-cases)
4. [Phase 4: Database Migration](#phase-4-database-migration)
5. [Phase 5: UI/UX Enhancements](#phase-5-uiux-enhancements)
6. [Implementation Order](#implementation-order-summary)
7. [Rollout Considerations](#rollout-considerations)

---

## Phase 1: Backend Changes

### Step 1.1: Extend Scraping Service to Extract Product Name

**Files to Modify**:
- `PetFoodVerifAI/Services/IScrapingService.cs`
- `PetFoodVerifAI/Services/BasicScrapingService.cs`

**Changes**:

#### IScrapingService.cs
Add new method signature:
```csharp
Task<string> ScrapeProductNameAsync(string productUrl);
```

Or create a combined method:
```csharp
Task<(string productName, string ingredients)> ScrapeProductDataAsync(string productUrl);
```

#### BasicScrapingService.cs
Implement product name scraping logic:
- Extract from page title, h1, or meta tags
- Target common patterns on zooplus pages (e.g., `<h1>`, `og:title` meta tag, or product title div)
- Handle fallback cases where product name cannot be found

**Implementation Notes**:
- Use HtmlAgilityPack to select nodes like:
  - `//h1`
  - `//meta[@property='og:title']/@content`
  - `//meta[@name='twitter:title']/@content`
  - Product-specific selectors for zooplus
- Normalize and clean the extracted name (remove extra whitespace, HTML entities)
- Return meaningful error if name cannot be extracted

**Example Implementation**:
```csharp
public async Task<string> ScrapeProductNameAsync(string productUrl)
{
    try
    {
        var response = await _httpClient.GetStringAsync(productUrl);
        var htmlDoc = new HtmlDocument();
        htmlDoc.LoadHtml(response);

        // Try multiple selectors in order of preference
        var nameNode = htmlDoc.DocumentNode.SelectSingleNode("//meta[@property='og:title']/@content")
            ?? htmlDoc.DocumentNode.SelectSingleNode("//h1")
            ?? htmlDoc.DocumentNode.SelectSingleNode("//title");

        if (nameNode != null)
        {
            var productName = nameNode.InnerText;
            var decodedName = System.Net.WebUtility.HtmlDecode(productName);
            var normalizedName = Regex.Replace(decodedName, @"\s+", " ").Trim();
            return normalizedName;
        }

        return "Unknown Product";
    }
    catch (Exception e)
    {
        return $"Error extracting product name: {e.Message}";
    }
}
```

---

### Step 1.2: Update DTOs to Support Optional ProductUrl

**File**: `PetFoodVerifAI/DTOs/AnalysisDtos.cs`

**Changes**:

Modify `CreateAnalysisRequest` class:
```csharp
public class CreateAnalysisRequest
{
    // NEW: Explicit flag to indicate input mode
    [Required]
    public bool IsManual { get; set; }
    
    // Optional - required based on IsManual flag
    public string? ProductName { get; set; }
    
    // Optional - required if IsManual = false
    public string? ProductUrl { get; set; }

    // Optional - required if IsManual = true, otherwise scraped
    public string? IngredientsText { get; set; }

    [Required]
    public Species Species { get; set; }

    [Required]
    public string Breed { get; set; } = string.Empty;

    [Required]
    public int Age { get; set; }

    public string? AdditionalInfo { get; set; }
}
```

**Validation Rules** (to be implemented in controller):
- If `IsManual = true` → require `ProductName` and `IngredientsText`, `ProductUrl` must be null/empty
- If `IsManual = false` → require valid `ProductUrl`, `ProductName` and `IngredientsText` optional (will be scraped)
- `IsManual` flag makes intent explicit and prevents ambiguous requests

---

### Step 1.3: Update Product Model to Support Optional URL

**File**: `PetFoodVerifAI/Models/Product.cs`

**Changes**:

Make `ProductUrl` nullable and add `IsManualEntry` flag:
```csharp
[Table("Products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid ProductId { get; set; }

    [Required]
    public string ProductName { get; set; } = string.Empty;

    // Remove [Required] attribute, make nullable (null for manual entries)
    public string? ProductUrl { get; set; }

    // NEW: Explicit flag to track manual vs scraped products
    [Required]
    public bool IsManualEntry { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Analysis> Analyses { get; set; } = new List<Analysis>();
}
```

**Database Implications**:
- `IsManualEntry` flag explicitly tracks the source of the product
- Products are identified by `ProductName` + `ProductUrl` combination
- Manual products (`IsManualEntry = true`) always have `ProductUrl = null`
- Scraped products (`IsManualEntry = false`) always have `ProductUrl` populated
- Manual products with same name are treated as separate entries (each analysis creates new product)
- Consider adding index on `(ProductName, ProductUrl)` for performance

**Migration Required**: Yes - need to add `IsManualEntry` column and make `ProductUrl` nullable (see Phase 4)

---

### Step 1.4: Update AnalysisService Business Logic

**File**: `PetFoodVerifAI/Services/AnalysisService.cs`

**Changes to `CreateAnalysisAsync` method**:

```csharp
public async Task<AnalysisCreatedResponse> CreateAnalysisAsync(CreateAnalysisRequest request, string userId)
{
    string productName;
    string ingredients;
    Product product;

    if (request.IsManual)
    {
        // Manual Mode: Use provided data
        productName = request.ProductName!;
        ingredients = request.IngredientsText!;
        
        // For manual entries, always create a new product (no deduplication)
        // This ensures each manual analysis is independent
        product = new Product
        {
            ProductName = productName,
            ProductUrl = null,
            IsManualEntry = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Products.Add(product);
    }
    else
    {
        // URL Mode: Scrape product data
        try
        {
            // Scrape product name if not provided
            if (string.IsNullOrWhiteSpace(request.ProductName))
            {
                productName = await _scrapingService.ScrapeProductNameAsync(request.ProductUrl!);
            }
            else
            {
                productName = request.ProductName;
            }
            
            // Scrape ingredients if not provided
            if (string.IsNullOrWhiteSpace(request.IngredientsText))
            {
                ingredients = await _scrapingService.ScrapeIngredientsAsync(request.ProductUrl!);
            }
            else
            {
                ingredients = request.IngredientsText;
            }
        }
        catch (Exception ex)
        {
            throw new ExternalServiceException("Failed to scrape product data.", ex);
        }
        
        // Find or create product by name + URL
        product = await _context.Products
            .FirstOrDefaultAsync(p => p.ProductName == productName && p.ProductUrl == request.ProductUrl && !p.IsManualEntry);
            
        if (product == null)
        {
            product = new Product
            {
                ProductName = productName,
                ProductUrl = request.ProductUrl,
                IsManualEntry = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Products.Add(product);
        }
    }
    
    // Continue with LLM analysis
    LlmAnalysisResult llmResponse;
    try
    {
        llmResponse = await _llmService.AnalyzeIngredientsAsync(ingredients, request);
    }
    catch (Exception ex)
    {
        throw new ExternalServiceException("Failed to get analysis from the LLM service.", ex);
    }
    
    var concernsJson = llmResponse.Concerns.Count > 0 
        ? JsonSerializer.Serialize(llmResponse.Concerns.Select(c => new IngredientConcernDto
        {
            Type = c.Type,
            Ingredient = c.Ingredient,
            Reason = c.Reason
        }).ToList())
        : null;

    var analysis = new Analysis
    {
        ProductId = product.ProductId,
        UserId = userId,
        Recommendation = llmResponse.IsRecommended ? Recommendation.Recommended : Recommendation.NotRecommended,
        Justification = llmResponse.Justification,
        IngredientsText = ingredients,
        Species = request.Species,
        Breed = request.Breed,
        Age = request.Age,
        AdditionalInfo = request.AdditionalInfo,
        ConcernsJson = concernsJson,
        CreatedAt = DateTime.UtcNow
    };

    _context.Analyses.Add(analysis);
    await _context.SaveChangesAsync();

    return new AnalysisCreatedResponse
    {
        AnalysisId = analysis.AnalysisId,
        ProductId = product.ProductId,
        Recommendation = analysis.Recommendation,
        Justification = analysis.Justification,
        Concerns = llmResponse.Concerns.Select(c => new IngredientConcernDto
        {
            Type = c.Type,
            Ingredient = c.Ingredient,
            Reason = c.Reason
        }).ToList(),
        CreatedAt = analysis.CreatedAt
    };
}
```

**Key Logic Changes**:
- URL mode: Find/create product by `(ProductName, ProductUrl)` pair
- Manual mode: Always create new product with `ProductUrl = null`
- This ensures manual entries are never matched for "re-analysis"
- Product name can be scraped from URL or provided explicitly

---

### Step 1.5: Update Controller Validation

**File**: `PetFoodVerifAI/Controllers/AnalysesController.cs`

**Changes to `CreateAnalysis` method**:

```csharp
[HttpPost]
public async Task<IActionResult> CreateAnalysis([FromBody] CreateAnalysisRequest request)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null)
    {
        return Unauthorized();
    }
    
    // Validate based on IsManual flag
    if (request.IsManual)
    {
        // Manual mode validation
        if (string.IsNullOrWhiteSpace(request.ProductName))
        {
            return BadRequest(new 
            { 
                message = "Product name is required for manual entry.",
                errors = new Dictionary<string, string[]>
                {
                    ["ProductName"] = new[] { "Product name is required when entering manually" }
                }
            });
        }
        
        if (string.IsNullOrWhiteSpace(request.IngredientsText))
        {
            return BadRequest(new 
            { 
                message = "Ingredients are required for manual entry.",
                errors = new Dictionary<string, string[]>
                {
                    ["IngredientsText"] = new[] { "Ingredients are required when entering manually" }
                }
            });
        }
        
        // ProductUrl should not be provided in manual mode
        if (!string.IsNullOrWhiteSpace(request.ProductUrl))
        {
            return BadRequest(new 
            { 
                message = "ProductUrl should not be provided when IsManual is true.",
                errors = new Dictionary<string, string[]>
                {
                    ["ProductUrl"] = new[] { "Do not provide URL in manual mode" }
                }
            });
        }
    }
    else
    {
        // URL mode validation
        if (string.IsNullOrWhiteSpace(request.ProductUrl))
        {
            return BadRequest(new 
            { 
                message = "Product URL is required when IsManual is false.",
                errors = new Dictionary<string, string[]>
                {
                    ["ProductUrl"] = new[] { "Product URL is required for scraping mode" }
                }
            });
        }
        
        // Validate URL format
        if (!Uri.TryCreate(request.ProductUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest(new 
            { 
                message = "ProductUrl must be a valid HTTP or HTTPS URL.",
                errors = new Dictionary<string, string[]>
                {
                    ["ProductUrl"] = new[] { "Please enter a valid URL starting with http:// or https://" }
                }
            });
        }
    }
    
    try
    {
        var result = await _analysisService.CreateAnalysisAsync(request, userId);
        return CreatedAtAction(nameof(CreateAnalysis), new { id = result.AnalysisId }, result);
    }
    catch (ExternalServiceException ex)
    {
        return StatusCode(503, new 
        { 
            message = "An external service is unavailable. Please try again later.", 
            details = ex.Message 
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new 
        { 
            message = "An unexpected error occurred.", 
            details = ex.Message 
        });
    }
}
```

**Validation Summary**:
- ✅ URL mode: `ProductUrl` required, `ProductName` optional (will be scraped), `IngredientsText` optional (will be scraped)
- ✅ Manual mode: `ProductName` required, `IngredientsText` required, `ProductUrl` must be null/empty
- ✅ URL format validation when provided
- ✅ Clear error messages returned to frontend

---

## Phase 2: Frontend Changes

### Step 2.1: Update Type Definitions

**File**: `frontend/src/types/analyze.ts`

**Changes**:

```typescript
// Type definitions for the Analyze Product view

export type SpeciesOption = "Cat" | "Dog" | "";

// NEW: Input mode type
export type InputMode = 'url' | 'manual';

export type AnalyzeFormValues = {
  inputMode: InputMode; // NEW: track which mode user is in
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
  additionalInfo?: string;
  ingredientsText?: string;
};

export type CreateAnalysisRequest = {
  isManual: boolean; // NEW: Explicit flag for input mode
  productName: string | null; // Can be null if URL provided (will be scraped)
  productUrl: string | null; // Can be null if manual mode
  species: number;
  breed: string;
  age: number;
  additionalInfo: string | null;
  ingredientsText: string | null;
};

export type SubmitStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

export type ScrapeState = 'idle' | 'scraping' | 'success' | 'failed' | 'submitting';

export type ApiErrorShape = {
  message?: string;
  errors?: Record<string, string[]>;
};

// Species enum conversion helper
export const speciesStringToEnum = (species: 'Cat' | 'Dog'): number => {
  return species === 'Cat' ? 0 : 1;
};
```

---

### Step 2.2: Update Form Hook with Mode Toggle

**File**: `frontend/src/views/analyze/hooks/useAnalyzeForm.ts`

**Changes**:

1. Add `inputMode` to initial form values:

```typescript
const initialFormValues: AnalyzeFormValues = {
  inputMode: 'url', // Default to URL mode
  productName: '',
  productUrl: '',
  species: '',
  breed: '',
  age: '',
  additionalInfo: '',
  ingredientsText: '',
  hasManualIngredients: false,
  noIngredientsAvailable: false,
};
```

2. Add new action type to `FormAction`:

```typescript
type FormAction =
  | { type: 'SET_FIELD'; field: keyof AnalyzeFormValues; value: AnalyzeFieldValue }
  | { type: 'INIT_FORM'; values: Partial<AnalyzeFormValues> }
  | { type: 'SET_INPUT_MODE'; mode: InputMode }; // NEW
```

3. Update reducer to handle mode changes:

```typescript
const formReducer = (state: AnalyzeFormValues, action: FormAction): AnalyzeFormValues => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    
    case 'INIT_FORM':
      return { ...state, ...action.values };
    
    case 'SET_INPUT_MODE':
      // Clear fields from opposite mode when switching
      if (action.mode === 'url') {
        return {
          ...state,
          inputMode: action.mode,
          productName: '', // Clear manual fields
          ingredientsText: '',
          hasManualIngredients: false,
          noIngredientsAvailable: false,
        };
      } else {
        return {
          ...state,
          inputMode: action.mode,
          productUrl: '', // Clear URL field
          hasManualIngredients: true, // Always use manual ingredients in manual mode
        };
      }
    
    default:
      return state;
  }
};
```

4. Add `setInputMode` function to hook:

```typescript
export const useAnalyzeForm = (initialValues?: Partial<AnalyzeFormValues>) => {
  const [formValues, dispatch] = useReducer(formReducer, initialFormValues);
  const [formErrors, setFormErrors] = useState<AnalyzeFormErrors>({});
  const [scrapeState, setScrapeState] = useState<ScrapeState>('idle');
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // ... existing code ...

  // NEW: Input mode setter
  const setInputMode = useCallback((mode: InputMode) => {
    dispatch({ type: 'SET_INPUT_MODE', mode });
    // Clear validation errors when switching modes
    setFormErrors({});
    setShowValidationSummary(false);
  }, []);

  // ... rest of hook ...

  return {
    formValues,
    formErrors,
    scrapeState,
    showValidationSummary,
    manualIngredientsState,
    updateField,
    handleBlur,
    validateForm,
    enableManualIngredients,
    resetManualIngredients,
    updateManualIngredients,
    toggleNoIngredients,
    setScrapeState,
    setInputMode, // NEW: export mode setter
  };
};
```

5. Update validation logic:

```typescript
const validateForm = useCallback((): boolean => {
  const errors: AnalyzeFormErrors = {};
  
  // Mode-specific validation
  if (formValues.inputMode === 'url') {
    // URL mode: require productUrl only
    const urlError = validateProductUrl(formValues.productUrl);
    if (urlError) errors.productUrl = urlError;
    
    // If manual ingredients are being used (scraping fallback), validate them
    if (formValues.hasManualIngredients && !formValues.noIngredientsAvailable) {
      const ingredientsError = validateIngredients(formValues.ingredientsText);
      if (ingredientsError) errors.ingredientsText = ingredientsError;
    }
  } else {
    // Manual mode: require productName and ingredients
    const nameError = validateProductName(formValues.productName);
    if (nameError) errors.productName = nameError;
    
    const ingredientsError = validateIngredients(formValues.ingredientsText);
    if (ingredientsError) errors.ingredientsText = ingredientsError;
  }
  
  // Always validate pet info fields
  const speciesError = validateSpecies(formValues.species);
  if (speciesError) errors.species = speciesError;
  
  const breedError = validateBreed(formValues.breed);
  if (breedError) errors.breed = breedError;
  
  const ageError = validateAge(formValues.age);
  if (ageError) errors.age = ageError;
  
  setFormErrors(errors);
  setShowValidationSummary(Object.keys(errors).length > 0);
  
  return Object.keys(errors).length === 0;
}, [formValues]);
```

---

### Step 2.3: Create Input Mode Selector Component

**New File**: `frontend/src/views/analyze/components/InputModeSelector.tsx`

**Purpose**: Toggle component to switch between URL and Manual input modes

**Implementation**:

```typescript
import { useState } from 'react';
import type { InputMode } from '../../../types/analyze';

type InputModeSelectorProps = {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
  hasFormData?: boolean; // Track if user has entered data
};

/**
 * InputModeSelector Component
 * 
 * Purpose: Toggle between URL scraping mode and manual entry mode
 * 
 * Features:
 * - Radio button-style toggle
 * - Confirmation dialog when switching with data entered
 * - Clear visual indication of active mode
 * - Accessible keyboard navigation
 * - Disabled state support
 */
const InputModeSelector = ({
  value,
  onChange,
  disabled = false,
  hasFormData = false,
}: InputModeSelectorProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMode, setPendingMode] = useState<InputMode | null>(null);

  const handleModeClick = (newMode: InputMode) => {
    if (disabled || newMode === value) return;

    // If user has entered data, show confirmation
    if (hasFormData) {
      setPendingMode(newMode);
      setShowConfirmation(true);
    } else {
      onChange(newMode);
    }
  };

  const handleConfirm = () => {
    if (pendingMode) {
      onChange(pendingMode);
    }
    setShowConfirmation(false);
    setPendingMode(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingMode(null);
  };

  const getModeLabel = (mode: InputMode) => {
    return mode === 'url' ? 'Scrape from URL' : 'Enter Manually';
  };

  const getModeDescription = (mode: InputMode) => {
    return mode === 'url'
      ? 'Automatically retrieve product details from a website'
      : 'Manually enter product name and ingredients';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Input Method
        </label>
        
        <div
          role="radiogroup"
          aria-label="Select input method"
          className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1"
        >
          {/* URL Mode Button */}
          <button
            type="button"
            role="radio"
            aria-checked={value === 'url'}
            onClick={() => handleModeClick('url')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
              focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
              ${
                value === 'url'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Scrape from URL</span>
            </div>
          </button>

          {/* Manual Mode Button */}
          <button
            type="button"
            role="radio"
            aria-checked={value === 'manual'}
            onClick={() => handleModeClick('manual')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
              focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
              ${
                value === 'manual'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Enter Manually</span>
            </div>
          </button>
        </div>

        {/* Mode description */}
        <p className="text-xs text-slate-500">
          {getModeDescription(value)}
        </p>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-switch-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3
              id="mode-switch-title"
              className="text-lg font-semibold text-slate-900 mb-2"
            >
              Switch Input Mode?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Switching to {pendingMode === 'url' ? 'URL mode' : 'manual mode'} will
              clear your current entries. Are you sure you want to continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Switch Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputModeSelector;
```

---

### Step 2.4: Update AnalyzeForm Component

**File**: `frontend/src/views/analyze/components/AnalyzeForm.tsx`

**Changes**:

1. Import the new component:

```typescript
import InputModeSelector from './InputModeSelector';
```

2. Destructure `setInputMode` from hook:

```typescript
const {
  formValues,
  formErrors,
  scrapeState: localScrapeState,
  showValidationSummary,
  manualIngredientsState,
  updateField,
  handleBlur,
  validateForm,
  enableManualIngredients,
  resetManualIngredients,
  updateManualIngredients,
  toggleNoIngredients,
  setScrapeState,
  setInputMode, // NEW
} = useAnalyzeForm(initialValues);
```

3. Update the Product Information section:

```typescript
{/* Product Information Section */}
<div className="space-y-4">
  <h2 className="text-lg font-semibold text-slate-900">Product Information</h2>
  
  {/* Input Mode Selector - only show for new analyses, not reanalysis */}
  {!lockedFields.includes('productUrl') && !lockedFields.includes('productName') && (
    <InputModeSelector
      value={formValues.inputMode}
      onChange={setInputMode}
      disabled={isSubmitting}
      hasFormData={
        !!formValues.productUrl || 
        !!formValues.productName || 
        !!formValues.ingredientsText
      }
    />
  )}
  
  <div className="grid gap-4 sm:grid-cols-2">
    {/* Conditionally render fields based on input mode */}
    {formValues.inputMode === 'url' ? (
      <>
        {/* URL Mode: Show URL input */}
        <div className="sm:col-span-2">
          <ProductUrlInput
            value={formValues.productUrl}
            error={mergedErrors.productUrl}
            onChange={(value) => updateField('productUrl', value)}
            onBlur={() => handleBlur('productUrl')}
            disabled={isSubmitting || lockedFields.includes('productUrl')}
          />
        </div>

        {/* Show scrape status if scraping */}
        {scrapeState !== 'idle' && (
          <div className="sm:col-span-2">
            <ScrapeStatus
              state={scrapeState}
              onRetry={() => {
                setScrapeState('idle');
              }}
            />
          </div>
        )}

        {/* Manual ingredients fallback if scraping fails */}
        {(scrapeState === 'failed' || manualIngredientsState.isEnabled) && (
          <div className="sm:col-span-2">
            <ManualIngredientsTextarea
              value={formValues.ingredientsText}
              error={mergedErrors.ingredientsText}
              onChange={updateManualIngredients}
              disabled={isSubmitting || formValues.noIngredientsAvailable}
              required={manualIngredientsState.isEnabled}
            />
            
            {manualIngredientsState.isEnabled && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="no-ingredients"
                  checked={formValues.noIngredientsAvailable}
                  onChange={toggleNoIngredients}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <label
                  htmlFor="no-ingredients"
                  className="text-sm text-slate-700"
                >
                  Ingredients not available
                </label>
              </div>
            )}

            {!manualIngredientsState.isEnabled && scrapeState !== 'failed' && (
              <button
                type="button"
                onClick={enableManualIngredients}
                disabled={isSubmitting}
                className="mt-2 text-sm text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary rounded"
              >
                Enter ingredients manually
              </button>
            )}
          </div>
        )}
      </>
    ) : (
      <>
        {/* Manual Mode: Show product name and ingredients inputs */}
        <div className="sm:col-span-2">
          <ProductNameInput
            value={formValues.productName}
            error={mergedErrors.productName}
            onChange={(value) => updateField('productName', value)}
            onBlur={() => handleBlur('productName')}
            disabled={isSubmitting || lockedFields.includes('productName')}
          />
        </div>

        <div className="sm:col-span-2">
          <ManualIngredientsTextarea
            value={formValues.ingredientsText}
            error={mergedErrors.ingredientsText}
            onChange={(value) => updateField('ingredientsText', value)}
            disabled={isSubmitting}
            required={true}
          />
          <p className="mt-1 text-xs text-slate-500">
            Paste the full ingredients list from the product packaging or website
          </p>
        </div>
      </>
    )}
  </div>
</div>
```

---

### Step 2.5: Update Form Validation

Already covered in Step 2.2 (validation logic in `useAnalyzeForm.ts`)

Key validation rules:
- **URL mode**: `productUrl` required, ingredients optional (fallback to manual if scraping fails)
- **Manual mode**: `productName` and `ingredientsText` required
- Pet info fields always required in both modes

---

### Step 2.6: Update Submission Logic

**File**: `frontend/src/views/analyze/AnalyzePage.tsx`

**Changes to `handleSubmit`**:

```typescript
const handleSubmit = useCallback(
  async (formValues: AnalyzeFormValues) => {
    // Clear previous errors and status
    setApiError(null);
    setSubmitStatus('submitting');
    
    // Build payload based on input mode
    const payload: CreateAnalysisRequest = {
      isManual: formValues.inputMode === 'manual', // NEW: Set explicit flag
      species: speciesStringToEnum(formValues.species as 'Cat' | 'Dog'),
      breed: formValues.breed.trim(),
      age: formValues.age as number,
      additionalInfo: formValues.additionalInfo.trim() || null,
      productName: null,
      productUrl: null,
      ingredientsText: null,
    };
    
    if (formValues.inputMode === 'url') {
      // URL mode: send URL, backend will scrape product name and ingredients
      payload.productUrl = formValues.productUrl.trim();
      payload.productName = null; // Backend will scrape
      
      // If user provided manual ingredients (scraping fallback), include them
      if (formValues.hasManualIngredients) {
        payload.ingredientsText = formValues.noIngredientsAvailable
          ? ''
          : formValues.ingredientsText.trim();
      } else {
        payload.ingredientsText = null; // Backend will scrape
      }
      
      setScrapeState('scraping');
      setStatusMessage('Retrieving product information from URL...');
    } else {
      // Manual mode: send product name and ingredients, no URL
      payload.productName = formValues.productName.trim();
      payload.productUrl = null;
      payload.ingredientsText = formValues.ingredientsText.trim();
      
      setScrapeState('submitting');
      setStatusMessage('Submitting your analysis request...');
    }

    try {
      // Call the API
      const response = await createAnalysis(payload, authState.token!);

      // Success
      setSubmitStatus('succeeded');
      setScrapeState('idle');
      setStatusMessage('Analysis completed successfully. Redirecting...');

      // Navigate to results page
      setTimeout(() => {
        navigate(`/results/${response.analysisId}`);
      }, 500);
    } catch (error) {
      setSubmitStatus('failed');
      setScrapeState('idle');

      // Handle API errors
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: ApiErrorShape } };
        const errorData = apiError.response?.data;

        if (errorData) {
          setApiError(errorData);
          setStatusMessage(
            errorData.message || 'An error occurred while processing your request.'
          );
        } else {
          setStatusMessage('An unexpected error occurred. Please try again.');
        }
      } else {
        setStatusMessage('Network error. Please check your connection and try again.');
      }
    }
  },
  [authState.token, navigate]
);
```

---

### Step 2.7: Disable Re-analysis for Manual Products

**File**: `frontend/src/views/products/components/ReanalyzeButton.tsx`

**Changes**:

1. Update validation to check for manual entry flag:

```typescript
// Validate payload has required fields
const isValid = !!(
  payload.analysisId &&
  payload.productName &&
  payload.productUrl // NEW: require URL for re-analysis
);

// Check if product is manual entry (from backend data)
const isManualEntry = !payload.productUrl; // Products with no URL are manual entries
```

2. Update button text and tooltip:

```typescript
return (
  <button
    type="button"
    onClick={handleClick}
    disabled={!isValid || isNavigating || isManualEntry}
    className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    aria-label={
      isManualEntry
        ? 'Products entered manually cannot be re-analyzed'
        : isValid
        ? `Re-analyze ${payload.productName}`
        : 'Re-analyze unavailable due to missing data'
    }
    title={
      isManualEntry
        ? 'This product was entered manually and cannot be re-analyzed. To analyze again, create a new manual entry.'
        : isValid
        ? `Re-analyze ${payload.productName}`
        : 'Missing required data for re-analysis'
    }
  >
    {/* ... icon/spinner ... */}
    <span>{isManualEntry ? 'Manual Entry' : 'Re-analyze'}</span>
  </button>
);
```

---

**File**: `frontend/src/views/products/components/ProductListItem.tsx`

**Changes**:

Add visual indicator for manual products:

```typescript
<div className="flex items-center gap-2">
  <h3 className="font-medium text-slate-900">{productName}</h3>
  
  {/* Manual entry badge */}
  {!productUrl && (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
      title="This product was entered manually"
    >
      <svg
        className="h-3 w-3 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Manual
    </span>
  )}
</div>
```

---

## Phase 3: Testing & Edge Cases

### Step 3.1: Backend Unit Tests

**New File**: `PetFoodVerifAI.Tests/BasicScrapingServiceTests_ProductName.cs`

Test product name extraction:

```csharp
using Xunit;
using Moq;
using Moq.Protected;
using System.Net;
using System.Net.Http;
using PetFoodVerifAI.Services;

namespace PetFoodVerifAI.Tests
{
    public class BasicScrapingServiceTests_ProductName
    {
        [Fact]
        public async Task ScrapeProductNameAsync_WithOgTitle_ShouldReturnProductName()
        {
            // Arrange
            var html = @"
                <html>
                    <head>
                        <meta property=""og:title"" content=""Royal Canin Adult Cat Food"" />
                    </head>
                </html>";

            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(html),
                });

            var httpClient = new HttpClient(handlerMock.Object);
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Royal Canin Adult Cat Food", result);
        }

        [Fact]
        public async Task ScrapeProductNameAsync_WithH1_ShouldReturnProductName()
        {
            // Arrange
            var html = @"
                <html>
                    <body>
                        <h1>Whiskas Ocean Fish Flavor</h1>
                    </body>
                </html>";

            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(html),
                });

            var httpClient = new HttpClient(handlerMock.Object);
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Whiskas Ocean Fish Flavor", result);
        }

        [Fact]
        public async Task ScrapeProductNameAsync_NoProductName_ShouldReturnUnknown()
        {
            // Arrange
            var html = @"<html><body><p>No product info</p></body></html>";

            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(html),
                });

            var httpClient = new HttpClient(handlerMock.Object);
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Unknown Product", result);
        }
    }
}
```

---

**New File**: `PetFoodVerifAI.Tests/AnalysisServiceTests_DualMode.cs`

Test dual input mode logic:

```csharp
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.Services;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Models;

namespace PetFoodVerifAI.Tests
{
    public class AnalysisServiceTests_DualMode
    {
        [Fact]
        public async Task CreateAnalysisAsync_UrlMode_ShouldScrapeAndCreateProduct()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_UrlMode")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            mockScrapingService
                .Setup(s => s.ScrapeProductNameAsync(It.IsAny<string>()))
                .ReturnsAsync("Scraped Product Name");
            mockScrapingService
                .Setup(s => s.ScrapeIngredientsAsync(It.IsAny<string>()))
                .ReturnsAsync("Chicken, Rice, Vitamins");

            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                ProductUrl = "https://example.com/product",
                ProductName = null,
                IngredientsText = null,
                Species = Species.Dog,
                Breed = "Labrador",
                Age = 5,
                AdditionalInfo = null
            };

            // Act
            var result = await analysisService.CreateAnalysisAsync(request, "user123");

            // Assert
            Assert.NotNull(result);
            var product = await context.Products.FirstOrDefaultAsync();
            Assert.NotNull(product);
            Assert.Equal("Scraped Product Name", product.ProductName);
            Assert.Equal("https://example.com/product", product.ProductUrl);
            
            mockScrapingService.Verify(s => s.ScrapeProductNameAsync(It.IsAny<string>()), Times.Once);
            mockScrapingService.Verify(s => s.ScrapeIngredientsAsync(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task CreateAnalysisAsync_ManualMode_ShouldCreateProductWithoutUrl()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_ManualMode")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                ProductUrl = null,
                ProductName = "Manual Product Name",
                IngredientsText = "Beef, Pork, Vegetables",
                Species = Species.Cat,
                Breed = "Persian",
                Age = 3,
                AdditionalInfo = null
            };

            // Act
            var result = await analysisService.CreateAnalysisAsync(request, "user123");

            // Assert
            Assert.NotNull(result);
            var product = await context.Products.FirstOrDefaultAsync();
            Assert.NotNull(product);
            Assert.Equal("Manual Product Name", product.ProductName);
            Assert.Null(product.ProductUrl);
            
            // Scraping should NOT be called
            mockScrapingService.Verify(s => s.ScrapeProductNameAsync(It.IsAny<string>()), Times.Never);
            mockScrapingService.Verify(s => s.ScrapeIngredientsAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAnalysisAsync_ManualMode_AlwaysCreatesNewProduct()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_ManualDuplicates")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                ProductUrl = null,
                ProductName = "Same Product Name",
                IngredientsText = "Ingredients",
                Species = Species.Cat,
                Breed = "Persian",
                Age = 3,
                AdditionalInfo = null
            };

            // Act - Create two analyses with same product name
            await analysisService.CreateAnalysisAsync(request, "user123");
            await analysisService.CreateAnalysisAsync(request, "user123");

            // Assert - Should create TWO separate products
            var productCount = await context.Products.CountAsync();
            Assert.Equal(2, productCount);
        }
    }
}
```

---

### Step 3.2: Frontend Unit Tests

**File**: `frontend/src/__tests__/hooks/useAnalyzeForm.test.ts`

Add tests for input mode:

```typescript
describe('useAnalyzeForm - Input Mode', () => {
  it('should default to URL mode', () => {
    const { result } = renderHook(() => useAnalyzeForm());
    
    expect(result.current.formValues.inputMode).toBe('url');
  });

  it('should switch to manual mode and clear URL fields', () => {
    const { result } = renderHook(() => useAnalyzeForm());
    
    // Set some URL mode data
    act(() => {
      result.current.updateField('productUrl', 'https://example.com');
    });
    
    expect(result.current.formValues.productUrl).toBe('https://example.com');
    
    // Switch to manual mode
    act(() => {
      result.current.setInputMode('manual');
    });
    
    expect(result.current.formValues.inputMode).toBe('manual');
    expect(result.current.formValues.productUrl).toBe('');
    expect(result.current.formValues.hasManualIngredients).toBe(true);
  });

  it('should switch to URL mode and clear manual fields', () => {
    const { result } = renderHook(() => useAnalyzeForm());
    
    // Switch to manual mode first
    act(() => {
      result.current.setInputMode('manual');
      result.current.updateField('productName', 'Manual Product');
      result.current.updateField('ingredientsText', 'Manual Ingredients');
    });
    
    expect(result.current.formValues.productName).toBe('Manual Product');
    expect(result.current.formValues.ingredientsText).toBe('Manual Ingredients');
    
    // Switch back to URL mode
    act(() => {
      result.current.setInputMode('url');
    });
    
    expect(result.current.formValues.inputMode).toBe('url');
    expect(result.current.formValues.productName).toBe('');
    expect(result.current.formValues.ingredientsText).toBe('');
    expect(result.current.formValues.hasManualIngredients).toBe(false);
  });

  it('should validate URL in URL mode', () => {
    const { result } = renderHook(() => useAnalyzeForm());
    
    act(() => {
      result.current.updateField('species', 'Dog');
      result.current.updateField('breed', 'Labrador');
      result.current.updateField('age', 5);
    });
    
    // Validate without URL
    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });
    
    expect(isValid).toBe(false);
    expect(result.current.formErrors.productUrl).toBeDefined();
  });

  it('should validate product name and ingredients in manual mode', () => {
    const { result } = renderHook(() => useAnalyzeForm());
    
    act(() => {
      result.current.setInputMode('manual');
      result.current.updateField('species', 'Cat');
      result.current.updateField('breed', 'Persian');
      result.current.updateField('age', 3);
    });
    
    // Validate without name and ingredients
    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });
    
    expect(isValid).toBe(false);
    expect(result.current.formErrors.productName).toBeDefined();
    expect(result.current.formErrors.ingredientsText).toBeDefined();
  });
});
```

---

**New File**: `frontend/src/__tests__/components/InputModeSelector.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InputModeSelector from '../../views/analyze/components/InputModeSelector';

describe('InputModeSelector', () => {
  it('should render both mode options', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Scrape from URL')).toBeInTheDocument();
    expect(screen.getByText('Enter Manually')).toBeInTheDocument();
  });

  it('should highlight active mode', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
      />
    );
    
    const urlButton = screen.getByRole('radio', { name: /scrape from url/i });
    expect(urlButton).toHaveAttribute('aria-checked', 'true');
  });

  it('should call onChange when switching modes without data', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
        hasFormData={false}
      />
    );
    
    const manualButton = screen.getByRole('radio', { name: /enter manually/i });
    fireEvent.click(manualButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('manual');
  });

  it('should show confirmation dialog when switching with form data', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
        hasFormData={true}
      />
    );
    
    const manualButton = screen.getByRole('radio', { name: /enter manually/i });
    fireEvent.click(manualButton);
    
    // Should show confirmation dialog
    expect(screen.getByText(/Switch Input Mode?/i)).toBeInTheDocument();
    
    // onChange should not be called yet
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should call onChange after confirmation', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
        hasFormData={true}
      />
    );
    
    const manualButton = screen.getByRole('radio', { name: /enter manually/i });
    fireEvent.click(manualButton);
    
    // Click confirm button in dialog
    const confirmButton = screen.getByText('Switch Mode');
    fireEvent.click(confirmButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('manual');
  });

  it('should not call onChange when canceling', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
        hasFormData={true}
      />
    );
    
    const manualButton = screen.getByRole('radio', { name: /enter manually/i });
    fireEvent.click(manualButton);
    
    // Click cancel button in dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    
    render(
      <InputModeSelector
        value="url"
        onChange={mockOnChange}
        disabled={true}
      />
    );
    
    const urlButton = screen.getByRole('radio', { name: /scrape from url/i });
    const manualButton = screen.getByRole('radio', { name: /enter manually/i });
    
    expect(urlButton).toBeDisabled();
    expect(manualButton).toBeDisabled();
  });
});
```

---

### Step 3.3: Integration Tests

Create end-to-end test scenarios:

1. **URL Mode Flow**:
   - User selects URL mode
   - Enters valid product URL
   - Submits form
   - Backend scrapes product name and ingredients
   - Analysis is created
   - User is redirected to results

2. **Manual Mode Flow**:
   - User selects manual mode
   - Enters product name and ingredients
   - Submits form
   - Analysis is created (no scraping)
   - User is redirected to results

3. **Mode Switching**:
   - User enters data in URL mode
   - Switches to manual mode
   - Confirms data loss
   - Data from URL mode is cleared

4. **Re-analysis Restriction**:
   - User creates manual analysis
   - Navigates to My Products
   - Manual product shows "Manual Entry" badge
   - Re-analyze button is disabled with explanation

5. **Error Handling**:
   - URL mode with invalid URL → validation error
   - URL mode with scraping failure → fallback to manual ingredients
   - Manual mode with missing fields → validation errors

---

## Phase 4: Database Migration

### Critical Checkpoint: After Model Changes, BEFORE Deploying

⚠️ **IMPORTANT**: Stop the application before running migration!

### Step 4.1: Create Migration

**Command**:
```bash
cd PetFoodVerifAI
dotnet ef migrations add AddManualEntrySupport
```

This will generate a new migration file in `Migrations/` folder with timestamp.

---

### Step 4.2: Review Generated Migration

**Expected Migration File**: `Migrations/YYYYMMDDHHMMSS_AddManualEntrySupport.cs`

**Expected Content**:
```csharp
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetFoodVerifAI.Migrations
{
    /// <inheritdoc />
    public partial class AddManualEntrySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make ProductUrl nullable
            migrationBuilder.AlterColumn<string>(
                name: "ProductUrl",
                table: "Products",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            // Add IsManualEntry column (default false for existing records)
            migrationBuilder.AddColumn<bool>(
                name: "IsManualEntry",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove IsManualEntry column
            migrationBuilder.DropColumn(
                name: "IsManualEntry",
                table: "Products");

            // Revert ProductUrl to non-nullable
            migrationBuilder.AlterColumn<string>(
                name: "ProductUrl",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
```

**Verify**:
- `Up` method changes `ProductUrl` from `nullable: false` to `nullable: true`
- `Up` method adds `IsManualEntry` column with `defaultValue: false` (existing products are scraped products)
- `Down` method can roll back both changes
- No other unexpected changes

---

### Step 4.3: Backup Database

Before running migration:
```bash
# For PostgreSQL
pg_dump -U username -d PetFoodVerifAI -f backup_before_url_optional.sql

# For SQL Server
# Use SQL Server Management Studio or Azure portal to create backup
```

---

### Step 4.4: Update Database

**Command**:
```bash
dotnet ef database update
```

**Expected Output**:
```
Build started...
Build succeeded.
Applying migration '20250109_AddManualEntrySupport'.
Done.
```

---

### Step 4.5: Verify Migration

**Check database schema**:
```sql
-- PostgreSQL
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'Products' AND column_name IN ('ProductUrl', 'IsManualEntry');

-- Expected: 
-- ProductUrl: is_nullable = 'YES'
-- IsManualEntry: is_nullable = 'NO', data_type = 'boolean'
```

**Test with existing data**:
```sql
-- Check that existing products are marked as non-manual (scraped)
SELECT COUNT(*) FROM "Products" WHERE "IsManualEntry" = true;
-- Expected: 0 (no existing products should be manual entries)

-- Check that existing products still have URLs
SELECT COUNT(*) FROM "Products" WHERE "ProductUrl" IS NULL;
-- Expected: 0 (no existing products should have null URLs)

-- Check that existing products are intact
SELECT COUNT(*) FROM "Products" WHERE "IsManualEntry" = false AND "ProductUrl" IS NOT NULL;
-- Expected: total count of existing products

SELECT COUNT(*) FROM "Products";
-- Expected: total count of existing products (unchanged)
```

---

### Step 4.6: Test Rollback (Optional, in Development Only)

To test rollback capability:
```bash
# Get previous migration name
dotnet ef migrations list

# Rollback
dotnet ef database update PreviousMigrationName

# Re-apply
dotnet ef database update
```

**⚠️ WARNING**: Do NOT rollback in production without careful planning!

---

### Step 4.7: Handle Existing Data

**Migration Notes**:
- ✅ Existing products: `IsManualEntry = false`, `ProductUrl` populated (no change to data)
- ✅ New URL-based products: `IsManualEntry = false`, `ProductUrl` populated
- ✅ New manual products: `IsManualEntry = true`, `ProductUrl = NULL`
- ✅ Queries: Can filter by `IsManualEntry` flag for clear intent

**Code Review Checklist**:
- [ ] All queries handle null `ProductUrl`
- [ ] Queries use `IsManualEntry` flag where appropriate
- [ ] Display logic shows appropriate UI for manual vs URL products
- [ ] Re-analyze button checks `IsManualEntry` or null URL
- [ ] Product comparison logic considers `IsManualEntry` flag

---

## Phase 5: UI/UX Enhancements

### Step 5.1: Update Help Text

**File**: `frontend/src/views/analyze/components/InlineHelp.tsx`

**Changes**:

```typescript
const InlineHelp = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <svg
          className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            How to analyze pet food
          </h3>
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-medium mb-1">Option 1: Scrape from URL</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Paste a product URL from supported websites (e.g., zooplus.pl)</li>
                <li>We'll automatically retrieve the product name and ingredients</li>
                <li>You can re-analyze the product later with updated pet information</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Option 2: Enter Manually</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Enter the product name and paste the ingredients list</li>
                <li>Useful when the product isn't available online</li>
                <li>Note: Manual entries cannot be re-analyzed (create a new entry instead)</li>
              </ul>
            </div>
            <p className="mt-3">
              Fill in your pet's information (species, breed, age) to get personalized
              recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineHelp;
```

---

### Step 5.2: Visual Indicators

**File**: `frontend/src/views/products/components/ProductListItem.tsx`

Add visual distinction for manual products:

```typescript
<div className="flex items-start justify-between">
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-1">
      {/* Product icon based on type */}
      {productUrl ? (
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          title="Scraped from URL"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          title="Manually entered"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      )}
      
      <h3 className="font-medium text-slate-900">{productName}</h3>
      
      {/* Manual entry badge */}
      {!productUrl && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
          title="This product was entered manually and cannot be re-analyzed"
        >
          Manual Entry
        </span>
      )}
    </div>
    
    {/* Show URL if available */}
    {productUrl && (
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-slate-500 hover:text-brand-primary truncate block"
      >
        {productUrl}
      </a>
    )}
  </div>
  
  {/* Action buttons */}
  <div className="flex gap-2">
    <ReanalyzeButton
      payload={payload}
      variant="secondary"
      size="small"
    />
  </div>
</div>
```

---

### Step 5.3: Error Messages

**File**: `frontend/src/views/analyze/components/ScrapeStatus.tsx`

Update error messages for URL mode:

```typescript
{state === 'failed' && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex gap-3">
      <svg
        className="h-5 w-5 text-red-600 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-900 mb-1">
          Could not retrieve product information
        </h3>
        <p className="text-sm text-red-800 mb-3">
          We couldn't automatically retrieve the product details from this URL.
          This might happen if:
        </p>
        <ul className="text-sm text-red-800 list-disc list-inside space-y-1 mb-3">
          <li>The website structure has changed</li>
          <li>The URL is not supported</li>
          <li>The page requires authentication</li>
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-red-900 hover:text-red-700 underline"
          >
            Try again
          </button>
          <span className="text-red-300">|</span>
          <button
            type="button"
            onClick={onSwitchToManual}
            className="text-sm font-medium text-red-900 hover:text-red-700 underline"
          >
            Switch to manual entry
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

---

### Step 5.4: Empty States

**File**: `frontend/src/views/products/components/EmptyState.tsx`

Update empty state to mention both input options:

```typescript
<div className="text-center py-12">
  <svg
    className="mx-auto h-12 w-12 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
  <h3 className="mt-2 text-sm font-medium text-slate-900">No analyses yet</h3>
  <p className="mt-1 text-sm text-slate-500">
    Get started by analyzing your first pet food product
  </p>
  <div className="mt-6">
    <Link
      to="/analyze"
      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
    >
      <svg
        className="-ml-1 mr-2 h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Analyze a Product
    </Link>
  </div>
  <p className="mt-4 text-xs text-slate-500">
    You can scrape from a URL or enter product details manually
  </p>
</div>
```

---

### Step 5.5: Tooltips and Hints

Add helpful tooltips throughout:

```typescript
// In ProductUrlInput component
<div className="flex items-center gap-1 mb-1">
  <label htmlFor="productUrl" className="block text-sm font-medium text-slate-700">
    Product URL
  </label>
  <button
    type="button"
    className="text-slate-400 hover:text-slate-600"
    title="Paste a link to the product page. We'll automatically retrieve the details."
    aria-label="Help for product URL"
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
</div>

// In ManualIngredientsTextarea (manual mode)
<div className="flex items-center gap-1 mb-1">
  <label htmlFor="ingredients" className="block text-sm font-medium text-slate-700">
    Ingredients <span className="text-red-500">*</span>
  </label>
  <button
    type="button"
    className="text-slate-400 hover:text-slate-600"
    title="Paste the complete ingredients list exactly as it appears on the product packaging"
    aria-label="Help for ingredients"
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
</div>
```

---

## Implementation Order Summary

### Order of Implementation

**Phase 1: Backend (Do First)**
1. ✅ Step 1.1: Extend scraping service for product name extraction
2. ✅ Step 1.2: Update DTOs (make ProductUrl optional)
3. ✅ Step 1.3: Update Product model (nullable ProductUrl)
4. ✅ **Step 4: Create and run database migration** ⚠️ CRITICAL
5. ✅ Step 1.4: Update AnalysisService business logic
6. ✅ Step 1.5: Update controller validation
7. ✅ Step 3.1: Write backend unit tests
8. ✅ Test backend changes thoroughly

**Phase 2: Frontend (Do Second)**
1. ✅ Step 2.1: Update type definitions
2. ✅ Step 2.2: Update form hook with mode toggle
3. ✅ Step 2.3: Create InputModeSelector component
4. ✅ Step 2.4: Update AnalyzeForm component
5. ✅ Step 2.5: Update form validation (covered in 2.2)
6. ✅ Step 2.6: Update submission logic
7. ✅ Step 2.7: Disable re-analysis for manual products
8. ✅ Step 3.2: Write frontend unit tests
9. ✅ Test frontend changes thoroughly

**Phase 3: Polish (Do Last)**
1. ✅ Step 5.1: Update help text
2. ✅ Step 5.2: Add visual indicators
3. ✅ Step 5.3: Improve error messages
4. ✅ Step 5.4: Update empty states
5. ✅ Step 5.5: Add tooltips and hints
6. ✅ Step 3.3: Integration tests

---

### Deployment Checklist

**Pre-Deployment**:
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Database backup created
- [ ] Migration tested in staging environment
- [ ] API documentation updated
- [ ] User documentation updated

**Deployment Steps**:
1. [ ] Deploy backend changes
2. [ ] Run database migration
3. [ ] Verify migration succeeded
4. [ ] Deploy frontend changes
5. [ ] Smoke test in production
6. [ ] Monitor error logs
7. [ ] Monitor user feedback

**Rollback Plan**:
- Backend: Revert to previous version
- Database: Rollback migration (only if no new manual products created)
- Frontend: Revert to previous version

---

## Rollout Considerations

### Feature Flags

Consider adding a feature flag to control the rollout:

```csharp
// appsettings.json
{
  "FeatureFlags": {
    "EnableManualProductEntry": true
  }
}

// In controller
if (!_configuration.GetValue<bool>("FeatureFlags:EnableManualProductEntry"))
{
    // Only allow URL mode
    if (string.IsNullOrWhiteSpace(request.ProductUrl))
    {
        return BadRequest("Manual entry is currently disabled");
    }
}
```

Frontend:
```typescript
// Feature flag check
const ENABLE_MANUAL_MODE = import.meta.env.VITE_ENABLE_MANUAL_MODE === 'true';

// Only show mode selector if enabled
{ENABLE_MANUAL_MODE && (
  <InputModeSelector {...props} />
)}
```

---

### Backward Compatibility

- ✅ Existing products with URLs: Unchanged
- ✅ Existing API calls: Still work (ProductUrl optional)
- ✅ Existing frontend: Will work with backend changes
- ✅ Database: Backward compatible (existing data unchanged)

---

### Monitoring and Metrics

Track these metrics post-deployment:

**Backend Metrics**:
- Number of URL-based analyses created
- Number of manual analyses created
- Scraping success rate
- Scraping failure reasons
- Average response time for each mode

**Frontend Metrics**:
- Mode selection distribution (URL vs Manual)
- Mode switch frequency
- Form completion rate by mode
- Error rate by mode
- Re-analysis attempt rate on manual products

**Database Metrics**:
- Number of products with null URLs
- Number of duplicate manual product names
- Storage growth rate

---

### User Communication

**Changelog Entry**:
```markdown
## [Version X.X.X] - 2025-11-09

### Added
- **Manual Product Entry**: You can now enter product details manually without providing a URL
  - Choose between "Scrape from URL" or "Enter Manually" modes
  - Useful when products aren't available online or for local/store brands
  - Note: Manually entered products cannot be re-analyzed

### Changed
- Product URL is now optional (required only in URL mode)
- Improved error messaging when scraping fails
- Added visual indicators to distinguish manual entries in My Products view

### Technical
- Database migration: ProductUrl column is now nullable
- Added product name scraping from URLs
- Enhanced validation for dual input modes
```

**In-App Announcement** (optional):
Show a one-time modal or banner explaining the new feature to existing users.

---

### Known Limitations

1. **Manual Product Re-analysis**: Cannot re-analyze manual products (by design)
   - Workaround: User can create a new analysis with updated pet info

2. **Duplicate Manual Products**: System allows duplicate product names for manual entries
   - Rationale: No way to determine if they're the same product without URL

3. **Product Name Scraping**: May fail on some websites
   - Fallback: User can provide product name manually even in URL mode

4. **Migration**: Cannot rollback if manual products have been created
   - Mitigation: Test thoroughly in staging before production deployment

---

## Documentation Updates

### API Documentation

Update API spec to reflect optional ProductUrl:

```yaml
/api/analyses:
  post:
    summary: Create a new analysis
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              isManual:
                type: boolean
                description: "Input mode flag: true for manual entry, false for URL scraping"
              productUrl:
                type: string
                format: uri
                nullable: true
                description: "Product URL (required when isManual=false, must be null when isManual=true)"
              productName:
                type: string
                nullable: true
                description: "Product name (required when isManual=true, optional when isManual=false)"
              ingredientsText:
                type: string
                nullable: true
                description: "Ingredients text (required when isManual=true, optional when isManual=false)"
              species:
                type: string
                enum: [Cat, Dog]
              breed:
                type: string
              age:
                type: integer
              additionalInfo:
                type: string
                nullable: true
            required: [isManual, species, breed, age]
            oneOf:
              - description: "URL mode"
                properties:
                  isManual:
                    enum: [false]
                required: [productUrl]
              - description: "Manual mode"
                properties:
                  isManual:
                    enum: [true]
                required: [productName, ingredientsText]
```

---

### User Guide

Update user documentation:

**Section: "How to Analyze Pet Food"**

1. **Using URL Mode**:
   - Select "Scrape from URL"
   - Paste a product URL from supported websites
   - The system will automatically retrieve product name and ingredients
   - Fill in your pet's information
   - Submit to get analysis
   - You can re-analyze this product later with different pet info

2. **Using Manual Mode**:
   - Select "Enter Manually"
   - Enter the product name
   - Paste the ingredients list from the packaging
   - Fill in your pet's information
   - Submit to get analysis
   - Note: You cannot re-analyze manual entries; create a new one instead

---

## Success Criteria

### Definition of Done

- [ ] Backend can handle both URL and manual modes
- [ ] Product name can be scraped from URLs
- [ ] ProductUrl is optional in database
- [ ] Frontend has mode selector component
- [ ] Form validation works for both modes
- [ ] Manual products cannot be re-analyzed
- [ ] Visual indicators distinguish manual products
- [ ] All tests passing (unit + integration)
- [ ] Documentation updated
- [ ] Migration successfully applied
- [ ] Deployed to production
- [ ] Monitoring in place

### Acceptance Criteria

**URL Mode**:
- ✅ User can provide only a URL
- ✅ System scrapes product name and ingredients
- ✅ Analysis is created successfully
- ✅ Product can be re-analyzed

**Manual Mode**:
- ✅ User can provide product name and ingredients
- ✅ No URL is required
- ✅ Analysis is created successfully
- ✅ Product shows "Manual Entry" badge
- ✅ Re-analyze button is disabled with explanation

**Mode Switching**:
- ✅ User can switch between modes
- ✅ Confirmation shown when data would be lost
- ✅ Fields are cleared when switching

**Error Handling**:
- ✅ Validation errors shown appropriately
- ✅ Scraping failures handled gracefully
- ✅ Helpful error messages displayed

---

## Appendix

### Related Files Reference

**Backend Files**:
- `PetFoodVerifAI/Services/IScrapingService.cs`
- `PetFoodVerifAI/Services/BasicScrapingService.cs`
- `PetFoodVerifAI/Services/AnalysisService.cs`
- `PetFoodVerifAI/Services/IAnalysisService.cs`
- `PetFoodVerifAI/Controllers/AnalysesController.cs`
- `PetFoodVerifAI/DTOs/AnalysisDtos.cs`
- `PetFoodVerifAI/Models/Product.cs`
- `PetFoodVerifAI/Models/Analysis.cs`
- `PetFoodVerifAI/Data/ApplicationDbContext.cs`

**Frontend Files**:
- `frontend/src/types/analyze.ts`
- `frontend/src/views/analyze/hooks/useAnalyzeForm.ts`
- `frontend/src/views/analyze/components/AnalyzeForm.tsx`
- `frontend/src/views/analyze/components/InputModeSelector.tsx` (new)
- `frontend/src/views/analyze/components/InlineHelp.tsx`
- `frontend/src/views/analyze/AnalyzePage.tsx`
- `frontend/src/views/products/components/ReanalyzeButton.tsx`
- `frontend/src/views/products/components/ProductListItem.tsx`
- `frontend/src/services/analysisService.ts`

**Test Files**:
- `PetFoodVerifAI.Tests/BasicScrapingServiceTests.cs`
- `PetFoodVerifAI.Tests/BasicScrapingServiceTests_ProductName.cs` (new)
- `PetFoodVerifAI.Tests/AnalysisServiceTests_DualMode.cs` (new)
- `frontend/src/__tests__/hooks/useAnalyzeForm.test.ts`
- `frontend/src/__tests__/components/InputModeSelector.test.tsx` (new)

---

### Questions and Considerations

1. **Should we limit the number of manual products per user?**
   - Could prevent abuse if manual entries are unlimited

2. **Should we allow editing product name after creation?**
   - Currently not supported, but could be useful

3. **Should we deduplicate manual products by exact name match?**
   - Current plan: No deduplication (each manual entry is separate)
   - Alternative: Warn user if similar name exists

4. **Should we show product URL in analysis results?**
   - Yes for URL-based products
   - No URL to show for manual products

5. **Should we migrate existing analyses if we add manual mode later?**
   - No migration needed, this is backward compatible

---

### Timeline Estimate

**Backend Development**: 3-4 days
- Day 1: Scraping service + DTOs + Model
- Day 2: Service logic + Controller
- Day 3: Unit tests + Integration tests
- Day 4: Review + Bug fixes

**Frontend Development**: 3-4 days
- Day 1: Types + Form hook
- Day 2: InputModeSelector component
- Day 3: Form updates + Submission logic
- Day 4: Re-analysis restrictions + Visual indicators

**Testing & Polish**: 2-3 days
- Day 1: Integration testing
- Day 2: UI/UX polish
- Day 3: Documentation + Final review

**Total Estimate**: 8-11 days

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding dual input mode (URL scraping vs manual entry) to the PetFoodVerifAI analyze view. The changes are designed to be:

- **Backward Compatible**: Existing functionality remains unchanged
- **User-Friendly**: Clear UI with helpful guidance
- **Maintainable**: Well-structured code with comprehensive tests
- **Scalable**: Can accommodate future enhancements

The key constraint—that manual products cannot be re-analyzed—is enforced both in the UI (disabled button) and could be enforced in the backend if needed.

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2025  
**Author**: AI Assistant  
**Status**: Planning Complete, Ready for Implementation

