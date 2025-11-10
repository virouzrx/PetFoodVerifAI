# UI Architecture for Pet Food Analyzer

## 1. UI Structure Overview

The application is a secure, accessible SPA with a pre-auth landing experience, authenticated analysis flow, results view with feedback capture, and a personal history with contextual versioning. Desktop and tablet are primary targets; smaller breakpoints adapt via utility classes. Authentication gates protect all data routes.

- **Primary flows**: Landing → Register/Login → Analyze Product → Results (+Feedback) → My Products → Version History → Re-analyze. Password recovery: Login → Forgot Password → Email → Reset Password → Login.
- **State/data**: React Query (or RTK Query) for server sync; local component state for form drafts; optimistic feedback submission; global auth/session state with HTTP-only cookie-based auth, forced logout on 401.
- **Accessibility**: WCAG 2.1 AA, semantic regions, form labeling, ARIA for dynamic status (scraping, analysis), keyboard-navigation-first drawers/modals.
- **Security**: HTTP-only cookies (preferred) for tokens; CSRF protection when using cookies; least-privileged API calls; 401-driven sign-out; input validation mirrored client-side; no sensitive data persisted in client storage beyond ephemeral form drafts.
- **Error handling**: Inline field validation (400), session expiry handling (401) with redirect and message, service unavailability (503) surfaced as retryable alerts, offline detection. Clear, actionable messages mapped from API codes.

- **Key API endpoints** (compatibility summary):
  - POST `/api/auth/register`, POST `/api/auth/login`
  - POST `/api/auth/forgot-password`, POST `/api/auth/reset-password`
  - POST `/api/analyses`
  - GET `/api/analyses` (paginated, optional `productId`)
  - GET `/api/analyses/{id}`
  - POST `/api/analyses/{analysisId}/feedback`

- **Requirements coverage** (high level):
  - FR-01 Auth: Register/Login views with gated routes; no guest access.
  - FR-02 Form: Analyze Product view with dual input modes (URL mode and Manual mode).
  - FR-03 Product Data Scraping: Automatic extraction of product name and ingredients from URL in URL mode.
  - FR-04 Manual Entry: Primary manual entry mode plus fallback manual ingredient entry when scraping fails.
  - FR-05 LLM Analysis: Analysis request from Analyze Product view.
  - FR-06/FR-07 Results: Badge, justification, visible disclaimer.
  - FR-08/FR-09 History + Versioning: My Products list + Product Version History drawer.
  - FR-10 Feedback: Thumbs up/down on Results.
  - FR-11 Database (server concern): Reflected in endpoints and persisted artifacts.
  - FR-12 Loading: Accessible indicators for scraping and analysis.

## 2. View List

1) **Landing**
- **Path**: `/`
- **Main purpose**: Pre-auth introduction; set expectations (PoC scope); CTA to Register/Login.
- **Key information**: What the app does; PoC limitations (single store); privacy note; link to auth.
- **Key view components**: `MarketingHero`, `HowItWorks`, `PoCScopeNotice`, `PrimaryCTAButtons` (Login, Register), `FooterLinks` (Privacy/Terms).
- **UX/Accessibility/Security**:
  - Clear primary action; concise copy; semantic headings; focus order logical.
  - No authenticated data exposed; do not render user data.

2) **Register**
- **Path**: `/register`
- **Main purpose**: Create user account.
- **Key information**: Email, password (requirements), link to Login.
- **Key view components**: `AuthForm` (email/password), `PasswordStrengthHint`, `FormErrorSummary`, `SubmitButton` with progress, `AuthSwitchLink`.
- **UX/Accessibility/Security**:
  - Form labels, descriptions, error text bound to inputs; keyboard-friendly.
  - Map 400/409 errors to inline messages; avoid storing plaintext passwords; submit over HTTPS.
  - On success, auto-login and redirect to `/analyze`.

3) **Login**
- **Path**: `/login`
- **Main purpose**: Authenticate existing user.
- **Key information**: Email, password; links to Register and Forgot Password.
- **Key view components**: `AuthForm`, `GlobalAlert` (invalid credentials), `SubmitButton` with progress, `AuthSwitchLink`, `ForgotPasswordLink`.
- **UX/Accessibility/Security**:
  - Handle 401 with non-disclosing error; prevent timing leaks in UI.
  - On success, set HTTP-only cookie (server), refresh auth state, route to `/analyze`.
  - Include clear "Forgot Password?" link below form.

4) **Forgot Password**
- **Path**: `/forgot-password`
- **Main purpose**: Initiate password recovery by requesting a reset email.
- **Key information**: Email input; success message; link back to Login.
- **Key view components**: `ForgotPasswordForm` (email only), `SubmitButton` with progress, `SuccessMessage`, `BackToLoginLink`, `FormErrorSummary`.
- **UX/Accessibility/Security**:
  - Always show generic success message to prevent user enumeration: "If an account with that email exists, we've sent a password reset link. Please check your email."
  - Map 400 errors (invalid email format) to inline validation.
  - Clear instructions; emphasize checking spam folder.
  - Form resets after submission; success message persists.

5) **Reset Password**
- **Path**: `/reset-password`
- **Main purpose**: Complete password recovery using token from email.
- **Key information**: New password, confirm password; token and email from URL parameters; success/error messages; link to request new reset.
- **Key view components**: `ResetPasswordForm` (new password, confirm password), `PasswordStrengthHint`, `SubmitButton` with progress, `SuccessMessage`, `ErrorAlert`, `RequestNewResetLink`.
- **UX/Accessibility/Security**:
  - Extract `email` and `token` from URL query parameters on mount.
  - Validate password strength client-side (matches registration requirements).
  - On success: Show success message and auto-redirect to `/login` after 3 seconds with countdown.
  - On failure (invalid/expired token): Clear error with actionable link to `/forgot-password`.
  - Handle missing URL parameters gracefully; prompt user to request reset.
  - Token never displayed to user; handled internally.

6) **Analyze Product**
- **Path**: `/analyze` (default authenticated landing)
- **Main purpose**: Collect product and pet details via dual input modes; orchestrate scraping or manual entry and submit for analysis.
- **Key information**: Input mode selector (URL/Manual), Product Name (manual mode only), Product URL (URL mode only), Species (Cat/Dog), Breed, Age, Additional Info, Ingredients (manual mode or fallback); notices about scraping and privacy; submission status.
- **Key view components**: 
  - `AnalyzeForm` (vertical): `InputModeSelector` (URL/Manual toggle), `ProductNameInput` (visible in manual mode), `ProductUrlInput` (visible in URL mode), `SpeciesRadioGroup`, `BreedTextInput`, `AgeNumberInput`, `AdditionalInfoTextarea`.
  - `ScrapeStatus` with `aria-live` (in URL mode, shows scraping progress for product name and ingredients), `ManualIngredientsTextarea` displayed in manual mode or as fallback when scraping fails.
  - `SubmitAnalysisButton` with loading state; `FormValidationSummary`.
  - `InlineHelp` for acceptable URLs and data usage.
- **UX/Accessibility/Security**:
  - Client-side validation mirrors API; prevent duplicate submissions; persist draft in memory.
  - In URL mode: Product name is automatically extracted from URL (not user input). User only provides URL.
  - In Manual mode: User provides both product name and ingredients manually.
  - Loading indicators for scraping and analysis; progress is announced to screen readers.
  - On 503 from scraper/LLM, propose manual ingredients retry or later retry; preserve inputs.

7) **Results**
- **Path**: `/results/:analysisId`
- **Main purpose**: Display recommendation badge, concise justification, AI disclaimer; allow feedback.
- **Key information**: Product name/url; species/breed/age; recommendation (Recommended/Not Recommended); justification; timestamp; analysis ID; link to history and re-analyze.
- **Key view components**: `AnalysisBadge`, `JustificationCard`, `AIDisclaimer`, `FeedbackButtons` (thumbs up/down), `ResultMeta`, `GoToHistoryLink`, `ReanalyzeButton`.
- **UX/Accessibility/Security**:
  - Badge includes text + icon; color is not the only indicator.
  - Feedback shows immediate confirmation, handles 409 (already submitted) gracefully.
  - Handle 404 for missing analysis; 401 triggers logout flow.

8) **My Products**
- **Path**: `/products`
- **Main purpose**: Show user's analyzed products with last analysis info; afford re-analysis and version history access.
- **Key information**: Product name, last recommendation, last analyzed date; pagination.
- **Key view components**: `ProductList`, `ProductListItem` (name, date, recommendation pill), `VersionHistoryTrigger` (opens drawer), `ReanalyzeButton`, `PaginationControls`, `EmptyState`.
- **UX/Accessibility/Security**:
  - Keyboard-accessible list; large tap targets; clear empty state with CTA to Analyze.
  - Server-driven pagination; optimistic navigation; 401 sign-out.

9) **Product Version History (Drawer/Modal)**
- **Path**: N/A (invoked from `/products`, optionally reflected via `?productId=`)
- **Main purpose**: Contextual version history for a selected product.
- **Key information**: List of analyses for product (createdAt, recommendation), with links to specific results.
- **Key view components**: `SideDrawer`/`Modal`, `VersionList`, `VersionListItem`, `OpenResultButton`, `CloseButton`.
- **UX/Accessibility/Security**:
  - Focus trap; ESC to close; `aria-modal` with labelled title.
  - Paginated fetch with React Query; 404 handled as empty state; 401 sign-out.

10) **Not Found**
- **Path**: `/404` (and catch-all)
- **Main purpose**: Graceful fallback for unknown routes.
- **Key information**: Error copy; links to `/analyze` and `/products`.
- **Key view components**: `NotFoundMessage`, `PrimaryLinks`.
- **UX/Accessibility/Security**:
  - Clear recovery actions; no sensitive data exposure.

11) **Session Expired / Unauthorized**
- **Path**: Inline banner/dialog triggered on 401
- **Main purpose**: Inform about session expiry and guide to re-authenticate.
- **Key information**: Brief message; action to Login.
- **Key view components**: `SessionExpiredBanner`, `ReloginCTA`.
- **UX/Accessibility/Security**:
  - Non-blocking banner that persists until action; safe redirect to `/login`.

12) **Authenticated Shell (Layout)**
- **Path**: Wrapper for `/analyze`, `/products`, `/results/*`
- **Main purpose**: Provide consistent navigation and global UI affordances.
- **Key information**: App name; nav links; user menu.
- **Key view components**: `AppHeader` (logo, `NavLinks`: Analyze, My Products), `AccountMenu` (Logout), `GlobalAlertArea`, `RouteOutlet`, `LoadingBar`.
- **UX/Accessibility/Security**:
  - Landmarks (`header`, `main`, `nav`); skip-to-content link; high contrast and focus styles.
  - Logout clears client auth state; redirect to `/login`.

## 3. User Journey Map

- **Primary use case (URL Mode)**
  1. User lands on `/` → learns about app → proceeds to `/login` or `/register`.
  2. Auth success → routed to `/analyze` (default authenticated landing).
  3. User selects URL mode and fills form (URL, species, breed, age, optional info). Product name is not required as it will be extracted automatically.
  4. On submit, system scrapes product name and ingredients from URL. If scraping fails, `ManualIngredientsTextarea` appears inline with a message; user pastes ingredients and resubmits.
  5. Analysis request is sent → show "Thinking…" with progress (aria-live). On success, route to `/results/:analysisId`.
  6. Results view shows badge, justification, AI disclaimer. User optionally gives feedback (thumb up/down) → instant confirmation.
  7. User navigates to `My Products` to see history; opens Version History drawer for a product → can open prior results, or click Re-analyze to go back to `/analyze` with pre-filled fields.

- **Primary use case (Manual Mode)**
  1. User lands on `/` → learns about app → proceeds to `/login` or `/register`.
  2. Auth success → routed to `/analyze` (default authenticated landing).
  3. User selects Manual mode and fills form (product name, ingredients, species, breed, age, optional info). No URL required.
  4. On submit, analysis request is sent → show "Thinking…" with progress (aria-live). On success, route to `/results/:analysisId`.
  5. Results view shows badge, justification, AI disclaimer. User optionally gives feedback (thumb up/down) → instant confirmation.
  6. Product is saved in history marked as manual entry (no URL, cannot be re-analyzed via URL).

- **Re-analyze flow**
  - From `/products`, click Re-analyze → `/analyze` with product fields pre-filled (URL, name). Submit → new result saved; Version History updates.

- **Password recovery flow**
  1. From `/login`, user clicks "Forgot Password?" link → routed to `/forgot-password`.
  2. User enters email address and submits.
  3. Always shows success message: "If an account with that email exists, we've sent a password reset link. Please check your email."
  4. User checks email and clicks reset link → routed to `/reset-password?email=user@example.com&token=ABC123`.
  5. User enters new password and confirms; client validates strength.
  6. On successful submit → success message displayed, auto-redirect to `/login` after 3-second countdown.
  7. On failure (invalid/expired token) → error message with link to request new reset at `/forgot-password`.

- **Session expiry**
  - Any request returning 401 triggers `SessionExpiredBanner` and redirect to `/login` after user acknowledges.

## 4. Layout and Navigation Structure

- **Routing**
  - Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/404`.
  - Authenticated (guarded): `/analyze` (default), `/results/:analysisId`, `/products`.
  - Contextual UI state: Version History via drawer from `/products` (optional URL param `?productId=` for deep-linking).

- **Navigation**
  - Persistent header with links: Analyze, My Products; account menu with Logout.
  - Deep links from results to product history and vice versa.
  - Route guards redirect unauthenticated users to `/login` with a return path.

- **Status and alerts**
  - Global alert area for cross-page errors (503), success messages (feedback submitted), and session expiry.
  - Loading bar/inline spinners for network transitions and mutations.

## 5. Key Components

- **AuthGuard/ProtectedRoute**: Wraps authenticated routes; intercepts 401 to show session-expired UI and redirect.
- **AppHeader**: Branding, primary nav (Analyze, My Products), account menu (Logout), responsive menu for tablet.
- **GlobalAlertArea/Toast**: Surface API errors (400 mapped to forms, 401 session, 503 retry) and confirmations.
- **ForgotPasswordForm**: Single email input form; always shows success message (prevents user enumeration); handles email validation errors.
- **ResetPasswordForm**: New password and confirm password inputs; extracts token/email from URL; validates password strength; shows success with countdown redirect or error with recovery link.
- **AnalyzeForm**: Structured form with dual input mode support (URL/Manual), validation, and inline scraping fallback. Emits a normalized payload for POST `/api/analyses` with `isManual` flag.
- **InputModeSelector**: Toggle/radio group to switch between URL mode and Manual mode.
- **ScrapeStatus**: `aria-live` region reflecting scraping attempts and failures; shows progress for product name and ingredient extraction in URL mode; toggles manual entry fallback.
- **AnalysisBadge**: Accessible status badge with text and icon states for Recommended/Not Recommended.
- **JustificationCard**: Shows concise LLM reason; truncates with expandable details if lengthy.
- **AIDisclaimer**: Required legal notice visible on Results.
- **FeedbackButtons**: Thumbs up/down control; optimistic UI; maps 201/409 properly.
- **ProductList & ProductListItem**: History overview; last result status and date; actions for Version History and Re-analyze.
- **VersionHistoryDrawer**: Paginated list of analyses for a product; open specific result or close.
- **PaginationControls**: Consistent pagination for lists and version history.
- **EmptyState**: Friendly prompts when no products/analyses exist; CTA to Analyze.
- **ErrorBoundary**: Catches unexpected UI errors; offers safe navigation back to `/analyze`.

---

### API compatibility details (by view)
- Landing: none.
- Register/Login: POST `/api/auth/register` / POST `/api/auth/login`; handle 400/401/409.
- Forgot Password: POST `/api/auth/forgot-password`; always returns 200 OK (handles 400 for validation only); no user enumeration.
- Reset Password: POST `/api/auth/reset-password` with email, token, newPassword; handle 400 (invalid token, weak password).
- Analyze Product: POST `/api/analyses`; client sends `isManual` flag, in URL mode product name is automatically scraped (not provided by user), client triggers scraping or includes `ingredientsText` fallback; handle 400/503.
- Results: GET `/api/analyses/{id}`; POST feedback `/api/analyses/{analysisId}/feedback` (201/409).
- My Products: GET `/api/analyses` (paginated); filters by `productId` when opened in Version History drawer.
- Version History Drawer: GET `/api/analyses?productId=...` (paginated).

### Edge cases and error states
- Scraping unavailable or fails (URL mode): Show manual ingredients path inline; preserve user input; product name still extracted from URL.
- Manual mode selected: Product name and ingredients fields required; URL field hidden/disabled.
- URL mode selected: URL field required; product name field hidden/disabled (extracted automatically).
- No ingredient list available: Results explicitly mark Not Recommended with reason (per PRD).
- Service unavailable (503): Retry affordance and guidance; non-destructive UI state.
- Unauthorized (401): Session expired banner; safe redirect to `/login` with return path.
- Validation errors (400): Inline, field-specific messages; summary at top for screen readers.
- Duplicate feedback (409): Surface as non-blocking info; keep visible confirmation.
- Offline: Global offline indicator and deferred submission where feasible (no data loss locally).
- Invalid/expired reset token: Clear error message with actionable link to request new reset at `/forgot-password`.
- Missing URL parameters on reset password page: Prompt user to request password reset; provide link to `/forgot-password`.
- Email service failure (forgot password): User sees success message (server logs error); prevents enumeration attack.
- Password doesn't meet strength requirements (reset): Inline validation errors matching registration requirements.

### Requirements and user stories mapping (UI → PRD)
- US-001/US-002 (Register/Login): Register/Login views with redirects and errors.
- US-005 (Analyze with URL scraping success): Analyze Product (URL mode) → Results with loading indicator; product name automatically extracted.
- US-006 (Analyze with scraping failure): Inline manual ingredient entry fallback → Results.
- US-007 (Analyze with manual entry): Analyze Product (Manual mode) → Results with loading indicator; product saved as manual entry.
- US-007a (No ingredient list): Results shows Not Recommended with explicit justification text.
- US-008 (View result): Results page with badge, justification, disclaimer.
- US-009 (Feedback): Feedback controls on Results with confirmation.
- US-010 (History): My Products list with name and last analyzed date.
- US-011 (Re-analyze): From history, Re-analyze pre-fills Analyze Product form; new version saved (only for URL-based products).

### Anticipated user pain points and mitigations
- Waiting for analysis: Prominent progress indicators; concise copy about expected duration; non-blocking UI where safe.
- Scraping uncertainty: Clear fallback path; explicit copy about manual input when scraping fails.
- Trust in recommendation: Prominent badge plus concise justification; AI disclaimer present.
- Recoverability: Preserve form state on errors; clear recovery CTAs; meaningful error messages.
- Navigation clarity: Persistent "Analyze" and "My Products"; contextual links between Results and History.
- Password reset confusion: Clear messaging at each step; generic success message prevents enumeration; expired token errors provide clear path to request new reset.
- Email delivery delays: Success message explicitly tells user to check spam folder; non-threatening copy if email doesn't arrive.
- Reset link security: Token never displayed to user; handled internally from URL parameters; auto-redirect after success with countdown.



