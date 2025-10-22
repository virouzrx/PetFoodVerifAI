# View Implementation Plan - Register

## 1. Overview
The Register view enables new users to create an account using their email and password. Upon successful registration, the backend returns a token; the frontend stores the auth state and redirects to `/analyze`. The view emphasizes accessibility, clear validation, security best practices, and responsive UX.

## 2. View Routing
- Path: `/register`
- Access: Public (unauthenticated). If already authenticated, immediately redirect to `/analyze`.
- Route guard: If an auth token exists in memory/storage, navigate to `/analyze`.

## 3. Component Structure
- `RegisterView`
  - `FormErrorSummary`
  - `AuthForm`
    - `PasswordStrengthHint`
    - `SubmitButton`
  - `AuthSwitchLink`

## 4. Component Details
### RegisterView
- Component description: Page container responsible for routing logic, layout, and orchestrating registration submission. Handles success redirect and global errors.
- Main elements: page heading, optional lead text, `FormErrorSummary`, `AuthForm`, `AuthSwitchLink`.
- Handled interactions:
  - On mount: check auth; if authenticated, redirect to `/analyze`.
  - On submit (from `AuthForm`): call register API; handle success/failure.
- Handled validation: Defers field-level validation to `AuthForm`; handles cross-field/global errors (e.g., network).
- Types: `RegisterFormValues`, `RegisterRequestDto`, `RegisterResponseDto`, `ApiErrorResponse`, `FieldErrorMap`.
- Props: none (top-level route component).

### AuthForm
- Component description: Accessible form for email and password. Displays inline errors, manages input focus and submission. Delegates password strength UI to `PasswordStrengthHint`.
- Main elements: `<form>`, labeled email `<input type="email">`, password `<input type="password">` plus optional show/hide control, inline field error text, `PasswordStrengthHint`, `SubmitButton`.
- Handled interactions:
  - `onChange` for inputs; `onBlur` for validation; `onSubmit` to bubble values to parent.
  - Enter key submits when focused on inputs.
  - Optional: toggle password visibility.
- Handled validation (pre-submit):
  - Email: required, RFC 5322-ish regex, trimmed, lowercase normalized for submission.
  - Password: required; soft pre-checks (not blocking): length ≥ 8, contains uppercase, lowercase, digit; special char recommended. Do not block submission solely on strength if user insists; final authority is API.
  - Disable submit if currently submitting.
- Types: `RegisterFormValues`, `FieldErrorMap`, `PasswordStrengthResult`.
- Props:
  - `initialValues?: RegisterFormValues`
  - `onSubmit: (values: RegisterFormValues) => void`
  - `isSubmitting: boolean`
  - `errors: FieldErrorMap` (e.g., `{ email?: string; password?: string; form?: string }`)

### PasswordStrengthHint
- Component description: Non-blocking strength meter and checklist of recommended password rules.
- Main elements: strength bar, checklist items, `aria-live="polite"` region.
- Handled interactions: none (purely derived from password value).
- Handled validation: soft checks only; not preventing submission.
- Types: `PasswordStrengthResult`.
- Props:
  - `password: string`
  - `result: PasswordStrengthResult` (or computed internally via `usePasswordStrength(password)`).

### FormErrorSummary
- Component description: Renders top-level error messages not tied to a single field, with focus management.
- Main elements: dismissible alert region with `role="alert"`, `tabIndex={-1}` for focus on error.
- Handled interactions: Dismiss/close; moves focus to first invalid field when link clicked.
- Handled validation: Displays `errors.form` and/or a list of field errors.
- Types: `FieldErrorMap`.
- Props:
  - `errors: FieldErrorMap`
  - `onFocusField?: (fieldName: keyof RegisterFormValues) => void`

### SubmitButton
- Component description: Primary CTA for submission; shows progress state.
- Main elements: `<button type="submit">`, loading spinner, `aria-busy` and `aria-disabled`.
- Handled interactions: Click/press Enter to submit form.
- Handled validation: Disabled while submitting or when required fields empty.
- Types: none.
- Props:
  - `isSubmitting: boolean`
  - `label?: string` (default: "Create account")

### AuthSwitchLink
- Component description: Link to Login view when user already has an account.
- Main elements: Inline text and link to `/login`.
- Handled interactions: Navigates to `/login`.
- Types: none.
- Props: none.

## 5. Types
Define frontend TypeScript types for DTOs and view models.

```ts
// Form values managed by the view
export type RegisterFormValues = {
  email: string;
  password: string;
};

// Request/Response DTOs (must match API)
export type RegisterRequestDto = {
  email: string;
  password: string;
};

export type RegisterResponseDto = {
  userId: string;
  token: string;
};

// API error payloads may vary; normalize to this shape
export type ApiErrorField = {
  field?: 'email' | 'password' | 'form';
  message: string;
};

export type ApiErrorResponse = {
  status: number;
  message?: string;
  errors?: ApiErrorField[];
};

export type FieldErrorMap = {
  email?: string;
  password?: string;
  form?: string;
};

export type PasswordStrengthResult = {
  score: 0 | 1 | 2 | 3 | 4; // 0 weak .. 4 strong
  checks: {
    minLength8: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSpecial: boolean; // recommended
  };
};

// Optional: shape for a global auth context/store
export type AuthUser = { userId: string };
export type AuthState = { user?: AuthUser; token?: string };
```

## 6. State Management
- Local component state in `AuthForm` for `email`, `password`, `touched`, `fieldErrors`, and `isSubmitting` (passed from parent).
- Derived state: `passwordStrength` via `usePasswordStrength(password)`; `isSubmitDisabled` when submitting or required fields blank.
- `RegisterView` holds API interaction state: `isSubmitting`, `errors`, and orchestrates `onSubmit`.
- Auth store/context (`useAuth`): provides `login(token, userId)`, `logout()`, `isAuthenticated`. Store token in memory; optionally persist to `localStorage`/`sessionStorage` under a namespaced key. Prefer secure httpOnly cookie if backend supports in future.
- Security hygiene: do not log password; clear password state after submit (success or failure). Avoid storing password anywhere persistent.

## 7. API Integration
- Endpoint: `POST /register`
- Request: `RegisterRequestDto` with JSON body `{ email, password }`.
- Response (201): `RegisterResponseDto` `{ userId, token }`.
- Error responses:
  - 400 Bad Request: invalid email or weak password (map to inline field errors; fallback to summary).
  - 409 Conflict: email already exists (map to `email` field error and suggest Login).
  - Network/5xx: show generic form-level error, allow retry.
- HTTPS: Ensure base URL uses `https` in production; never send credentials over insecure HTTP.

Example integration:
```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function registerUser(payload: RegisterRequestDto): Promise<RegisterResponseDto> {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
  });

  if (res.status === 201) return res.json();

  const text = await res.text();
  let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
  const error: ApiErrorResponse = {
    status: res.status,
    message: parsed?.message,
    errors: parsed?.errors,
  };
  throw error;
}
```

## 8. User Interactions
- Type email/password → inline validation hints appear, with `aria-live="polite"` updates.
- Press Enter or click Submit → triggers `onSubmit`; button shows loading state; form disabled.
- Error occurs → focus moves to `FormErrorSummary`; pressing its field links focuses the corresponding input.
- Success (201) → store token, set auth user, redirect to `/analyze`.
- Click "Already have an account? Log in" → navigate to `/login`.

## 9. Conditions and Validation
- Email
  - Required; trimmed; basic RFC-compliant regex.
  - On 400 with field error: show specific message from API.
- Password
  - Required.
  - Soft pre-checks: ≥ 8 chars, contains upper, lower, digit; special char recommended.
  - On 400 with field error (weak password): display API-provided message.
- Submit disabled when: submitting OR email/password empty.
- Redirect condition: If authenticated on mount, or after success.

## 10. Error Handling
- 400 Bad Request: map server field errors to `email`/`password`. If generic message only, show in `FormErrorSummary`.
- 409 Conflict: set `errors.email = "An account with this email already exists."`; provide inline `AuthSwitchLink` to `/login`.
- Network errors/5xx: `errors.form = "Something went wrong. Please try again."` with retry.
- Rate limiting (429) if applicable: show wait message and disable submit briefly.
- Unknown shape: safe parser fallback; never expose raw server text that may contain PII.
- Security: clear password from state after attempt; never store or log it.

## 11. Implementation Steps
1. Routing
   - Add route for `/register` and guard to redirect authenticated users to `/analyze`.
2. Types
   - Create types: `RegisterFormValues`, `RegisterRequestDto`, `RegisterResponseDto`, `ApiErrorResponse`, `FieldErrorMap`, `PasswordStrengthResult`.
3. Auth store/context
   - Implement `useAuth` with `login(token, userId)` and `logout()`. Persist token as appropriate.
4. Utilities
   - Implement `usePasswordStrength(password)` returning `PasswordStrengthResult`.
   - Implement `normalizeApiErrors(response)` → `FieldErrorMap`.
5. Components
   - `FormErrorSummary`: accessible alert with list of messages; focus management.
   - `SubmitButton`: loading/disabled states with spinner and ARIA attributes.
   - `AuthSwitchLink`: link to `/login`.
   - `AuthForm`: email/password fields, inline errors, integrates `PasswordStrengthHint` and `SubmitButton`.
6. View
   - `RegisterView`: compose components; handle `onSubmit` → calls `registerUser(values)`.
   - On success: `useAuth().login(token, userId)` then `navigate('/analyze')`.
   - On error: map errors and set focus to `FormErrorSummary`.
7. Styling (Tailwind)
   - Apply consistent spacing, focus rings, readable error colors with sufficient contrast.
8. Accessibility QA
   - Keyboard-only flow, screen-reader semantics (`aria-invalid`, `aria-describedby`, `role="alert"`).
9. Security QA
   - Confirm no password logging, HTTPS base URL in production, clear password state on completion.
10. Final QA
   - Test 201 success path; 400 invalid email; 400 weak password; 409 email exists; network error; redirect behavior when already authenticated.


