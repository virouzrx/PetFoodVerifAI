# View Implementation Plan Not Found

## 1. Overview
- Provide a graceful, branded fallback when users hit an unknown route, keeping them oriented and guiding them back to the primary flows described in the PRD.
- Ensure the page stays free of sensitive data, works for authenticated and unauthenticated visitors, and keeps accessibility top-of-mind with clear copy and focus management.
- Reinforce recovery paths by surfacing direct actions to trigger a new analysis or review the analysis history.

## 2. View Routing
- Register `/404` with React Router (or equivalent) and mount `NotFoundRoute` as its element using the shared protected layout when available.
- Add a catch-all route `*` that redirects to `/404` so any unmatched URL resolves to this view.
- Allow other routes or error boundaries (e.g., a failed `/api/analyses/{id}` fetch that returns 404) to navigate programmatically to `/404` while preserving the originating location in `location.state`.

## 3. Component Structure
- NotFoundRoute
  - AppLayout (existing shared shell; ensure header/footer remain consistent)
    - NotFoundMessage
    - PrimaryLinks
    - BackLink (optional secondary action rendered within the view shell)

## 4. Component Details
### NotFoundRoute
- Component description: Top-level route component that composes the layout, builds a view-model, and passes data to child presentation components.
- Main elements: `<main role="main">`, `<section>` wrapper, `<div>` for layout grid, optional `<Helmet>`/SEO component.
- Handled interactions: Handles the back navigation click via `navigate(-1)` with fallback, optional analytics dispatch in `useEffect()` when the page mounts.
- Handled validation: Ensures computed links list is non-empty; sanitises `fromPath` strings from `location.state`; verifies any injected error object is not a 401 before rendering (otherwise delegate to auth guard).
- Types: `NotFoundViewModel`, `NotFoundLink`, optional `RouteErrorShape`.
- Props: Route element (no props) but may accept injected `error?: unknown` when wired through an error boundary.

### NotFoundMessage
- Component description: Pure presentational block rendering the headline, descriptive copy, and optional contextual detail about the missing resource.
- Main elements: `<h1 id="not-found-title">`, `<p>` summary text, optional `<p>` supporting detail.
- Handled interactions: None (static)
- Handled validation: Falls back to default copy when supplied strings are empty or whitespace; ensures heading text remains under 120 characters for readability.
- Types: Receives `Pick<NotFoundViewModel, 'title' | 'description' | 'detail'>`.
- Props: `{ title: string; description: string; detail?: string }`.

### PrimaryLinks
- Component description: Renders the primary recovery actions as accessible navigation buttons styled with Tailwind utilities, using the router `Link` component.
- Main elements: `<nav aria-label="Primary actions">`, `<ul>` (or flex container) with `<li>` and `<Link>`/`<button>` elements.
- Handled interactions: On-click navigation via router; optional `onLinkClick` callback for analytics or logging.
- Handled validation: Filters out links flagged as `requiresAuth` when an unauthenticated user context is detected; prevents rendering duplicate `to` targets; ensures `to` strings start with `/`.
- Types: `NotFoundLink[]` for props, optional handler signature `NotFoundLinkClickHandler`.
- Props: `{ links: NotFoundLink[]; onLinkClick?: (link: NotFoundLink) => void }`.

### BackLink
- Component description: Secondary action offering a safe “Go back” button that tries history navigation then falls back to a defined safe route.
- Main elements: `<button type="button">` or `<Link>` styled as secondary text action.
- Handled interactions: Calls `navigate(-1)`; on failure uses `navigate('/analyze')` as fallback.
- Handled validation: Only renders when there is a valid `fromPath` and it differs from `/404` to avoid loops.
- Types: `{ fromPath?: string | null; fallbackTo?: string }`.
- Props: `{ fromPath?: string | null; fallbackTo?: string }`.

## 5. Types
- `type NotFoundLink = { id: 'analyze' | 'products'; label: string; to: string; icon?: React.ReactNode; variant: 'primary' | 'secondary'; requiresAuth?: boolean }`.
- `type NotFoundViewModel = { title: string; description: string; detail?: string; links: NotFoundLink[]; backLabel: string; fromPath?: string | null }`.
- `type RouteErrorShape = { status?: number; message?: string; data?: unknown }` for harmonising router error payloads.
- Reuse existing global `AuthContext` type (if present) to check authentication when gating links.

## 6. State Management
- Derive view model values with a small hook `useNotFoundViewModel` that consumes `useLocation`, optional `useRouteError`, and `useAuth` to compute copy, `links`, and `fromPath` once.
- Maintain a local `const [hasNavigated, setHasNavigated] = useState(false)` within `BackLink` to prevent double taps triggering multiple navigations.
- Use `useEffect` in `NotFoundRoute` to set document title and optionally log the missing path for telemetry.
- No global state mutations; rely on existing contexts (layout, auth) solely for read access.

## 7. API Integration
- No direct fetches are initiated by this view.
- Document the contract for other views: when `/api/analyses/{id}` responds with 404, the caller should `navigate('/404', { state: { from: location.pathname } })` so the Not Found view can show the previous path context.
- Ensure any shared API client translates HTTP 404 into a navigation action instead of surfacing an unhandled toast when the missing resource is the root cause.

## 8. User Interactions
- Clicking “Analyze a Product” navigates to `/analyze`, letting the user start the primary flow (US-003).
- Clicking “View My Products” navigates to `/products`, satisfying the history review use case (US-008); if the auth guard intercepts, it should route to login per existing flows.
- Clicking “Go Back” attempts to return to the previous page; if the history entry is unavailable, the handler falls back to `/analyze` to keep the user oriented.
- Initial focus moves to the `<h1>` when the page mounts to support screen readers and keyboard users.

## 9. Conditions and Validation
- Validate that computed links always include both `/analyze` and `/products`; log a console warning in development if either is missing.
- Sanity-check `fromPath` to guard against absolute URLs or cross-origin values; only accept strings that start with `/` and are not `/404`.
- Ensure the layout enforces the PRD’s requirement of logged-in usage: if the auth context reports `isAuthenticated === false`, render the same Not Found content but rely on route guards to handle downstream redirects.
- Confirm there is a visible recovery path and descriptive copy per accessibility guidance; add unit tests to assert heading text and links exist.

## 10. Error Handling
- Distinguish between HTTP 401 vs 404 in the error boundary: route to login for 401, render Not Found for 404, and fall back to a generic error page for other statuses.
- When history navigation fails (e.g., first page load), catch the thrown router error and navigate to `/analyze`.
- Display a generic detail message when the originating path is unavailable (“We couldn’t find the page you were looking for.”) and include the missing path when it is safe to show.
- Optionally surface a toast or inline note when the view was reached due to a deleted analysis (detected from `location.state.reason === 'analysis-missing'`).

## 11. Implementation Steps
1. Update the router configuration to add the `/404` route and catch-all redirect, ensuring authentication guards still wrap the layout if required.
2. Scaffold `NotFoundRoute.tsx` with layout composition, focus management, and the view-model hook.
3. Implement `useNotFoundViewModel.ts` to construct the `NotFoundViewModel` using `useLocation`, `useAuth`, and optional `useRouteError` data.
4. Build `NotFoundMessage.tsx` as a stateless component with Tailwind classes and accessibility attributes; add unit test for heading rendering.
5. Build `PrimaryLinks.tsx` to render CTA buttons with router `Link`, gating entries via the auth context and emitting optional analytics callbacks.
6. Build `BackLink.tsx` with robust navigation logic and fallback route handling; ensure it is focusable and keyboard accessible.
7. Compose and style the view inside `NotFoundRoute` using Tailwind to match existing typography, ensuring responsive behaviour and adequate spacing.
8. Wire up error handling in views that fetch `/api/analyses/{id}` so that a 404 triggers navigation to `/404` with the origin route stored in `location.state`.
9. Add Jest/React Testing Library tests validating that the Not Found view renders the message, links, and back action, and that the links navigate to the expected paths.
10. Manually test navigation scenarios (direct hit to `/404`, broken analysis link, logged-out state) to confirm focus, accessibility, and recovery flows behave as intended.

