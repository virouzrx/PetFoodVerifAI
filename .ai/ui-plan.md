# UI Architecture for Pet Food Analyzer

## 1. UI Structure Overview

The application is a secure, accessible SPA with a pre-auth landing experience, authenticated analysis flow, results view with feedback capture, and a personal history with contextual versioning. Desktop and tablet are primary targets; smaller breakpoints adapt via utility classes. Authentication gates protect all data routes.

- **Primary flows**: Landing → Register/Login → Analyze Product → Results (+Feedback) → My Products → Version History → Re-analyze.
- **State/data**: React Query (or RTK Query) for server sync; local component state for form drafts; optimistic feedback submission; global auth/session state with HTTP-only cookie-based auth, forced logout on 401.
- **Accessibility**: WCAG 2.1 AA, semantic regions, form labeling, ARIA for dynamic status (scraping, analysis), keyboard-navigation-first drawers/modals.
- **Security**: HTTP-only cookies (preferred) for tokens; CSRF protection when using cookies; least-privileged API calls; 401-driven sign-out; input validation mirrored client-side; no sensitive data persisted in client storage beyond ephemeral form drafts.
- **Error handling**: Inline field validation (400), session expiry handling (401) with redirect and message, service unavailability (503) surfaced as retryable alerts, offline detection. Clear, actionable messages mapped from API codes.

- **Key API endpoints** (compatibility summary):
  - POST `/api/auth/register`, POST `/api/auth/login`
  - POST `/api/analyses`
  - GET `/api/analyses` (paginated, optional `productId`)
  - GET `/api/analyses/{id}`
  - POST `/api/analyses/{analysisId}/feedback`

- **Requirements coverage** (high level):
  - FR-01 Auth: Register/Login views with gated routes; no guest access.
  - FR-02 Form: Analyze Product view with vertical form.
  - FR-03/FR-04 Scraping + fallback: Inline manual ingredient textarea revealed on failure.
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
- **Key information**: Email, password; link to Register.
- **Key view components**: `AuthForm`, `GlobalAlert` (invalid credentials), `SubmitButton` with progress, `AuthSwitchLink`.
- **UX/Accessibility/Security**:
  - Handle 401 with non-disclosing error; prevent timing leaks in UI.
  - On success, set HTTP-only cookie (server), refresh auth state, route to `/analyze`.

4) **Analyze Product**
- **Path**: `/analyze` (default authenticated landing)
- **Main purpose**: Collect product and pet details; orchestrate scraping fallback and submit for analysis.
- **Key information**: Product Name, Product URL, Species (Cat/Dog), Breed, Age, Additional Info, Ingredients (manual fallback); notices about scraping and privacy; submission status.
- **Key view components**: 
  - `AnalyzeForm` (vertical): `ProductNameInput`, `ProductUrlInput`, `SpeciesRadioGroup`, `BreedTextInput`, `AgeNumberInput`, `AdditionalInfoTextarea`.
  - `ScrapeStatus` with `aria-live` (attempts scrape if ingredients missing), `ManualIngredientsTextarea` displayed if scraping fails or user opts in.
  - `SubmitAnalysisButton` with loading state; `FormValidationSummary`.
  - `InlineHelp` for acceptable URLs and data usage.
- **UX/Accessibility/Security**:
  - Client-side validation mirrors API; prevent duplicate submissions; persist draft in memory.
  - Loading indicators for scraping and analysis; progress is announced to screen readers.
  - On 503 from scraper/LLM, propose manual ingredients retry or later retry; preserve inputs.

5) **Results**
- **Path**: `/results/:analysisId`
- **Main purpose**: Display recommendation badge, concise justification, AI disclaimer; allow feedback.
- **Key information**: Product name/url; species/breed/age; recommendation (Recommended/Not Recommended); justification; timestamp; analysis ID; link to history and re-analyze.
- **Key view components**: `AnalysisBadge`, `JustificationCard`, `AIDisclaimer`, `FeedbackButtons` (thumbs up/down), `ResultMeta`, `GoToHistoryLink`, `ReanalyzeButton`.
- **UX/Accessibility/Security**:
  - Badge includes text + icon; color is not the only indicator.
  - Feedback shows immediate confirmation, handles 409 (already submitted) gracefully.
  - Handle 404 for missing analysis; 401 triggers logout flow.

6) **My Products**
- **Path**: `/products`
- **Main purpose**: Show user’s analyzed products with last analysis info; afford re-analysis and version history access.
- **Key information**: Product name, last recommendation, last analyzed date; pagination.
- **Key view components**: `ProductList`, `ProductListItem` (name, date, recommendation pill), `VersionHistoryTrigger` (opens drawer), `ReanalyzeButton`, `PaginationControls`, `EmptyState`.
- **UX/Accessibility/Security**:
  - Keyboard-accessible list; large tap targets; clear empty state with CTA to Analyze.
  - Server-driven pagination; optimistic navigation; 401 sign-out.

7) **Product Version History (Drawer/Modal)**
- **Path**: N/A (invoked from `/products`, optionally reflected via `?productId=`)
- **Main purpose**: Contextual version history for a selected product.
- **Key information**: List of analyses for product (createdAt, recommendation), with links to specific results.
- **Key view components**: `SideDrawer`/`Modal`, `VersionList`, `VersionListItem`, `OpenResultButton`, `CloseButton`.
- **UX/Accessibility/Security**:
  - Focus trap; ESC to close; `aria-modal` with labelled title.
  - Paginated fetch with React Query; 404 handled as empty state; 401 sign-out.

8) **Not Found**
- **Path**: `/404` (and catch-all)
- **Main purpose**: Graceful fallback for unknown routes.
- **Key information**: Error copy; links to `/analyze` and `/products`.
- **Key view components**: `NotFoundMessage`, `PrimaryLinks`.
- **UX/Accessibility/Security**:
  - Clear recovery actions; no sensitive data exposure.

9) **Session Expired / Unauthorized**
- **Path**: Inline banner/dialog triggered on 401
- **Main purpose**: Inform about session expiry and guide to re-authenticate.
- **Key information**: Brief message; action to Login.
- **Key view components**: `SessionExpiredBanner`, `ReloginCTA`.
- **UX/Accessibility/Security**:
  - Non-blocking banner that persists until action; safe redirect to `/login`.

10) **Authenticated Shell (Layout)**
- **Path**: Wrapper for `/analyze`, `/products`, `/results/*`
- **Main purpose**: Provide consistent navigation and global UI affordances.
- **Key information**: App name; nav links; user menu.
- **Key view components**: `AppHeader` (logo, `NavLinks`: Analyze, My Products), `AccountMenu` (Logout), `GlobalAlertArea`, `RouteOutlet`, `LoadingBar`.
- **UX/Accessibility/Security**:
  - Landmarks (`header`, `main`, `nav`); skip-to-content link; high contrast and focus styles.
  - Logout clears client auth state; redirect to `/login`.

## 3. User Journey Map

- **Primary use case**
  1. User lands on `/` → learns about app → proceeds to `/login` or `/register`.
  2. Auth success → routed to `/analyze` (default authenticated landing).
  3. User fills form (name, URL, species, breed, age, optional info). On submit, if `ingredientsText` missing, scraping attempts in background.
  4. If scraping fails, `ManualIngredientsTextarea` appears inline with a message; user pastes ingredients and resubmits.
  5. Analysis request is sent → show “Thinking…” with progress (aria-live). On success, route to `/results/:analysisId`.
  6. Results view shows badge, justification, AI disclaimer. User optionally gives feedback (thumb up/down) → instant confirmation.
  7. User navigates to `My Products` to see history; opens Version History drawer for a product → can open prior results, or click Re-analyze to go back to `/analyze` with pre-filled fields.

- **Re-analyze flow**
  - From `/products`, click Re-analyze → `/analyze` with product fields pre-filled (URL, name). Submit → new result saved; Version History updates.

- **Session expiry**
  - Any request returning 401 triggers `SessionExpiredBanner` and redirect to `/login` after user acknowledges.

## 4. Layout and Navigation Structure

- **Routing**
  - Public: `/`, `/login`, `/register`, `/404`.
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
- **AnalyzeForm**: Structured form with validation and inline scraping fallback. Emits a normalized payload for POST `/api/analyses`.
- **ScrapeStatus**: `aria-live` region reflecting scraping attempts and failures; toggles manual entry.
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
- Analyze Product: POST `/api/analyses`; client triggers scraping or includes `ingredientsText` fallback; handle 400/503.
- Results: GET `/api/analyses/{id}`; POST feedback `/api/analyses/{analysisId}/feedback` (201/409).
- My Products: GET `/api/analyses` (paginated); filters by `productId` when opened in Version History drawer.
- Version History Drawer: GET `/api/analyses?productId=...` (paginated).

### Edge cases and error states
- Scraping unavailable or fails: Show manual ingredients path inline; preserve user input.
- No ingredient list available: Results explicitly mark Not Recommended with reason (per PRD).
- Service unavailable (503): Retry affordance and guidance; non-destructive UI state.
- Unauthorized (401): Session expired banner; safe redirect to `/login` with return path.
- Validation errors (400): Inline, field-specific messages; summary at top for screen readers.
- Duplicate feedback (409): Surface as non-blocking info; keep visible confirmation.
- Offline: Global offline indicator and deferred submission where feasible (no data loss locally).

### Requirements and user stories mapping (UI → PRD)
- US-001/US-002 (Register/Login): Register/Login views with redirects and errors.
- US-003 (Analyze with scraping success): Analyze Product → Results with loading indicator.
- US-004 (Analyze with scraping failure): Inline manual ingredient entry → Results.
- US-005 (No ingredient list): Results shows Not Recommended with explicit justification text.
- US-006 (View result): Results page with badge, justification, disclaimer.
- US-007 (Feedback): Feedback controls on Results with confirmation.
- US-008 (History): My Products list with name and last analyzed date.
- US-009 (Re-analyze): From history, Re-analyze pre-fills Analyze Product form; new version saved.

### Anticipated user pain points and mitigations
- Waiting for analysis: Prominent progress indicators; concise copy about expected duration; non-blocking UI where safe.
- Scraping uncertainty: Clear fallback path; explicit copy about manual input when scraping fails.
- Trust in recommendation: Prominent badge plus concise justification; AI disclaimer present.
- Recoverability: Preserve form state on errors; clear recovery CTAs; meaningful error messages.
- Navigation clarity: Persistent "Analyze" and "My Products"; contextual links between Results and History.



