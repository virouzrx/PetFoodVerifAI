# View Implementation Plan Session Expired Banner

## 1. Overview
- Provide a persistent, non-blocking inline banner that informs authenticated users their session expired after a 401 response and guides them to re-authenticate.
- Integrate with shared API client logic so any protected endpoint (e.g., analyses APIs) can trigger the banner without duplicating handling logic across views.
- Maintain accessibility, clear messaging, and a safe navigation path to `/login` while preserving the user’s context for a seamless retry after login.

## 2. View Routing
- No dedicated route; banner appears inline on any protected page when a 401 response is intercepted.
- CTA redirects to `/login` with an optional `returnUrl` query parameter pointing to the current path.

## 3. Component Structure
- `SessionExpiredBoundary`
  - `SessionExpiredProvider` (context)
    - `SessionExpiredBanner` (conditionally rendered)
      - `ReloginCTA`
    - `{children}` (rest of the app content)

## 4. Component Details
### SessionExpiredBoundary
- Component description: Top-level wrapper placed around protected app shell; wires provider, interceptor hook, and banner rendering.
- Main elements: React fragment wrapping `SessionExpiredProvider`, renders banner above `children`.
- Handled interactions: Initializes unauthorized interceptor via effect; clears state on unmount.
- Handled validation: Ensures provider receives non-empty children; ignores activation on public routes (e.g., `/login`, `/register`).
- Types: `SessionExpiredBoundaryProps`.
- Props: `{ children: React.ReactNode }`.

### SessionExpiredProvider
- Component description: Context provider storing session-expiry state and actions.
- Main elements: `SessionExpiredContext.Provider` with memoized value.
- Handled interactions: `triggerExpiry`, `clearExpiry`, `setReturnPath`.
- Handled validation: Prevents re-trigger if already expired unless message changes; sanitizes `returnUrl` to same-origin paths.
- Types: `SessionExpiredContextValue`, `SessionExpiredState`.
- Props: `{ children: React.ReactNode }`.

### SessionExpiredBanner
- Component description: Visible inline Tailwind-styled banner containing message and CTA, anchored at top of content area.
- Main elements: `<section role="alert">`, message text, `ReloginCTA`, optional supporting info.
- Handled interactions: Focus management on first render; keyboard navigation; optional “Details” toggle for debugging (hidden behind `showDebug` prop for dev).
- Handled validation: Requires `message` string; ensures `isVisible` true before rendering; keeps within tab order while announced by screen readers.
- Types: `SessionExpiredBannerProps`.
- Props: `{ isVisible: boolean; message: string; onLogin: () => void; retryPath?: string; }`.

### ReloginCTA
- Component description: Primary button/link initiating re-authentication flow.
- Main elements: `<button>` styled as primary; optionally wraps `Link` component to preserve SPA routing.
- Handled interactions: `onClick` clears auth tokens, invokes navigation to `/login?returnUrl=...`.
- Handled validation: Disables while redirect in progress; ensures `onClick` provided.
- Types: `ReloginCTAProps`.
- Props: `{ onClick: () => void; label?: string; isLoading?: boolean; }`.

### useSessionExpiry (custom hook)
- Component description: Hook encapsulating response interceptor registration and state updates.
- Main elements: Registers Axios/fetch interceptor in `useEffect`; exposes `isExpired`, `message`, `setReturnPath`, `clearExpiry`.
- Handled interactions: Captures last protected request URL, triggers context actions on 401.
- Handled validation: Filters non-API or public endpoint failures; ignores when request explicitly opts-out (e.g., login route).
- Types: `UseSessionExpiryResult`.

## 5. Types
- `SessionExpiredBoundaryProps`: `{ children: React.ReactNode }`.
- `SessionExpiredState`: `{ isExpired: boolean; message: string; triggeredAt: number; returnPath?: string; sourceRequest?: string; }`.
- `SessionExpiredContextValue`: `{ state: SessionExpiredState; triggerExpiry: (payload?: Partial<SessionExpiredState>) => void; clearExpiry: () => void; setReturnPath: (path: string) => void; }`.
- `SessionExpiredBannerProps`: `{ isVisible: boolean; message: string; onLogin: () => void; retryPath?: string; }`.
- `ReloginCTAProps`: `{ onClick: () => void; label?: string; isLoading?: boolean; }`.
- `UseSessionExpiryResult`: `{ isExpired: boolean; message: string; returnPath?: string; clearExpiry: () => void; handleLoginRedirect: () => void; }`.
- Optional helper type `UnauthorizedInterceptorOptions`: `{ ignorePaths?: string[]; navigate?: (path: string) => void; }` to configure hook usage.

## 6. State Management
- Centralized via `SessionExpiredProvider` using `useReducer` or `useState` with context to ensure single source of truth across app.
- Hook `useSessionExpiry` consumes context and registers unauthorized interceptor once (guard via ref to avoid duplicate registration).
- `returnPath` updated from router (`useLocation`) when expiry triggered; cleared after successful login redirect to prevent stale navigation.
- Consider persisting minimal flag in `sessionStorage` to re-show banner on hard refresh until user logs in.

## 7. API Integration
- Extend shared API client (likely Axios) with response interceptor: on any 401 from `/api/*`, call `triggerExpiry({ message, sourceRequest: config.url })` and reject response.
- Request type: inherits from existing DTOs (e.g., `CreateAnalysisRequest`) but no modification required; the hook only inspects status codes.
- Response handling: if interceptor detects `response.status === 401`, do not auto-retry; instead surface banner and optionally dispatch logout action to clear tokens.
- On CTA click, clear persisted auth token/local storage, navigate to `/login?returnUrl=${encodeURIComponent(returnPath ?? currentPath)}`.

## 8. User Interactions
- Automatic: Any protected request returning 401 triggers banner visibility and scrolls/focuses it for accessibility.
- User click `Log In`: Clears expired credentials, navigates to login with preserved context, optionally sets `isRedirecting` to disable repeated clicks.
- Optional `Learn More` link (if required) could open docs on session expiration; keep hidden until product asks.
- If user manually navigates to `/login`, banner should hide (effect clears state on public routes).

## 9. Conditions and Validation
- Display only when `isExpired` true and user not already on `/login` or `/register`.
- `returnUrl` must be same-origin path; validate by checking it starts with `/` and not `//`.
- Ensure message is non-empty; default to "Your session has expired. Please log in again." if server provides no detail.
- Banner remains until `clearExpiry` invoked via successful login or developer override.
- Prevent duplicate banners by checking `state.isExpired` before re-triggering.

## 10. Error Handling
- Network errors without status: do not trigger banner; surface standard network toast.
- If redirect fails (e.g., router unavailable), fallback to `window.location.assign('/login')`.
- If clearing storage throws (e.g., private mode), wrap in try/catch and still navigate.
- Provide telemetry hook (optional) to log unexpected repeated 401s for debugging.
- Handle simultaneous 401 responses by queueing only the first message and ignoring subsequent until cleared.

## 11. Implementation Steps
1. Create `SessionExpiredContext.tsx` exporting context, provider, and hook stubs.
2. Implement `sessionExpiredReducer` or `useState` inside provider to store `SessionExpiredState` and expose context value.
3. Build `useSessionExpiry` hook to register API client interceptor; ensure cleanup removes interceptor on unmount.
4. Create `SessionExpiredBanner.tsx` with Tailwind styling, `role="alert"`, message slot, and CTA.
5. Implement `ReloginCTA.tsx` to call `handleLoginRedirect` and show loading state while navigating.
6. Compose `SessionExpiredBoundary.tsx`, combining provider, hook usage, and conditional banner render around protected app shell.
7. Update top-level authenticated layout (e.g., `App.tsx` or `ProtectedRoutes`) to wrap content in `SessionExpiredBoundary`.
8. Integrate router utilities: use `useLocation` to set `returnPath` when expiry triggers; ensure login page clears expiry on mount.
9. Write unit tests for provider and hook (e.g., ensure banner triggers on simulated 401, ensures single trigger, validates sanitized return path).
10. Add storybook/demo entry for `SessionExpiredBanner` to validate visual design and accessibility.
11. QA manually: simulate 401 via expired token, verify banner persistence, CTA redirects, return path honored post-login.

