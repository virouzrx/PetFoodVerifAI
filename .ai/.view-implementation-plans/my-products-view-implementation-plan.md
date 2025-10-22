Dear Simon

# View Implementation Plan My Products

## 1. Overview
- Provide an authenticated history view for saved analyses with product name, last recommendation, and last analyzed timestamp.
- Support re-analysis entry point that forwards users to the analysis form with pre-filled context while preserving backend version tracking.
- Offer quick access to version history within an accessible drawer, relying on server pagination for scalability.
- Handle loading, empty, and error states gracefully while enforcing sign-out on 401 responses.

## 2. View Routing
- Path: `/products` (protected route requiring valid authentication token).
- Add navigation entry in the authenticated layout linking to `/products` and ensure redirects from post-analysis flows land here when appropriate.

## 3. Component Structure
- `MyProductsPage`
- `AppShell` (existing layout wrapper, assumed)
- `PageHeader`
- `ProductList`
- `ProductListItem`
- `RecommendationPill`
- `VersionHistoryTrigger`
- `ReanalyzeButton`
- `PaginationControls`
- `EmptyState`
- `VersionHistoryDrawer`

## 4. Component Details
### MyProductsPage
- Component description: Top-level view orchestrating data fetch, loading/error states, and layout. Wraps header, list, pagination, drawer.
- Main elements: `main` container, `PageHeader`, conditional `Spinner`/`EmptyState`, `ProductList`, `PaginationControls`, `VersionHistoryDrawer` rendered via portal.
- Handled interactions: Initial data fetch; pagination change; version drawer open/close; reanalyze navigation dispatch; global key handling for drawer escape.
- Handled validation: Ensure `page` and `pageSize` params remain within allowed bounds before request; verify authenticated session (401 triggers sign-out); confirm selected analysis exists before opening drawer or reanalyzing.
- Types: `PaginatedAnalysesResponse`, `ProductAnalysisSummary`, `VersionHistoryEntry`, `ReanalyzeNavigationPayload`.
- Props: None (rendered via route).

### ProductList
- Component description: Renders collection of products or delegates empty state when list is empty.
- Main elements: `section` with `ul` list; children `ProductListItem` entries; includes accessible heading for screen readers.
- Handled interactions: Keyboard navigation within list; passes selection callbacks down.
- Handled validation: Guard against rendering when `items` undefined; confirm each item contains mandatory keys (`analysisId`, `productName`, `recommendation`, `createdAt`).
- Types: `ProductAnalysisSummary[]`.
- Props: `items`, `onSelectVersionHistory(productId)`, `onReanalyze(analysisId)`, `isLoading` (optional to skeletonize).

### ProductListItem
- Component description: Displays single product entry with meta data, actions, and semantics for keyboard selection.
- Main elements: `li` with flex layout, product title, formatted date, `RecommendationPill`, inline actions (`VersionHistoryTrigger`, `ReanalyzeButton`).
- Handled interactions: Click/Enter on main area to highlight; click on triggers to open drawer or reanalyze; focus management for accessibility.
- Handled validation: Confirm actionable IDs exist; disable version trigger when `productId` unresolved; disable reanalyze when navigation pending.
- Types: `ProductAnalysisSummary` (extends with `productId?`), `ReanalyzeNavigationPayload`.
- Props: `item`, `onOpenVersionHistory(productId, productName)`, `onReanalyze(item)`, `isNavigating` flag.

### RecommendationPill
- Component description: Visual badge representing recommendation status with color semantics and iconography.
- Main elements: `span` styled via Tailwind classes; optional status icon.
- Handled interactions: None beyond display; ensure accessible `aria-label` summarizing status.
- Handled validation: Accept only known statuses (`Recommended`, `NotRecommended`, optional fallback `NeedsReview`).
- Types: `Recommendation` enum (from backend `Models.Enums`).
- Props: `recommendation`.

### VersionHistoryTrigger
- Component description: Button/link that opens drawer to show historical analyses for product.
- Main elements: `button` with icon label; includes `aria-expanded` and `aria-controls` tying to drawer ID.
- Handled interactions: `onClick` calls parent to open drawer; handles keyboard activation.
- Handled validation: Disabled state when `productId` missing; ensure product name provided for drawer title.
- Types: `UUID` string for productId.
- Props: `productId`, `productName`, `onOpen(productId, productName)`, `disabled`.

### VersionHistoryDrawer
- Component description: Slide-in panel showing paginated list of historical analyses for selected product.
- Main elements: `aside` with overlay, header (product name, close button), list of entries with timestamp and recommendation, optional pagination or infinite scroll, loader/error messaging.
- Handled interactions: `onClose`, ESC key, outside click, internal pagination or load-more, optional `ReanalyzeButton` reuse for specific version.
- Handled validation: Ensure `selectedProductId` valid UUID before issuing fetch; guard multiple simultaneous fetches; verify fetched data structure.
- Types: `PaginatedAnalysesResponse`, `VersionHistoryEntry` (alias `AnalysisSummaryDto`), optional `DrawerState`.
- Props: `isOpen`, `product`, `onClose`, `versions`, `isLoading`, `error`, `onFetchMore(page)`, `onReanalyzeFromVersion(analysisId)`.

### ReanalyzeButton
- Component description: Action button forwarding user to analysis form with prefilled context; can appear in list item and drawer entries.
- Main elements: `button` or `Link` element styled as CTA.
- Handled interactions: Click triggers `navigate('/analyze', { state: payload })`; shows spinner while pending; handles keyboard activation.
- Handled validation: Disable when payload incomplete; ensure navigation only once per click.
- Types: `ReanalyzeNavigationPayload` (includes `analysisId`, `productName`, optional `species`, `age`, `breed`, `additionalInfo`, `productUrl`).
- Props: `payload`, `onClick(payload)` (optional override), `isSubmitting`.

### PaginationControls
- Component description: Manages server-driven pagination with next/prev buttons and page number display.
- Main elements: `nav` with `button` elements for previous/next, optional page jump input, `aria-label` for screen readers.
- Handled interactions: Click to change page; optional direct input; keyboard accessible.
- Handled validation: Prevent going below page 1 or beyond `maxPage`; disable buttons appropriately.
- Types: `PaginationState` (page, pageSize, totalCount).
- Props: `page`, `pageSize`, `totalCount`, `onPageChange`, `onPageSizeChange` (optional), `isLoading`.

### EmptyState
- Component description: Rendered when no analyses exist; encourages user to analyze first product.
- Main elements: Illustration/icon, message text, CTA button linking to `/analyze`.
- Handled interactions: CTA click to navigate; accessible focus order ensures CTA reachable.
- Handled validation: Visible only when `items.length === 0` and not loading.
- Types: None additional.
- Props: `onAnalyzeNow` callback.

## 5. Types
- `AnalysisSummaryDto` (backend): `{ analysisId: string; productName: string; recommendation: Recommendation; createdAt: string; }`.
- `PaginatedAnalysesResponse`: `{ page: number; pageSize: number; totalCount: number; items: AnalysisSummaryDto[]; }`.
- `ProductAnalysisSummary` (frontend view model): `{ analysisId: string; productName: string; recommendation: Recommendation; createdAt: string; productId?: string; species?: Species; age?: number; breed?: string; productUrl?: string; }` populated via `/api/analyses` and enriched by optional detail fetch.
- `PaginatedAnalysesViewModel`: `{ page: number; pageSize: number; totalCount: number; items: ProductAnalysisSummary[]; isEmpty: boolean; hasMore: boolean; }`.
- `VersionHistoryEntry`: Alias of `ProductAnalysisSummary` limited to a specific product, sorted descending by `createdAt`.
- `ReanalyzeNavigationPayload`: `{ analysisId: string; productName: string; productUrl?: string; species?: Species; breed?: string; age?: number; additionalInfo?: string; }`.
- `PaginationState`: `{ page: number; pageSize: number; totalCount: number; maxPage: number; }`.
- `VersionHistoryDrawerState`: `{ isOpen: boolean; productId: string | null; productName: string; page: number; versions: VersionHistoryEntry[]; isLoading: boolean; error: string | null; }`.

## 6. State Management
- Use React Query (or equivalent data-fetch hook) `usePaginatedAnalyses({ page, pageSize })` to manage caching, loading, and error states for main list.
- Maintain local state for `page`, `pageSize`, `selectedProduct`, `isDrawerOpen`, `drawerPage`, `isNavigating`, and `drawerError` via `useState`.
- Implement `useVersionHistory(productId, drawerPage)` hook returning `data`, `isLoading`, `error`, `fetchNextPage` to encapsulate drawer fetching and caching per product.
- Use `useEffect` to trigger sign-out/redirection when fetch returns 401 (React Query `onError`).
- Ensure focus management states (`lastFocusedElement`) for restoring focus when drawer closes.

## 7. API Integration
- Fetch main list via GET `/api/analyses?page={page}&pageSize={pageSize}` including bearer token; expect `PaginatedAnalysesResponse` and map to `ProductAnalysisSummary`.
- For version history, call GET `/api/analyses?productId={productId}&page={drawerPage}&pageSize=5` on drawer open; reuse same response type, scoped to product.
- For reanalyze prefill, optionally fetch GET `/api/analyses/{analysisId}` to retrieve `AnalysisDetailDto` when payload lacks required fields; store result in navigation state.
- Handle optimistic navigation by storing payload using router state and allowing analysis form to fetch missing fields if not provided.
- Convert ISO `createdAt` to localized format before rendering (e.g., `format(new Date(createdAt), 'MMM d, yyyy')`).

## 8. User Interactions
- Page load: trigger `usePaginatedAnalyses`; show spinner until resolved.
- Change page via pagination controls: update `page` state, refetch list, maintain scroll position (scroll to top of list).
- Open version history: set `selectedProduct`, open drawer, load versions, trap focus in drawer, allow ESC/overlay close.
- Reanalyze button: set `isNavigating`, optionally fetch detail, call router navigate to `/analyze` with state/query, release loading when navigation completes.
- Empty state CTA: navigate to `/analyze`.
- Keyboard navigation: ensure list items are focusable, actions accessible via tab order, drawer respects focus trapping.

## 9. Conditions and Validation
- Validate `page >= 1` and `pageSize` within allowed set `{10, 20, 50}` before requesting; fallback to defaults.
- Ensure `productId` strings match UUID format prior to drawer fetch; invalid IDs disable trigger and log warning.
- Confirm `analysisId` exists before reanalyze; if missing, display inline error toast and prevent navigation.
- Verify authentication token available; if missing, redirect to login immediately.
- Format dates using user locale; if parsing fails, display `Unknown date` label.

## 10. Error Handling
- API 401: invoke global auth handler to clear session and push user to login page with flash message.
- Network/server errors: display inline error banner with retry button in main view; for drawer show message with retry option.
- Empty dataset: render `EmptyState` with CTA; ensure not treated as error.
- Version history fetch failure: keep drawer open, show non-blocking error component, allow retry.
- Navigation failure (e.g., detail fetch fails): show toast and keep user on current view.

## 11. Implementation Steps
1. Ensure route `/products` exists in router and gated behind auth; create page component scaffold with layout wrapper.
2. Implement type definitions and helper mappers converting API responses to `ProductAnalysisSummary`.
3. Build `usePaginatedAnalyses` hook leveraging React Query (or fetch) with error handling and 401 interception.
4. Compose `MyProductsPage` integrating hook data, rendering loading/error/empty states, and wiring pagination.
5. Implement `ProductList` and `ProductListItem` with accessible semantics, date formatting, recommendation badge, and actions.
6. Create `RecommendationPill` with Tailwind styles and accessible labels.
7. Wire `ReanalyzeButton` to navigation service, including optional detail fetch when required.
8. Build `VersionHistoryTrigger` and `VersionHistoryDrawer`, including `useVersionHistory` hook and focus management.
9. Integrate `PaginationControls` ensuring state updates and disabled button logic.
10. Add global error display components or reuse existing design system elements for inline alerts and toasts.
11. Write tests (unit or component) for mapping helpers, hooks (mock fetch), and accessibility checks for list/drawer interactions.

