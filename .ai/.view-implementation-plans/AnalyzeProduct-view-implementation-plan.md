# View Implementation Plan Analyze Product

## 1. Overview
The Analyze Product view gathers product and pet details, drives the initial scraping attempt, and falls back to manual ingredient entry so authenticated users can request a recommendation while preserving accessibility, validation parity with the API, and progress feedback.

## 2. View Routing
Authenticated route at `/analyze`; redirect unauthenticated users to login and navigate success responses to `/results/:analysisId`.

## 3. Component Structure
```text
AnalyzePage
├─ InlineHelp
└─ AnalyzeForm
   ├─ ProductNameInput
   ├─ ProductUrlInput
   ├─ SpeciesRadioGroup
   ├─ BreedTextInput
   ├─ AgeNumberInput
   ├─ AdditionalInfoTextarea
   ├─ ScrapeStatus
   │   └─ ManualIngredientsTextarea (conditional)
   ├─ FormValidationSummary
   └─ SubmitAnalysisButton
```

## 4. Component Details
### AnalyzePage
- **Purpose**: Layout shell that wires authentication guard, orchestrates form submission, and handles navigation after success.
- **Elements**: Wrap page in responsive container, render `InlineHelp`, `AnalyzeForm`, global toast region, and `aria-live` status text for submission.
- **Events**: Handle `onSubmit` payload, interpret API responses, capture 503 to toggle manual entry, and push history to results route.
- **Validation**: Run pre-submit sanitization (trim strings, coerce age) and ensure required fields before issuing API call.
- **Types**: Consumes `AnalyzeFormValues`, `CreateAnalysisRequest`, `AnalysisCreatedResponse`, `SubmitStatus`, `ScrapeState`.
- **Props**: None; obtains navigation and auth context internally.

### InlineHelp
- **Purpose**: Provide static guidance on acceptable product URLs, privacy notice, and explain scraping fallback.
- **Elements**: Heading, short paragraphs, list of tips, optional info icon styled with Tailwind, `role="note"`.
- **Events**: None; purely informational.
- **Validation**: Ensure copy references privacy policy and is screen-reader friendly with ordered focus placement.
- **Types**: No data model; content literals or localized strings.
- **Props**: Optional `className` for layout overrides.

### AnalyzeForm
- **Purpose**: Collect all form inputs, expose manual fallback controls, and surface validation errors inline and in summary.
- **Elements**: `<form>` with `aria-describedby`, grid layout for inputs, `ScrapeStatus`, `FormValidationSummary`, `SubmitAnalysisButton`.
- **Events**: Handle `onChange`, `onBlur`, `onSubmit`, manual ingredient toggle, and `onNoIngredients` acknowledgement.
- **Validation**: Mirror API by ensuring productName/productUrl/species/breed/age presence, URL format, positive age, and manual ingredients when required.
- **Types**: `AnalyzeFormValues`, `AnalyzeFormErrors`, `ScrapeState`, `ManualIngredientsState`.
- **Props**: `initialValues`, `submissionState`, `scrapeState`, `onSubmit(formValues)`, `onRequestManual()`, `onResetManual()`.

### ProductNameInput
- **Purpose**: Capture the product name exactly as on the store listing.
- **Elements**: `<label>` with required indicator, `<input type="text">`, inline error span.
- **Events**: `onChange`, `onBlur` to trigger trimming and validation.
- **Validation**: Required, trimmed length ≥ 2, block leading/trailing whitespace on blur.
- **Types**: Value string, error string from `AnalyzeFormErrors`.
- **Props**: `value`, `error`, `onChange`, `onBlur`, `disabled`.

### ProductUrlInput
- **Purpose**: Collect the product URL for scraping.
- **Elements**: `<label>`, `<input type="url">`, helper text referencing allowed domain, inline error.
- **Events**: `onChange` with live validation, `onBlur` to normalize.
- **Validation**: Required, passes URL constructor, ensures host matches configured store.
- **Types**: Value string, error string, optional allowed host constant.
- **Props**: `value`, `error`, `onChange`, `onBlur`, `disabled`.

### SpeciesRadioGroup
- **Purpose**: Let user pick Cat or Dog with accessible radios.
- **Elements**: Fieldset, legend, two radio buttons with icons/text.
- **Events**: `onChange` toggling species selection.
- **Validation**: Required; default to none to force explicit choice.
- **Types**: `SpeciesOption` union, error string.
- **Props**: `value`, `error`, `onChange`, `disabled`.

### BreedTextInput
- **Purpose**: Capture free-text breed information.
- **Elements**: `<label>`, `<input type="text">`, helper note on free text.
- **Events**: `onChange`, `onBlur`.
- **Validation**: Required, trimmed length ≥ 2, avoid numbers-only strings.
- **Types**: Value string, error string.
- **Props**: `value`, `error`, `onChange`, `onBlur`, `disabled`.

### AgeNumberInput
- **Purpose**: Collect pet age in years for LLM context.
- **Elements**: `<label>`, `<input type="number">` with min attribute, optional appended unit.
- **Events**: `onChange` converting to number, `onBlur` to clamp.
- **Validation**: Required, integer ≥ 1, provide inline warning for improbable values (e.g., > 30).
- **Types**: Value number or empty, error string.
- **Props**: `value`, `error`, `onChange`, `onBlur`, `disabled`.

### AdditionalInfoTextarea
- **Purpose**: Capture optional notes for the LLM.
- **Elements**: `<label>`, `<textarea>`, helper on max length (e.g., 500 chars), char counter.
- **Events**: `onChange`, `onBlur`.
- **Validation**: Optional; enforce max length and sanitize HTML.
- **Types**: Value string.
- **Props**: `value`, `onChange`, `onBlur`, `disabled`.

### ScrapeStatus
- **Purpose**: Display real-time scraping/analysis progress and fallback guidance with `aria-live="polite"`.
- **Elements**: Status badge, descriptive text, optional retry button, manual entry CTA.
- **Events**: `onRetry`, `onEnableManual`, `onDismiss`.
- **Validation**: Ensure manual CTA only active when scraping failed or user opts in.
- **Types**: `ScrapeState`, `ScrapeMessage`, optional timestamp.
- **Props**: `state`, `message`, `onRetry`, `onEnableManual`, `isManualVisible`.

### ManualIngredientsTextarea
- **Purpose**: Allow user to paste ingredients or declare none available.
- **Elements**: `<textarea>`, "No ingredient list available" checkbox, helper copy about formatting.
- **Events**: `onChange`, `onNoIngredientsToggle`, `onBlur`.
- **Validation**: Required when manual visible unless `noIngredientsAvailable` true; enforce reasonable length.
- **Types**: `ManualIngredientsState`, error string.
- **Props**: `value`, `noIngredients`, `error`, `onChange`, `onNoIngredientsToggle`, `disabled`.

### FormValidationSummary
- **Purpose**: Aggregate field errors for accessibility at top of form.
- **Elements**: `role="alert"` container, list of anchor links to fields.
- **Events**: `onFocusField(fieldId)` when user clicks summary item.
- **Validation**: Mirrors `AnalyzeFormErrors`, updates on submit attempt.
- **Types**: `AnalyzeFormErrors`.
- **Props**: `errors`, `onFocusField`, `show`.

### SubmitAnalysisButton
- **Purpose**: Submit form while showing loading state and preventing duplicates.
- **Elements**: `<button type="submit">` with spinner and dynamic label.
- **Events**: `onClick`, `onKeyPress`.
- **Validation**: Disabled when form invalid, submitting, or scrape retry pending.
- **Types**: `SubmitStatus`.
- **Props**: `status`, `disabled`, `loadingLabel`.

## 5. Types
Backend DTO alignment uses `CreateAnalysisRequest` and `AnalysisCreatedResponse` from `PetFoodVerifAI/DTOs/AnalysisDtos.cs`; map frontend payloads directly to maintain parity.

```ts
type SpeciesOption = "Cat" | "Dog";

type AnalyzeFormValues = {
  productName: string;
  productUrl: string;
  species: SpeciesOption | "";
  breed: string;
  age: number | "";
  additionalInfo: string;
  ingredientsText: string;
  hasManualIngredients: boolean;
  noIngredientsAvailable: boolean;
};

type AnalyzeFormErrors = {
  productName?: string;
  productUrl?: string;
  species?: string;
  breed?: string;
  age?: string;
  ingredientsText?: string;
  manualAcknowledgement?: string;
  global?: string;
};

type ScrapeState = "idle" | "scraping" | "awaitingManual" | "manualReady" | "submitting";

type ManualIngredientsState = {
  isVisible: boolean;
  value: string;
  noIngredientsAvailable: boolean;
};

type SubmitStatus = "idle" | "submitting" | "succeeded" | "failed";

type ApiErrorShape = {
  status: number;
  message: string;
  details?: string;
};
```

## 6. State Management
- `formValues`: Controlled via `useReducer` inside `useAnalyzeForm` to store `AnalyzeFormValues`, seeded from in-memory draft and updated per field.
- `formErrors`: `useState<AnalyzeFormErrors>` populated on blur and submit; clear field errors on valid edits.
- `scrapeState`: `useState<ScrapeState>` transitions (`scraping`, `awaitingManual`, etc.) with `aria-live` announcements.
- `submissionStatus`: `useState<SubmitStatus>` controlling button disablement, spinner, and navigation timing.
- `manualIngredients`: `useState<ManualIngredientsState>` to toggle textarea, track `noIngredientsAvailable`, and sync with payload.
- `apiError`: `useState<ApiErrorShape | null>` for toast/banner display; reset on next submit; optionally extend via `useToast`.

## 7. API Integration
- Issue authenticated POST to `/api/analyses` using `CreateAnalysisRequest` payload built from sanitized form values.
- Exclude `ingredientsText` when blank unless manual mode active or `noIngredientsAvailable` flagged with empty string for backend handling.
- Interpret 201 response as `AnalysisCreatedResponse`, store in context if needed, and navigate to `/results/${analysisId}`.
- On 400 parse validation errors from JSON body, map to `AnalyzeFormErrors`, and focus first invalid field.
- On 503 inspect `details` to differentiate scraper vs LLM outages; enter `awaitingManual` state when scraper unavailable, else show retry message.
- Include `Authorization: Bearer` header from auth context and handle token expiry by redirecting to login on 401.

## 8. User Interactions
- Form field entry updates `formValues`, clears respective errors, and persists draft in memory while staying on page.
- Initial submit triggers API call, sets `scrapeState="scraping"`, and announces progress via `aria-live`.
- If scraping fails, user selects manual entry button to reveal textarea and either paste ingredients or flag unavailability.
- Manual resubmit uses same submit handler, but now payload includes `ingredientsText` or empty string plus fallback messaging.
- Cancel manual mode resets textarea and re-enables automated scraping attempt when user adjusts URL.
- Success response navigates to results page and resets local state while optionally storing last request summary in global context.

## 9. Conditions and Validation
- Product name: non-empty, trimmed, length ≥ 2; enforce before submit and show inline error with summary link.
- Product URL: valid absolute URL matching configured domain; block spaces and highlight invalid host.
- Species: must be `Cat` or `Dog`; focus radios on error.
- Breed: non-empty, trimmed; optionally warn for numeric-only entries.
- Age: positive integer (≥ 1); convert string to number, clamp unrealistic highs (> 30), and reject non-numeric input.
- Manual ingredients: when manual visible and `noIngredientsAvailable` false require length ≥ 10 chars; when true send empty string and surface banner explaining automatic "Not Recommended" outcome.

## 10. Error Handling
- Map 400 responses to field-level errors with accessible summary; display server messages in `FormValidationSummary`.
- Handle 401 by clearing auth state and redirecting to login with return path stored.
- Distinguish 503 from scraping vs LLM by message inspection; show CTA to enter manual ingredients or retry later, leaving fields intact.
- Network/offline errors show non-blocking toast and allow user to retry without losing inputs.
- Unexpected 500 errors display generic banner and log to telemetry, keeping `submissionStatus="failed"`.

## 11. Implementation Steps
1. Scaffold `/analyze` route with auth guard and page layout shell in routing configuration.
2. Implement `AnalyzePage` component with navigation hooks, toast provider wiring, and default form state.
3. Build `InlineHelp` with static copy and Tailwind styling, ensuring accessibility semantics.
4. Create `AnalyzeForm` using `useAnalyzeForm` hook; include context for value updates, error handling, and manual toggle actions.
5. Implement individual input components (`ProductNameInput`, `ProductUrlInput`, `SpeciesRadioGroup`, `BreedTextInput`, `AgeNumberInput`, `AdditionalInfoTextarea`) with controlled props and Tailwind classes.
6. Add `ScrapeStatus` component with aria-live region, dynamic messaging, and manual fallback CTA.
7. Implement `ManualIngredientsTextarea` with checkbox and validation messaging tied to hook state.
8. Build `FormValidationSummary` to consume errors map, render focusable links, and announce updates.
9. Create `SubmitAnalysisButton` with loading spinner, disable logic, and accessible label updates.
10. Implement `useAnalyzeForm` hook to manage state, field validators, manual fallback rules, and draft persistence via `useRef` or context.
11. Wire API integration in `AnalyzePage` using fetch/axios wrapper, map errors, set states, and navigate on success.
12. Add tests or Storybook scenarios for components, especially manual fallback flow, to validate accessibility and state transitions.
13. Verify aria-live announcements, keyboard navigation, and validation parity with backend using manual QA checklist.
