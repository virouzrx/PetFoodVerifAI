# View Implementation Plan Authenticated Shell

## 1. Overview
- Establish a reusable authenticated layout that wraps `/analyze`, `/products`, and `/results/*` routes.
- Surface global navigation, account actions, alerts, and loading state to align with requirements from the PRD and user stories.
- Enforce authenticated access by integrating with shared auth context and redirecting unauthenticated users to `/login`.

## 2. View Routing
- Configure a parent route (e.g., `path="/"` with `element={<AuthenticatedShell />}`) that renders this layout and nests all authenticated child routes (`/analyze`, `/products`, `/results/:id`).
- Guard the route via auth context; if no valid token/user, invoke logout routine and navigate to `/login`.

## 3. Component Structure
- `AuthenticatedShell`
  - `SkipToContentLink`
  - `AppHeader`
    - `AppLogo`
    - `NavLinks`
    - `AccountMenu`
  - `GlobalAlertArea`
  - `LoadingBar`
  - `MainContent` (`<main>` hosting React Router `<Outlet />`)

## 4. Component Details
### AuthenticatedShell
- Component description: Layout wrapper managing global UI scaffolding, auth guard, and shared state providers.
- Main elements: container `<div>`, skip link anchor, `<header>` with header components, `<main>` with `Outlet`, optional `<footer>` when needed.
- Handled interactions: initialize auth guard on mount, observe location changes for focus management, respond to global state updates (alerts/loading), handle keyboard focus for skip link.
- Handled validation: confirm auth context holds `AuthUser` with token; ensure alerts conform to allowed severities; verify loading state toggles have matching start/stop.
- Types: `AuthUser`, `AlertMessage`, `GlobalUiState`, `AuthenticatedShellProps`.
- Props: none (consumes context providers directly).

### SkipToContentLink
- Component description: Accessibility utility enabling keyboard users to jump to main content.
- Main elements: visually-hidden/visible-on-focus `<a href="#main-content">`.
- Handled interactions: focus/blur styling only.
- Handled validation: ensure target `id` (`main-content`) exists.
- Types: none beyond intrinsic props.
- Props: `targetId: string` (defaults to `"main-content"`).

### AppHeader
- Component description: Renders app branding, navigation, and account controls within a semantic `<header>`.
- Main elements: `<header>`, flex container, logo, nav list, account menu trigger.
- Handled interactions: none directly; delegates nav and account actions to children.
- Handled validation: ensures required props provided (`navItems`, `userEmail`).
- Types: `NavLinkItem[]`, `AccountMenuProps`.
- Props: `{ navItems: NavLinkItem[]; userEmail: string; onLogout: () => void; currentPath: string; }`.

### NavLinks
- Component description: Highlighted navigation list for `Analyze` and `My Products` routes.
- Main elements: `<nav>` wrapping `<ul>`, `<li>`, `<NavLink>`.
- Handled interactions: click/keyboard activation to navigate via React Router; detect active route for styling.
- Handled validation: enforce nav items contain `path` and `label`; ensure only authenticated paths rendered.
- Types: `NavLinkItem`.
- Props: `{ items: NavLinkItem[]; currentPath: string; onNavigate?: (path: string) => void; }`.

### AccountMenu
- Component description: User menu providing logout action and optional profile info.
- Main elements: button trigger, dropdown (`<menu>` or `<div>`), list of actions.
- Handled interactions: toggle menu visibility, handle click outside/escape key, trigger logout.
- Handled validation: confirm `AuthUser` present before rendering; handle disabled state if logout busy.
- Types: `AccountMenuProps` (`extends` `AuthUser` subset), `LogoutHandler`.
- Props: `{ email: string; onLogout: () => void; isProcessing: boolean; }`.

### GlobalAlertArea
- Component description: Displays dismissible global alerts originating from app-level UI state.
- Main elements: `<section role="status" aria-live="polite">`, list of alert banners.
- Handled interactions: dismiss alert, auto-dismiss on timeout.
- Handled validation: enforce alert `type` within allowed set; ensure message non-empty; handle duplicates by `id`.
- Types: `AlertMessage`.
- Props: `{ alerts: AlertMessage[]; onDismiss: (id: string) => void; }`.

### LoadingBar
- Component description: Top-level progress indicator signaling active background operations.
- Main elements: `<div role="progressbar">` using CSS animation (Tailwind) for indeterminate state.
- Handled interactions: none; responds to `isActive` flag.
- Handled validation: ensures boolean `isActive` provided; optionally supports label for accessibility.
- Types: `LoadingState` (`isGlobalLoading`, `label?`).
- Props: `{ isActive: boolean; label?: string; }`.

### MainContent (Outlet Wrapper)
- Component description: Semantic `<main>` containing routed page content.
- Main elements: `<main id="main-content" tabIndex={-1}>`, `<Outlet />` from React Router, optional `<Suspense>` for lazy routes.
- Handled interactions: manage focus when route changes; host nested routes.
- Handled validation: ensure `id` matches skip link target; enforce focus only when triggered.
- Types: none.
- Props: none.

## 5. Types
- `AuthUser`: `{ id: string; email: string; token: string; expiresAt?: string; }` sourced from auth context hydrated via `AuthResponseDto`.
- `NavLinkItem`: `{ id: string; label: string; path: string; exact?: boolean; icon?: ReactNode; matchPattern?: RegExp | string; }`.
- `AlertSeverity`: union `'info' | 'success' | 'warning' | 'error'`.
- `AlertMessage`: `{ id: string; severity: AlertSeverity; title?: string; message: string; autoDismiss?: boolean; dismissAfter?: number; }`.
- `LoadingState`: `{ isGlobalLoading: boolean; label?: string; }` maintained in UI context.
- `GlobalUiState`: `{ alerts: AlertMessage[]; loading: LoadingState; }`.
- `AccountMenuProps`: `{ email: string; onLogout: () => void; isProcessing: boolean; }`.
- `AuthenticatedShellProps`: `{ children?: ReactNode; }` (though layout consumes `Outlet`).

## 6. State Management
- Consume `useAuthContext()` to access `AuthUser`, `logout`, and `isAuthenticating`.
- Consume `useUiState()` (custom hook) providing `{ alerts, addAlert, removeAlert, loading, setLoading }`.
- Maintain local state for `AccountMenu` open/close using `useState<boolean>`.
- Use `useEffect` with `useLocation()` to close menus on navigation and manage focus on `<main>` when skip link used.
- No new context providers needed if existing ones are available; otherwise create `UiContext` to supply alerts/loading to shell and descendants.

## 7. API Integration
- Auth: rely on `AuthResponseDto` (`{ userId: string; token: string; }`) stored on login; shell uses token presence for guard.
- Logout: call `logout()` from auth service to remove token from storage (no backend call required per API plan).
- Global unauthorized handling: intercept `401` responses via HTTP client; upon detection, push error alert (`"Session expired"`) and trigger `logout()`.
- No direct fetch from this layout, but ensures nested routes include `Authorization: Bearer <token>` header via shared API client.

## 8. User Interactions
- `SkipToContentLink` focus -> `main` receives focus, allowing keyboard users to bypass header.
- Clicking logo or `Analyze` nav -> navigate to `/analyze`, close account menu, highlight active link.
- Clicking `My Products` -> route to `/products`, update active state.
- Opening account menu -> toggles dropdown, focus cycles within, closes on escape/outside click.
- Selecting `Logout` -> show loading state, invoke `logout()`, clear contexts, push info alert, redirect to `/login`.
- Dismissing alert -> call `removeAlert(id)` to update UI context.

## 9. Conditions and Validation
- On mount, verify `AuthUser.token` is present; if absent, redirect to `/login`.
- Ensure `navItems` list includes only routes accessible per user role (current scope: all authenticated users).
- Validate `AlertMessage` instances before rendering (non-empty `message`, known `severity`).
- Confirm `LoadingState.isGlobalLoading` toggles off when all tracked promises settle (tie into centralized request counter or signal).
- Maintain accessibility attributes: `role="navigation"`, `aria-current="page"` for active nav links, `aria-live` for alerts, `aria-expanded` for menu button.

## 10. Error Handling
- Unauthorized (401): Trigger logout, show error alert, redirect to `/login`.
- Network errors surfaced via global alert area; provide retry guidance when appropriate.
- Failure to read auth state (e.g., corrupted storage): catch in auth context, clear state, show alert.
- Menu interaction errors (focus traps) fallback: ensure ESC closes, clicking outside closes.
- Loading indicator stuck: implement timeout failsafe that resets `LoadingState` if no active requests.

## 11. Implementation Steps
1. Create/extend `UiContext` to manage global alerts and loading state if not existing.
2. Implement `AuthenticatedShell` component with semantic layout, skip link, header, main, alert area, loading bar, and `Outlet`.
3. Integrate `useAuthContext()` guard within shell; redirect unauthenticated users to `/login` and expose logout handler.
4. Build `SkipToContentLink` component with Tailwind styles for focus visibility.
5. Implement `AppHeader` and `NavLinks` components, handling active route highlighting via `useLocation()`.
6. Implement `AccountMenu` with accessible dropdown behavior and logout wiring.
7. Implement `GlobalAlertArea` to render alerts from context with dismiss buttons and ARIA roles.
8. Implement `LoadingBar` responding to global loading state; ensure screen reader label.
9. Register layout within router configuration and nest authenticated routes under it.
10. Wire global HTTP client to toggle `loading` state and push alerts on errors for visibility within the shell.
11. Add unit/integration tests (React Testing Library) to verify navigation highlight, logout flow, skip link focus, and alert rendering.
