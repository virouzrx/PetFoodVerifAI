# View Implementation Plan – Product Version History

## 1. Overview
Side drawer/modal that exposes a paginated version history for a selected product on `/products`. It lists past analyses with recommendation badges, dates, and links to open full results while keeping focus trapped and accessible.

## 2. View Routing
Invoked from `products` route (`/products`). Drawer open state reflects optional query param `?productId=<uuid>`; deep links auto-open the drawer when the param is present.

## 3. Component Structure
- `ProductsPage` (existing)
  - `ProductVersionHistoryDrawer`
    - `DialogOverlay` / `DialogContent` (from shared `SideDrawer` infra)
      - `DrawerHeader`
        - `Title`
        - `CloseButton`
      - `DrawerBody`
        - `VersionList`
          - `VersionListItem` × N
            - `RecommendationBadge`
            - `CreatedAtLabel`
            - `OpenResultButton`
        - `EmptyStateMessage`
        - `ErrorState`
        - `SkeletonList`
        - `PaginationControls`

## 4. Component Details
### ProductVersionHistoryDrawer
- Description: Shell around the drawer/modal; wires open state, aria roles, focus trap, and data fetching.
- Main elements: `SideDrawer` container with header, body, footer region for pagination.
- Handled interactions: open/close via close button, overlay click, ESC; pagination page change; sync with query param.
- Validation: only issues fetch when `productId` is UUID; reset page to 1 when `productId` changes.
- Types: `ProductVersionHistoryDrawerProps`, `UseVersionHistoryResult`, `PaginatedVersionHistory`.
- Props: `productId: string | null`, `productName?: string`, `isOpen: boolean`, `onClose(): void`.

### VersionList
- Description: Presentation list for analysis versions with loading, empty, error branches.
- Main elements: `<ul>` of `VersionListItem`, optional loader or empty placeholder.
- Handled interactions: none (delegates item actions); ensures keyboard navigation order.
- Validation: requires `items` array; ensures fallback when empty.
- Types: `VersionListProps`, `VersionHistoryItem`.
- Props: `items`, `isLoading`, `isError`, `isEmpty`, `onRetry?()`, `errorMessage?`.

### VersionListItem
- Description: Displays a single analysis entry (recommendation badge, timestamp, open result button).
- Main elements: `<li>` wrapper with badge, date text, CTA button.
- Handled interactions: `onOpenResult(analysisId)` click, keyboard activation.
- Validation: ensures `analysisId` defined; disables button while navigation pending.
- Types: `VersionHistoryItem`, `VersionListItemProps`.
- Props: `item`, `onOpenResult(id: string)`.

### PaginationControls
- Description: Footer control for pagination; reuses shared paginator component where possible.
- Main elements: `<nav>` with prev/next buttons, page indicators.
- Handled interactions: `onPageChange(newPage)`; keyboard accessible.
- Validation: disables prev on first page, next when `page * pageSize >= totalCount`.
- Types: `PaginationProps` (`page`, `pageSize`, `totalCount`).
- Props: `page`, `pageSize`, `totalCount`, `onPageChange`.

### EmptyStateMessage
- Description: Simple message shown when no analyses exist for product.
- Main elements: icon + text block.
- Handled interactions: optional `onReanalyze` CTA linking back to form.
- Validation: none beyond display.
- Types: `EmptyStateProps`.
- Props: optional `productName`, `onReanalyze?`.

### ErrorState
- Description: Displays fetch error with retry option.
- Main elements: alert box with description and button.
- Handled interactions: `onRetry` triggers React Query refetch.
- Validation: ensures message present.
- Types: `ErrorStateProps`.
- Props: `message`, `onRetry`.

### SkeletonList
- Description: Loading placeholder showing list skeletons matching item layout.
- Main elements: `<ul>` with animated blocks.
- Handled interactions: none.
- Validation: none.
- Types: `SkeletonListProps` (optional count).
- Props: `count` default 5.

### OpenResultButton
- Description: CTA to navigate to detailed result view (likely `/analyses/:id`).
- Main elements: `<button>` or `<Link>` styled per design.
- Handled interactions: click/Enter calls `navigate`.
- Validation: disabled when missing `analysisId`.
- Types: `OpenResultButtonProps`.
- Props: `analysisId`, `label?`, `variant?`, `onClick?` (defaults to navigation).

## 5. Types
- `Recommendation` (existing): enum/string union `'Recommended' | 'NotRecommended' | ...` aligned with backend.
- `PaginatedVersionHistory`: `{ page: number; pageSize: number; totalCount: number; items: VersionHistoryItem[]; }`.
- `VersionHistoryItem`: `{ analysisId: string; productName: string; recommendation: Recommendation; createdAt: string; }`.
- `UseVersionHistoryParams`: `{ productId: string; page: number; pageSize: number; enabled?: boolean; }`.
- `UseVersionHistoryResult`: `ReturnType` from hook with `data`, `isLoading`, `isError`, `error`, `refetch`.
- `ProductVersionHistoryDrawerProps`: `{ productId: string | null; productName?: string; isOpen: boolean; onClose: () => void; pageSize?: number; initialPage?: number; }`.
- `PaginationProps`, `VersionListProps`, `VersionListItemProps`, `ErrorStateProps`, `EmptyStateProps`, `OpenResultButtonProps` as described above.

## 6. State Management
- Drawer open state owned by `ProductsPage` and possibly derived from URL param (`useSearchParams`); closing removes `productId` param and restores focus to triggering element.
- Local `page` state stored in `useState` inside drawer; reset to 1 whenever `productId` changes.
- React Query hook `useProductVersionHistory` manages server state keyed by `['analyses', productId, page, pageSize]`, returns paginated data and handles caching, refetching on visibility change.
- Loading/empty/error derived state computed from query result.

## 7. API Integration
- Request: `GET /api/analyses?productId=${productId}&page=${page}&pageSize=${pageSize}` using `fetch` wrapper or Axios with auth headers automatically handled.
- Response typed as `PaginatedVersionHistory` (matching backend `PaginatedAnalysesResponse`). `createdAt` parsed to display using `Intl.DateTimeFormat` but kept as string in state.
- React Query options: `enabled: Boolean(productId)`, `keepPreviousData: true` for smooth pagination, error handling via `onError` to inspect status codes.
- On 401, call `authContext.signOut()` and redirect to login.
- On success, update pagination metadata and render list; on 404 treat as zero items.

## 8. User Interactions
- Open drawer via button from product list (sets `productId` param); focus moves to drawer.
- Close via close button, overlay click, ESC key; returns focus to trigger.
- Change page using pagination controls; triggers query refetch with new page.
- Click “Open result” to navigate to `/analyses/{analysisId}` (closes drawer or leaves open per UX decision, default close after navigation).
- Retry button on error to re-run query.
- Optional CTA in empty state to re-analyze (navigates to form with product details prefilled).

## 9. Conditions and Validation
- Fetch only when `productId` is present and valid UUID (validate via regex before enabling query; if invalid show error message).
- Maintain `page >= 1`; clamp to 1 if query param invalid.
- Disable pagination next when `page * pageSize >= totalCount`.
- Ensure `OpenResultButton` disabled if data missing or loading navigation.
- Announce loading state via `aria-busy` on list container for screen readers.

## 10. Error Handling
- 401 Unauthorized: display toast (“Session expired”), trigger sign-out, redirect to login.
- Network/500 errors: show `ErrorState` with retry.
- Empty response (`totalCount === 0`): show `EmptyStateMessage` with explanatory text.
- Invalid `productId`: surface inline error and auto-close drawer after notifying user.
- Graceful fallback if `recommendation` unknown: show neutral badge with text “Unknown”.

## 11. Implementation Steps
1. Define TypeScript interfaces (`VersionHistoryItem`, `PaginatedVersionHistory`, etc.) in shared types folder.
2. Implement `useProductVersionHistory` hook using React Query with proper keying, enabled flag, and error handling.
3. Extend routing so `/products` syncs drawer open state with `productId` query param (opening/closing updates URL).
4. Build `ProductVersionHistoryDrawer` component leveraging existing `SideDrawer`, wire focus trap, aria labels (`aria-labelledby`, `aria-modal`).
5. Create presentational subcomponents (`VersionList`, `VersionListItem`, `PaginationControls`, `EmptyStateMessage`, `ErrorState`, `SkeletonList`).
6. Integrate hook data into drawer, covering loading, empty, error, and success states; display formatted dates and recommendation badges.
7. Implement `OpenResultButton` navigation to detailed result page and ensure drawer closes/maintains focus handling.
8. Add tests (component-level/unit) for hook (mock fetch) and drawer behavior (open/close, pagination).
9. Wire styling using Tailwind classes, ensuring responsive layout and accessible color contrast.
10. Update `ProductsPage` to pass product metadata into drawer and verify interactions end-to-end.

