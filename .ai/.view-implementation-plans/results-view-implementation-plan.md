# View Implementation Plan Results

## 1. Overview
- Render the analysis outcome page for authenticated users after an analysis completes.
- Surface recommendation badge, concise justification, AI disclaimer, metadata, and user actions (feedback, history, re-analyze).
- Provide resilient UX that handles loading, errors (401, 404, 5xx), and accessibility requirements.

## 2. View Routing
- Path: `/results/:analysisId` registered in the React router.
- Route guard: require authenticated layout; redirect to login on missing/expired auth (401 handler).

## 3. Component Structure
- `ResultsViewPage`
  - `ResultStatusPanel` (loading/error states)
  - `ResultsContent` (renders when data ready)
    - `AnalysisBadge`
    - `ResultMeta`
    - `JustificationCard`
    - `AIDisclaimer`
    - `FeedbackSection`
      - `FeedbackButtons`
    - `ActionRow`
      - `GoToHistoryLink`
      - `ReanalyzeButton`

## 4. Component Details
### ResultsViewPage
- Component description orchestrates routing param, data fetch, error handling, layout.
- Main elements: top-level `section`, `ResultStatusPanel`, `ResultsContent` container.
- Handled interactions: initiates fetch on `analysisId` change; delegates actions to children; retry button triggers refetch.
- Handled validation: confirm `analysisId` route param is valid UUID before fetch; ensure response fields mapped safely (fallbacks when null).
- Types: `AnalysisResultViewModel`, `PageErrorState`, `UseAnalysisDetailResult`.
- Props: none (uses router hooks).

### ResultStatusPanel
- Component description displays loading spinner, skeleton, or error messaging with retry option.
- Main elements: `div` with `aria-live` region, spinner, error illustration, `Retry` button.
- Handled interactions: `onRetry()` from parent.
- Handled validation: ensures status enum recognized; prevents retry spam by disabling button while pending.
- Types: `ResultStatusProps` containing `status`, `errorMessage`.
- Props: `status`, `error`, `onRetry`.

### ResultsContent
- Component description wrapper for main content once data loaded.
- Main elements: `article` with grid layout wrapping child components.
- Handled interactions: none directly.
- Handled validation: ensures required props exist (`analysis`).
- Types: `AnalysisResultViewModel`.
- Props: `analysis`, `feedbackState`, `onSubmitFeedback`, `onReanalyze`.

### AnalysisBadge
- Component description renders recommendation badge with icon, label, accessible color + text.
- Main elements: `div`/`span` with icon (e.g., `CheckCircleIcon`/`XCircleIcon`), label text, optional subdued `IsGeneral` tag.
- Handled interactions: none.
- Handled validation: Assert recommendation value is known (`recommended`, `not_recommended`); fallback label if unknown.
- Types: `RecommendationKind` union.
- Props: `recommendation`, `isGeneral`.

### ResultMeta
- Component description displays product metadata and pet context.
- Main elements: `dl`/`div` pairings for product name (with external link), URL, species/breed/age, additional info, timestamp, analysis ID.
- Handled interactions: product link opens in new tab (`rel="noopener"`), copy analysis ID button optional (if provided).
- Handled validation: guard against missing optional fields; format timestamp; ensure URL is valid before rendering anchor.
- Types: `AnalysisResultViewModel` subset (product fields), `FormattedMeta`.
- Props: `analysis` (or destructured fields).

### JustificationCard
- Component description surfaces concise justification, optionally ingredient concerns list if available.
- Main elements: `section` with heading, `p` for justification, optional `ul` for concerns.
- Handled interactions: none.
- Handled validation: fallback message if justification empty; ensure concerns array safe.
- Types: `JustificationProps` containing `text`, `concerns?`.
- Props: `justification`, `concerns?`.

### AIDisclaimer
- Component description static banner clarifying AI-generated nature.
- Main elements: `aside` with icon and text, `role="note"` or `role="alert"` with `aria-live="polite"`.
- Handled interactions: none.
- Handled validation: none (text constant).
- Types: none beyond intrinsic.
- Props: none.

### FeedbackSection
- Component description groups heading, helper text, status message, and `FeedbackButtons`.
- Main elements: `section` containing `h2`, descriptive text, `FeedbackButtons`, success/error message with `aria-live`.
- Handled interactions: passes click events to parent handler; displays status updates.
- Handled validation: ensures feedback available only when user has not already submitted; hides after success if desired.
- Types: `FeedbackState`.
- Props: `feedbackState`, `onSubmitFeedback`.

### FeedbackButtons
- Component description two icon buttons for thumbs up/down with loading and disabled states.
- Main elements: `button` pair with accessible labels, icons, `data-state` attributes.
- Handled interactions: `onClick` for each button; prevents double submission while pending/success.
- Handled validation: ensures `analysisId` defined before firing; ensures bool mapping (up → true, down → false).
- Types: `FeedbackDirection`, `FeedbackButtonsProps`.
- Props: `status`, `lastSubmitted`, `onSubmit`, `isDisabled?`.

### GoToHistoryLink
- Component description CTA linking to history filtered by product.
- Main elements: `Link` (react-router) styled as button.
- Handled interactions: `onClick` triggers navigation to `/history?productId=...`.
- Handled validation: hide/disable if `productId` missing.
- Types: `GoToHistoryLinkProps`.
- Props: `productId`.

### ReanalyzeButton
- Component description button to navigate back to analysis form with prefilled data (via state or query params).
- Main elements: `button` or `Link` with icon.
- Handled interactions: `onClick` executes navigation with `navigate('/analyze', { state: { ...analysisFormDefaults } })`.
- Handled validation: ensure required fields (productName/url/species/age/breed) exist before enabling; disable if missing.
- Types: `ReanalyzePayload` derived from analysis.
- Props: `analysis`, `onReanalyze` callback.

## 5. Types
- `RecommendationKind = 'recommended' | 'not_recommended'` mapped from API enum.
- `SpeciesKind = 'Cat' | 'Dog'` string literal union derived from backend.
- `IngredientConcern = { type: 'questionable' | 'unacceptable'; ingredient: string; reason: string }`.
- `AnalysisResultViewModel = {
  analysisId: string;
  productId: string;
  productName: string;
  productUrl?: string;
  isGeneral: boolean;
  recommendation: RecommendationKind;
  justification: string;
  concerns?: IngredientConcern[];
  species: SpeciesKind;
  breed?: string;
  age?: number;
  additionalInfo?: string;
  ingredientsText?: string;
  createdAt: string; // ISO
}`.
- `FeedbackDirection = 'up' | 'down'`.
- `FeedbackState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  lastSubmitted?: FeedbackDirection;
  message?: string;
}`.
- `PageStatus = 'loading' | 'ready' | 'error' | 'notFound'`.
- `PageErrorState = {
  type: 'notFound' | 'unauthorized' | 'server' | 'network';
  message: string;
}`.
- `FeedbackRequestDto = { isPositive: boolean }` (aligns with backend `CreateFeedbackRequest`).
- `AnalysisDetailDto` interface reflecting backend payload fields (all optional typed accordingly) to decode API response before mapping to view model.

## 6. State Management
- Use `useParams` to obtain `analysisId` and validate before fetching.
- Custom hook `useAnalysisDetail(analysisId)` handles data fetching, error classification, and return tuple `{ status, data, error, refetch }`.
- Custom hook `useFeedbackSubmission(analysisId)` manages feedback POST, exposes `{ feedbackState, submitFeedback }`.
- Local derived memoized values for formatted timestamp (`useMemo` + `Intl.DateTimeFormat`), pet summary string, isReanalyzeDisabled.
- Integrate with global auth context to trigger logout on 401.

## 7. API Integration
- GET `/api/analyses/{analysisId}`
  - Request: GET with `Authorization: Bearer <token>` header.
  - Response: `AnalysisDetailDto` JSON; map numeric enums to unions; parse optional fields.
  - Error handling: 401 (logout), 404 (set `PageStatus` to `notFound`), 5xx or network (set `PageStatus` to `error`).
- POST `/api/analyses/{analysisId}/feedback`
  - Request body: `FeedbackRequestDto` with `isPositive` true/false.
  - Response: 201 Empty; treat success by updating `feedbackState` to success.
  - Error handling: 409 (display "Feedback already submitted" and mark success), 401 (logout), others -> set error state with retry option.
- Optional: provide abort controller for fetch cancellation on unmount.

## 8. User Interactions
- On mount, fetch analysis; show loader until resolved.
- Clicking product URL opens new tab with sanitized target.
- Clicking `Go to history` navigates to history view filtered by product.
- Clicking `Re-analyze` navigates to `/analyze` with prefilled payload; confirm if data missing.
- Clicking thumbs up/down triggers feedback POST; buttons show loading state; success message displayed; further clicks disabled.
- Retry button in error panel reissues GET request.

## 9. Conditions and Validation
- Validate route param: if absent/invalid UUID, skip fetch and show error message.
- Ensure `recommendation` value is either success/fail; unknown values produce neutral badge with warning text.
- Verify `productUrl` is valid before rendering anchor; else show plain text.
- Only enable `ReanalyzeButton` when essential fields (productName, productUrl, species, age, breed) exist; otherwise show tooltip/disabled state.
- For feedback, ensure analysis fetch complete and not already successful before enabling buttons.
- Provide accessible labels and status messages for screen readers (aria-label, aria-live, role).

## 10. Error Handling
- 401 Unauthorized: invoke auth logout hook, redirect to login, optionally show toast.
- 404 Not Found: display dedicated message suggesting return to history or analyze new product.
- Network/500/503: show error panel with retry; log error for monitoring.
- Feedback 409: display info banner "Feedback already recorded" and set state to success to disable buttons.
- Generic feedback errors: show inline error message with retry link; keep buttons enabled after failure.
- Add fallback UI for missing data (e.g., "Unknown product" if productName empty).

## 11. Implementation Steps
1. Define TypeScript interfaces/unions for `AnalysisDetailDto`, `AnalysisResultViewModel`, `FeedbackRequestDto`, `FeedbackState`.
2. Implement utility mappers for recommendation/species enums and date formatting helpers.
3. Create `useAnalysisDetail` hook handling fetch, mapping, status, error normalization.
4. Create `useFeedbackSubmission` hook managing POST, state transitions, and error normalization.
5. Build `ResultsViewPage` component integrating hooks, controlling layout, and handling navigation actions.
6. Implement `ResultStatusPanel` with loader, error, and not-found states plus retry callback.
7. Implement `AnalysisBadge`, `ResultMeta`, `JustificationCard`, and `AIDisclaimer` components with Tailwind styling and accessibility semantics.
8. Implement `FeedbackSection` and `FeedbackButtons`, wiring success/error messages and disabling logic.
9. Implement `GoToHistoryLink` and `ReanalyzeButton` components with navigation behavior and guard conditions.
10. Compose components within `ResultsContent`, ensuring responsive layout and semantic headings.
11. Add route definition for `/results/:analysisId` inside router configuration, ensure parent layout includes authentication guard.
12. Add integration tests or Storybook stories verifying states (loading, success, error, 404) and interactions (feedback submission success/error).
13. Manually verify view using mock API responses; ensure accessibility with keyboard and screen-reader checks.
