# View Implementation Plan Login

## 1. Overview
- The `/login` view authenticates existing users so they can access personalized analysis history and functionality.
- Presents a secure form collecting email and password, integrates with the backend login endpoint, and coordinates auth state refresh plus redirect to `/analyze` on success.
- Ensures UX/security requirements: neutral error messaging, consistent timing on failures, accessible form elements, and clear route to registration.

## 2. View Routing
- Register the page component under the React router path `/login`.
- Guard already-authenticated users by redirecting them to `/analyze` (using existing auth context/route guard) to avoid redundant login attempts.

## 3. Component Structure
- `LoginView`
  - `GlobalAlert` (conditional)
  - `AuthForm`
    - Email input + label
    - Password input + label
    - `SubmitButton`
    - `AuthSwitchLink`

## 4. Component Details
### LoginView
- Component description: Page-level container orchestrating login workflow, manages API call, state, and routing side effects.
- Main elements: layout wrapper (`main`), heading, optional copy text, `GlobalAlert`, `AuthForm`.
- Handled interactions: capture `onSubmit` from `AuthForm`, invoke `useLogin` hook, handle navigation, reset errors on field edits (via props).
- Handled validation: delegates to `AuthForm` for field validation; enforces API preconditions (non-empty password, RFC5322 email) before calling backend; ensures consistent failure delay (e.g., enforce minimum spinner duration).
- Types: `LoginFormValues`, `LoginErrorState`, `LoginResponseDto`, `AuthDispatch`/`AuthContext` types.
- Props: none (page component obtains deps via hooks/context).

### AuthForm
- Component description: Controlled form rendering email/password inputs, submit button, and register link.
- Main elements: `<form>`, `<label>` and `<input type="email">`, `<input type="password">`, validation hint text, `SubmitButton`, `AuthSwitchLink` container.
- Handled interactions: `onChange` for inputs (calls parent callbacks or internal state updater), `onSubmit` (calls provided handler with `LoginFormValues`), optionally `onBlur` for validation.
- Handled validation: real-time/submit-level checks for required fields and email format; optionally checks password length ≥ 8 to match registration expectation while allowing server override.
- Types: `LoginFormValues`, `LoginFormErrors`, `AuthFormProps` (includes `onSubmit`, `isSubmitting`, `serverErrors`, `onFieldChange` callback).
- Props: `{ initialValues?, onSubmit(values), isSubmitting, fieldErrors?, onFieldChange?, disableInputs? }`.

### GlobalAlert
- Component description: Reusable alert banner for high-level messages (error on invalid credentials or network issues).
- Main elements: `<div role="alert">` with icon, message, optional dismiss button.
- Handled interactions: optional dismiss button -> clears error state via callback.
- Handled validation: displays neutral error text (“We couldn’t sign you in. Check your credentials and try again.”) regardless of backend detail; no field-level validation.
- Types: `AlertProps` (`variant`, `message`, `onDismiss?`).
- Props: `{ variant: 'error' | 'success', message: string, onDismiss? }`.

### SubmitButton
- Component description: Button showing progress and preventing duplicate submissions.
- Main elements: `<button type="submit">` with spinner element when `isLoading` true.
- Handled interactions: click submits parent form; while loading, disabled and announces via `aria-live`.
- Handled validation: disables when form invalid or `isLoading` true; ensures accessible name remains.
- Types: `SubmitButtonProps` (`isLoading`, `children`, `disabled?`).
- Props: `{ isLoading: boolean, disabled?: boolean, children: ReactNode }`.

### AuthSwitchLink
- Component description: Link guiding users to registration view.
- Main elements: `<p>` copy with `<Link to="/register">`.
- Handled interactions: click navigates to signup route.
- Handled validation: not applicable.
- Types: `AuthSwitchLinkProps` (`prompt`, `label`, `to`).
- Props: `{ prompt: string, label: string, to: string }`.

## 5. Types
- `LoginFormValues`: `{ email: string; password: string; }`.
- `LoginFormErrors`: `{ email?: string; password?: string; form?: string; }` for client-side validation feedback.
- `LoginResponseDto`: mirrors `AuthResponseDto` -> `{ userId: string; token: string; }`.
- `LoginErrorResponse`: `{ errors?: string[]; message?: string; status: number; }` to normalize API failure responses.
- `UseLoginResult`: `{ login(values): Promise<void>; isLoading: boolean; error: LoginErrorResponse | null; clearError(): void; }` for custom hook consumption.
- `AuthContextValue` (if not already defined): includes `refreshSession(): Promise<void>`, `setAuthenticated(userId)`, `status`.

## 6. State Management
- `LoginView` uses `useState` for `formError`, `fieldErrors`, and optional `pending` state to enforce minimum spinner time.
- Custom `useLogin` hook encapsulates API call, handles credentials inclusion, and executes consistent failure delay. Hook stores `isLoading`, `error`, exposes `login` async function and `clearError`.
- Leverage global `AuthContext` / `useAuth` to refresh session after successful login (e.g., `await auth.refreshSession()`).
- Form-level state (input values, touched flags) managed via React state or existing form library (Formik/React Hook Form). Ensure on change resets related field error.

## 7. API Integration
- Request: `POST /login` with body `LoginFormValues` serialized JSON.
- Fetch config: `fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), credentials: 'include' })` to receive HTTP-only cookie.
- Response handling:
  - On `200 OK`, parse `LoginResponseDto`, trigger `auth.refreshSession()` or `auth.setAuthenticated(response.userId)`, then navigate to `/analyze`.
  - On `400/401`, set neutral error message (ignore detailed server errors); optionally log `errors` array for monitoring.
  - On other status, show generic error and allow retry.
- Consider using centralized API client (if project has axios wrapper); ensure error typed accordingly.

## 8. User Interactions
- Typing in email/password updates controlled state and runs inline validation (on blur) to show hints (e.g., “Enter a valid email”).
- Submitting the form triggers `useLogin` -> disables SubmitButton, shows spinner, prevents multiple requests.
- On success: a11y announce success via `aria-live`, clear errors, redirect to `/analyze` after auth context update.
- On failure: maintain focus on alert (focus trap) and keep inputs enabled; allow repeated attempts.
- Dismiss alert (if implemented) clears `formError` but leaves field inputs untouched.
- Clicking `AuthSwitchLink` navigates to `/register` using client router.

## 9. Conditions and Validation
- Email required & RFC-compliant: validated in `AuthForm` (input type email + custom check). Prevent submission if invalid.
- Password required & non-empty (optionally min length 8 to align with server expectations). Display inline error under field.
- Prevent submit when validation errors exist; `SubmitButton` remains disabled.
- Ensure consistent error messaging for 400/401 (“We couldn’t sign you in”). Do not expose whether email exists.
- Ensure `credentials: 'include'` so server can set cookie; verify response before redirect.

## 10. Error Handling
- 401/400: show neutral `GlobalAlert`; optionally shake form; ensure minimum spinner duration (e.g., promise.all with `sleep(600ms)`).
- Network failures/timeouts: show `GlobalAlert` message (“We’re having trouble connecting. Please try again.”) and allow retry.
- Unexpected JSON shape: fallback to generic error, log to monitoring (if available).
- Form validation errors: show inline below inputs, focus first invalid input on submit.
- Accessibility: set `aria-live="assertive"` on alert, manage focus on error to help screen readers.

## 11. Implementation Steps
1. Set up route entry for `/login` in router; ensure authenticated redirect guard.
2. Implement `useLogin` hook encapsulating POST `/login`, minimum delay handling, error normalization, and auth refresh.
3. Create `LoginView` component using Tailwind layout, heading, and integrate `GlobalAlert` + `AuthForm`.
4. Build/adjust `AuthForm` to manage controlled inputs, inline validation, and call `onSubmit` with `LoginFormValues`.
5. Wire `SubmitButton` to receive `isSubmitting` and render spinner/disabled state.
6. Integrate `AuthSwitchLink` with copy (“Don’t have an account?”) linking to `/register`.
7. Connect `LoginView` to auth context: on successful login, call `auth.refreshSession()` then `navigate('/analyze')`.
8. Add unit/interaction tests (if testing framework available) to cover success redirect, error alert, validation prevention.
9. Verify accessibility (labels, focus management) and Tailwind styles per design guidelines.
10. Manual QA: simulate success, 401, network failure; confirm timing consistency and cookie issuance (check developer tools).

