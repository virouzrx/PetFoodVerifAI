# View Implementation Plan: Forgot Password

## 1. Overview

The Forgot Password view provides users with a secure interface to initiate the password reset process. Users enter their email address to request a password reset link. The view implements critical security measures to prevent user enumeration attacks by always displaying a generic success message, regardless of whether the email exists in the system. After submission, the form is hidden and replaced with a success message that instructs users to check their email, including the spam folder.

**Purpose**: 
- Provide a simple, accessible interface for users to request password reset
- Prevent user enumeration attacks through generic messaging
- Guide users through the password recovery process
- Maintain consistency with existing authentication flows

## 2. View Routing

- **Path**: `/forgot-password`
- **Access**: Public (unauthenticated users only)
- **Navigation from**: 
  - Login page via "Forgot Password?" link
  - Direct URL navigation
- **Navigation to**:
  - Back to `/login` via explicit link
  - Automatically to `/login` after reading success message (user-initiated)

## 3. Component Structure

```
ForgotPasswordView (Page Container)
├── Container (max-width wrapper with centered layout)
│   ├── Header Section
│   │   ├── Page Eyebrow Text ("Password Recovery")
│   │   ├── Page Title (h1)
│   │   └── Page Description
│   │
│   ├── Main Content (conditionally rendered based on submission state)
│   │   │
│   │   ├── [Before Submission] Form Section
│   │   │   ├── ForgotPasswordForm (form element)
│   │   │   │   ├── Email Input Field
│   │   │   │   │   ├── Label (htmlFor="email")
│   │   │   │   │   ├── Input (type="email")
│   │   │   │   │   └── Field Error Message (conditional)
│   │   │   │   └── SubmitButton (with loading state)
│   │   │   └── InstructionalText
│   │   │
│   │   └── [After Submission] Success Section
│   │       ├── SuccessMessage (heading + body text)
│   │       │   ├── Success Icon/Visual
│   │       │   ├── Success Heading (h2)
│   │       │   ├── Success Body Text
│   │       │   └── Spam Folder Reminder
│   │       └── NextStepsText
│   │
│   └── Footer Section
│       └── BackToLoginLink
```

## 4. Component Details

### ForgotPasswordView (Main Container Component)

**Component Description:**
Main page component that orchestrates the forgot password flow. It manages the form state, handles submission, and conditionally renders either the email input form or the success message based on submission status. The component implements all validation logic, error handling, and accessibility features.

**Main HTML Elements and Child Components:**
- `<div>` - Outer container with min-height and centering
- `<div>` - Max-width content wrapper (max-w-md)
- `<main>` - Semantic main element with card styling
- `<header>` - Page header section with eyebrow, title, and description
- `<form>` - Form element (when `isSuccess === false`)
- `<div>` - Success message section (when `isSuccess === true`)
- `<a>` or `<Link>` - Back to login link
- **Child Components**: `SubmitButton` (from `views/register/components`)

**Handled Events:**
- `onChange` on email input - Updates form value, clears errors
- `onBlur` on email input - Marks field as touched, triggers validation
- `onSubmit` on form - Validates and submits email to API
- `onClick` on back to login link - Navigation to login page

**Validation Conditions:**
- **Email Required**: 
  - Condition: `email.trim() === ''`
  - Message: `"Email is required."`
  - Trigger: On blur, on submit
  
- **Email Format**: 
  - Condition: Email does not match regex pattern `/^(?:[a-zA-Z0-9_'^&\/+{}=!?$*%#`~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/`
  - Message: `"Enter a valid email address."`
  - Trigger: On blur, on submit

- **Field Touched State**:
  - Only show validation errors after field has been touched (blurred) or form submitted
  - Prevents showing errors while user is still typing

**Types Required:**
- `ForgotPasswordFormValues` - Form field values
- `FieldErrorMap` - Validation errors map
- `ForgotPasswordRequestDto` - API request payload
- `ApiErrorResponse` - API error response structure

**Props:**
None (root page component)

### SubmitButton (Reusable Component - Already Exists)

**Component Description:**
Reusable button component that handles submission states with loading indicators. This component already exists in the codebase at `views/register/components/SubmitButton.tsx` and will be reused without modification.

**Main Elements:**
- `<button>` - Submit button with dynamic text and disabled state

**Handled Events:**
- Inherits form submission through button type="submit"

**Validation Conditions:**
- Disabled when `isSubmitting === true`

**Types:**
```typescript
type SubmitButtonProps = {
  isSubmitting: boolean
  label: string
  loadingLabel: string
}
```

**Props:**
- `isSubmitting: boolean` - Controls disabled state and label text
- `label: string` - Text to display when not submitting (e.g., "Send Reset Link")
- `loadingLabel: string` - Text to display during submission (e.g., "Sending...")

## 5. Types

### Frontend Type Definitions

All type definitions should be added to `frontend/src/types/auth.ts`:

```typescript
// Form values for forgot password form
export type ForgotPasswordFormValues = {
  email: string
}

// API Request DTO
export type ForgotPasswordRequestDto = {
  email: string
}

// API Response - empty body, no response DTO needed
// The API returns 200 OK with no content on success
```

### Existing Types (Already Defined)

The following types already exist in `types/auth.ts` and will be reused:

```typescript
// Field-level errors
export type FieldErrorMap = {
  email?: string
  password?: string
  form?: string
}

// API error response structure
export type ApiErrorResponse = {
  status: number
  message?: string
  errors?: ApiErrorField[]
}

export type ApiErrorField = {
  field?: 'email' | 'password' | 'form'
  message: string
}
```

### ViewModel Types (Component-Internal)

These types are used internally within the ForgotPasswordView component:

```typescript
// Touch tracking for validation
type TouchedFields = {
  email: boolean
}

// Overall form state (internal to component)
type FormState = {
  values: ForgotPasswordFormValues
  fieldErrors: FieldErrorMap
  touched: TouchedFields
}

// Submission state (internal to component)
type SubmissionState = {
  isSubmitting: boolean
  isSuccess: boolean
}
```

## 6. State Management

### State Management Strategy

The Forgot Password view uses **local component state** with a **custom hook pattern** for clean separation of concerns. This follows the established pattern in the codebase (see `useLogin` hook).

### Custom Hook: `useForgotPassword`

**Location**: `frontend/src/hooks/useForgotPassword.ts`

**Purpose**: 
Encapsulates the forgot password submission logic, including API calls, loading state management, error handling, and success state management. This hook follows the same pattern as `useLogin` to maintain consistency across the authentication flows.

**Hook Interface:**
```typescript
export type UseForgotPasswordResult = {
  submit: (email: string) => Promise<void>
  isSubmitting: boolean
  isSuccess: boolean
  error: FieldErrorMap
  clearError: () => void
}
```

**Hook Implementation Details:**
```typescript
import { useCallback, useMemo, useRef, useState } from 'react'
import { forgotPassword } from '../services/authService'
import normalizeApiErrors from '../utils/normalizeApiErrors'
import type {
  ForgotPasswordRequestDto,
  FieldErrorMap,
  ApiErrorResponse,
} from '../types/auth'

const MIN_LOADING_DURATION_MS = 600

const useForgotPassword = (): UseForgotPasswordResult => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<FieldErrorMap>({})
  const latestRequest = useRef(0)

  const submit = useCallback(async (email: string) => {
    const startedAt = Date.now()
    const requestId = startedAt
    latestRequest.current = requestId
    setIsSubmitting(true)
    setError({})

    try {
      const payload: ForgotPasswordRequestDto = {
        email: email.trim().toLowerCase(),
      }
      
      await forgotPassword(payload)

      if (latestRequest.current !== requestId) {
        return
      }

      // Ensure minimum loading duration for better UX
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_LOADING_DURATION_MS) {
        await new Promise(resolve => 
          setTimeout(resolve, MIN_LOADING_DURATION_MS - elapsed)
        )
      }

      setIsSuccess(true)
    } catch (error) {
      if (latestRequest.current !== requestId) {
        return
      }

      const apiError = error as ApiErrorResponse
      let fieldErrors: FieldErrorMap = {}

      // Map API errors to field errors
      if (apiError?.status === 400) {
        fieldErrors = normalizeApiErrors(apiError)
      } else {
        fieldErrors.form = 'An unexpected error occurred. Please try again.'
      }

      setError(fieldErrors)
    } finally {
      if (latestRequest.current === requestId) {
        setIsSubmitting(false)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError({})
  }, [])

  return useMemo(
    () => ({
      submit,
      isSubmitting,
      isSuccess,
      error,
      clearError,
    }),
    [submit, isSubmitting, isSuccess, error, clearError],
  )
}

export default useForgotPassword
```

**State Variables:**
- `isSubmitting: boolean` - Tracks whether the API request is in progress
- `isSuccess: boolean` - Tracks whether the request was successful (triggers UI change)
- `error: FieldErrorMap` - Stores field-level or form-level validation errors
- `latestRequest: useRef<number>` - Prevents race conditions from multiple rapid submissions

**Key Features:**
- Minimum loading duration (600ms) for consistent UX
- Request deduplication to prevent race conditions
- Normalized error handling
- Email normalization (trim + lowercase)

### Component State Management

**In the ForgotPasswordView component:**

```typescript
const [values, setValues] = useState<ForgotPasswordFormValues>({
  email: '',
})

const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})

const [touched, setTouched] = useState<TouchedFields>({
  email: false,
})

const { submit, isSubmitting, isSuccess, error, clearError } = useForgotPassword()
```

**State Flow:**
1. User types → `values.email` updates → errors cleared
2. User blurs field → `touched.email` set to true → validation runs → `fieldErrors` updated
3. User submits → validation runs → if valid, `submit()` called
4. During API call → `isSubmitting = true` → button disabled
5. On success → `isSuccess = true` → UI switches to success message
6. On error → `error` populated → error messages displayed

## 7. API Integration

### Service Function

**Location**: `frontend/src/services/authService.ts`

**Function to Add:**

```typescript
export const forgotPassword = async (
  payload: ForgotPasswordRequestDto,
): Promise<void> => {
  const url = `${API_BASE_URL}/auth/forgot-password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit', // No cookies needed for public endpoint
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return // Success - empty response body
  }

  throw await parseErrorResponse(response)
}
```

### API Contract

**Endpoint**: `POST /api/auth/forgot-password`

**Request Type**: `ForgotPasswordRequestDto`
```typescript
{
  email: string // Normalized (trimmed, lowercase)
}
```

**Response Type**: `void` (empty body)

**Success Response**:
- Status: `200 OK`
- Body: Empty
- Note: Returns 200 OK even if email doesn't exist (security feature)

**Error Responses**:

| Status | Condition | Error Mapping |
|--------|-----------|---------------|
| 400 Bad Request | Invalid email format | Map to `fieldErrors.email` |
| 400 Bad Request | Missing email | Map to `fieldErrors.email` |
| 500 Internal Server Error | Server error | Map to `fieldErrors.form` |

**Error Handling**:
- Use existing `parseErrorResponse` function (already exists in authService.ts)
- Use existing `normalizeApiErrors` utility to map API errors to field errors
- Always display user-friendly error messages

## 8. User Interactions

### User Flow

1. **Initial Page Load**
   - User arrives at `/forgot-password` (from login page or direct URL)
   - Page displays: header, email input form, back to login link
   - Email input is empty and focused automatically
   - Submit button is enabled

2. **Email Input**
   - User types email address
   - As user types:
     - `values.email` updates in real-time
     - Any existing errors are cleared
     - Submit button remains enabled (validation happens on blur/submit)

3. **Field Blur (loses focus)**
   - User tabs out or clicks elsewhere
   - Field marked as touched (`touched.email = true`)
   - Client-side validation runs:
     - If empty → Show "Email is required."
     - If invalid format → Show "Enter a valid email address."
     - If valid → No error shown
   - Error displayed below input field (if any)

4. **Form Submission**
   - User clicks "Send Reset Link" button or presses Enter
   - All fields marked as touched
   - Full validation runs:
     - If invalid → Show errors, focus first error field, don't submit
     - If valid → Proceed with API call
   - Submit button shows "Sending..." and becomes disabled
   - Loading state visible for at least 600ms (better UX)

5. **API Response - Success**
   - Success state triggered (`isSuccess = true`)
   - Form section hidden
   - Success message section displayed:
     - Success icon/visual
     - "Check Your Email" heading
     - Body text: "If an account with that email exists, we've sent a password reset link. Please check your email."
     - Spam folder reminder
   - Back to Login link remains visible
   - Email value cleared from memory

6. **API Response - Error (400)**
   - Error message displayed below email field
   - Example: "Enter a valid email address."
   - Form remains visible with entered email
   - Submit button re-enabled
   - User can correct and resubmit

7. **API Response - Error (500 or network)**
   - Generic error message displayed at form level
   - Message: "An unexpected error occurred. Please try again."
   - Form remains visible with entered email
   - Submit button re-enabled
   - User can retry

8. **Back to Login Navigation**
   - User clicks "Back to Login" link
   - Navigates to `/login`
   - Works in both pre-submission and post-submission states

### Keyboard Navigation

- `Tab` - Navigate between email input, submit button, and back to login link
- `Shift + Tab` - Reverse navigation
- `Enter` in email field - Submits form (if in form)
- `Enter` on back to login link - Navigates to login
- All interactive elements have visible focus indicators

### Screen Reader Announcements

- Page title announced on load: "Password Recovery"
- Field errors announced when validation fails (via `aria-describedby`)
- Form-level errors announced when present
- Loading state announced: "Sending..." (button text change)
- Success state requires manual announcement mechanism

## 9. Conditions and Validation

### Client-Side Validation Rules

#### Email Field Validation

**Validation Function:**
```typescript
const validateEmail = (value: string): string | undefined => {
  // Check if empty
  if (!value.trim()) {
    return 'Email is required.'
  }
  
  // Normalize for validation
  const normalized = value.trim().toLowerCase()
  
  // Email format regex (matches backend validation)
  const emailRegex = /^(?:[a-zA-Z0-9_'^&\/+{}=!?$*%#`~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(normalized)) {
    return 'Enter a valid email address.'
  }
  
  return undefined
}
```

**When Validation Triggers:**
- On field blur (only if field has been touched)
- On form submit (all fields)
- Real-time validation is NOT performed while typing (only on blur/submit)

**How Errors Are Displayed:**
- Errors shown below the email input field
- Error text in red color (`text-red-700`)
- Error text linked to input via `aria-describedby`
- Input border changes to red when error present
- Only show error if field has been touched OR form submitted

### Form Submission Validation

**Pre-Submit Validation:**
```typescript
const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault()
  
  // Mark all fields as touched
  setTouched({ email: true })
  
  // Run validation
  const emailError = validateEmail(values.email)
  
  if (emailError) {
    // Set errors
    setFieldErrors({ email: emailError })
    
    // Focus on error field
    document.getElementById('email')?.focus()
    
    // Don't submit
    return
  }
  
  // Clear errors and proceed with submission
  setFieldErrors({})
  clearError()
  
  try {
    await submit(values.email)
  } catch (error) {
    // Error handling done in hook
    console.error('Unhandled error:', error)
  }
}
```

### API Validation

**Server-Side Validation (Backend):**
- Email format validation (matches client-side)
- Email required validation
- Maximum length validation (256 characters)

**Error Mapping:**
```typescript
// 400 Bad Request with validation errors
{
  "errors": {
    "Email": ["Invalid email format"]
  }
}

// Maps to:
fieldErrors.email = "Invalid email format"
```

### UI State Conditions

**Condition: Show Form Section**
```typescript
{!isSuccess && (
  <form onSubmit={handleSubmit}>
    {/* Form content */}
  </form>
)}
```

**Condition: Show Success Section**
```typescript
{isSuccess && (
  <div>
    {/* Success message */}
  </div>
)}
```

**Condition: Show Field Error**
```typescript
{touched.email && (fieldErrors.email || error.email) && (
  <p id="email-error" className="text-xs text-red-700">
    {fieldErrors.email ?? error.email}
  </p>
)}
```

**Condition: Field ARIA Attributes**
```typescript
<input
  aria-invalid={Boolean((touched.email && fieldErrors.email) || error.email)}
  aria-describedby={
    touched.email && (fieldErrors.email || error.email)
      ? 'email-error'
      : undefined
  }
/>
```

**Condition: Disable Submit Button**
```typescript
<SubmitButton
  isSubmitting={isSubmitting}
  disabled={isSubmitting}
  // ... other props
/>
```

## 10. Error Handling

### Error Scenarios and Handling Strategy

#### 1. Invalid Email Format (400 Bad Request)

**Trigger**: User submits email that doesn't match validation pattern

**API Response:**
```json
{
  "status": 400,
  "errors": {
    "Email": ["Invalid email format"]
  }
}
```

**Handling:**
- Map error to `fieldErrors.email`
- Display error message below email input: "Invalid email format"
- Input border turns red
- Email value preserved in field
- Submit button re-enabled
- Focus remains on email field

**User Recovery:**
- User corrects email format
- Error clears on next change
- User can resubmit

#### 2. Empty Email Field

**Trigger**: User submits form without entering email

**Handling:**
- Client-side validation catches before API call
- Display error: "Email is required."
- Prevent form submission
- Focus on email field

**User Recovery:**
- User enters email
- Error clears
- User can submit

#### 3. Network Error / Offline

**Trigger**: Network connection lost during submission

**Error Object:**
```typescript
{
  status: 0,
  message: undefined
}
```

**Handling:**
- Map to generic form-level error
- Display message: "An unexpected error occurred. Please try again."
- Form remains visible with entered email
- Submit button re-enabled

**User Recovery:**
- User checks network connection
- User clicks submit again

#### 4. Server Error (500 Internal Server Error)

**Trigger**: Backend service failure

**API Response:**
```json
{
  "status": 500,
  "message": "An error occurred processing your request"
}
```

**Handling:**
- Map to generic form-level error
- Display message: "An unexpected error occurred. Please try again."
- Form remains visible
- Submit button re-enabled
- Log error to console for debugging

**User Recovery:**
- User waits a moment
- User retries submission
- If persists, user contacts support

#### 5. Race Condition (Multiple Rapid Submissions)

**Trigger**: User clicks submit multiple times rapidly

**Handling:**
- `latestRequest` ref tracks most recent request
- Older requests ignored when they complete
- Only most recent request updates state
- Submit button disabled during submission prevents this

**User Recovery:**
- No action needed - handled automatically

### Error Message Guidelines

**Field-Level Errors:**
- Specific to the field
- Actionable (tell user what to fix)
- Displayed immediately below field
- Examples:
  - "Email is required."
  - "Enter a valid email address."

**Form-Level Errors:**
- Generic, non-disclosing (security)
- Displayed at top of form
- Examples:
  - "An unexpected error occurred. Please try again."

**Success Message (Always Generic):**
- "If an account with that email exists, we've sent a password reset link. Please check your email."
- Never confirms whether email exists (prevents enumeration)

### Accessibility for Errors

- Field errors linked via `aria-describedby`
- Invalid state marked via `aria-invalid`
- Error text has sufficient color contrast (red-700)
- Error icon optional but helpful (visual indicator)
- Screen readers announce errors when they appear

### Error Recovery Flow

```
Error Occurs
    ↓
Error Displayed (field or form level)
    ↓
User Reads Error
    ↓
User Takes Action:
    - Corrects input → Error clears on change
    - Retries submission → New attempt
    - Navigates away → State reset
    ↓
Resolution:
    - Success → Show success message
    - Another error → Repeat flow
```

## 11. Implementation Steps

### Step 1: Add Type Definitions

**File**: `frontend/src/types/auth.ts`

Add the following types to the existing file:

```typescript
// Forgot Password Form Values
export type ForgotPasswordFormValues = {
  email: string
}

// Forgot Password API Request DTO
export type ForgotPasswordRequestDto = {
  email: string
}
```

**Verification**: TypeScript compilation succeeds with no errors.

---

### Step 2: Add API Service Function

**File**: `frontend/src/services/authService.ts`

Add the `forgotPassword` function at the end of the file:

```typescript
export const forgotPassword = async (
  payload: ForgotPasswordRequestDto,
): Promise<void> => {
  const url = `${API_BASE_URL}/auth/forgot-password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return
  }

  throw await parseErrorResponse(response)
}
```

**Verification**: 
- Import types at top of file
- Function compiles without errors
- Follows existing pattern (similar to `registerUser`, `loginUser`)

---

### Step 3: Create Custom Hook

**File**: `frontend/src/hooks/useForgotPassword.ts` (new file)

Create the custom hook following the pattern from `useLogin.ts`:

```typescript
import { useCallback, useMemo, useRef, useState } from 'react'
import { forgotPassword } from '../services/authService'
import normalizeApiErrors from '../utils/normalizeApiErrors'
import type {
  ForgotPasswordRequestDto,
  FieldErrorMap,
  ApiErrorResponse,
} from '../types/auth'

const MIN_LOADING_DURATION_MS = 600

export type UseForgotPasswordResult = {
  submit: (email: string) => Promise<void>
  isSubmitting: boolean
  isSuccess: boolean
  error: FieldErrorMap
  clearError: () => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const useForgotPassword = (): UseForgotPasswordResult => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<FieldErrorMap>({})
  const latestRequest = useRef(0)

  const submit = useCallback(async (email: string) => {
    const startedAt = Date.now()
    const requestId = startedAt
    latestRequest.current = requestId
    setIsSubmitting(true)
    setError({})

    try {
      const payload: ForgotPasswordRequestDto = {
        email: email.trim().toLowerCase(),
      }

      await forgotPassword(payload)

      if (latestRequest.current !== requestId) {
        return
      }

      await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
      setIsSuccess(true)
    } catch (error) {
      if (latestRequest.current !== requestId) {
        return
      }

      let fieldErrors: FieldErrorMap = {}
      const apiError = error as ApiErrorResponse

      if (apiError?.status === 400) {
        fieldErrors = normalizeApiErrors(apiError)
      } else {
        fieldErrors.form = 'An unexpected error occurred. Please try again.'
      }

      await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
      setError(fieldErrors)
    } finally {
      if (latestRequest.current === requestId) {
        setIsSubmitting(false)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError({})
  }, [])

  return useMemo(
    () => ({
      submit,
      isSubmitting,
      isSuccess,
      error,
      clearError,
    }),
    [submit, isSubmitting, isSuccess, error, clearError],
  )
}

export default useForgotPassword
```

**Verification**:
- Hook compiles without errors
- Follows same pattern as `useLogin`
- All dependencies properly declared

---

### Step 4: Create Forgot Password View Component

**File**: `frontend/src/views/forgot-password/ForgotPasswordView.tsx` (new file)

Create the main view component:

```typescript
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import useForgotPassword from '../../hooks/useForgotPassword'
import SubmitButton from '../register/components/SubmitButton'
import type { ForgotPasswordFormValues, FieldErrorMap } from '../../types/auth'

const initialValues: ForgotPasswordFormValues = {
  email: '',
}

const validateEmail = (value: string) => {
  if (!value.trim()) {
    return 'Email is required.'
  }
  const normalized = value.trim().toLowerCase()
  const emailRegex =
    /^(?:[a-zA-Z0-9_'^&\/+{}=!?$*%#`~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
  if (!emailRegex.test(normalized)) {
    return 'Enter a valid email address.'
  }
  return undefined
}

const ForgotPasswordView = () => {
  const { submit, isSubmitting, isSuccess, error, clearError } = useForgotPassword()
  const [values, setValues] = useState<ForgotPasswordFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [touched, setTouched] = useState<Record<keyof ForgotPasswordFormValues, boolean>>({
    email: false,
  })

  const updateValue = (field: keyof ForgotPasswordFormValues, value: string) => {
    clearError()
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: keyof ForgotPasswordFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const emailError = validateEmail(values.email)
    setFieldErrors((prev) => ({ ...prev, email: emailError }))
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const emailError = validateEmail(values.email)

      if (emailError) {
        setFieldErrors({ email: emailError })
        setTouched({ email: true })
        document.getElementById('email')?.focus()
        return
      }

      try {
        await submit(values.email)
      } catch (error) {
        console.error('Unhandled forgot password error', error)
      }
    },
    [submit, values],
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              Password Recovery
            </p>
            <h1 className="text-3xl font-semibold text-brand-dark">
              Reset Your Password
            </h1>
            <p className="text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </header>

          {!isSuccess ? (
            <form className="space-y-5" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-brand-dark">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={values.email}
                  onChange={(event) => updateValue('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  aria-invalid={Boolean((touched.email && fieldErrors.email) || error.email)}
                  aria-describedby={
                    touched.email && (fieldErrors.email || error.email)
                      ? 'email-error'
                      : undefined
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  disabled={isSubmitting}
                />
                {touched.email && (fieldErrors.email || error.email) ? (
                  <p id="email-error" className="text-xs text-red-700">
                    {fieldErrors.email ?? error.email}
                  </p>
                ) : null}
              </div>

              <SubmitButton
                isSubmitting={isSubmitting}
                label="Send Reset Link"
                loadingLabel="Sending..."
              />

              <p className="text-xs text-gray-500 text-center">
                We&apos;ll send you an email with instructions to reset your password.
              </p>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-brand-dark">Check Your Email</h2>
              <p className="text-sm text-gray-600">
                If an account with that email exists, we&apos;ve sent a password reset link.
                Please check your email.
              </p>
              <p className="text-xs text-gray-500">
                Don&apos;t forget to check your spam folder if you don&apos;t see it in your
                inbox.
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-brand-primary hover:text-brand-dark transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ForgotPasswordView
```

**Verification**:
- Component compiles without errors
- Styling matches existing auth views (LoginView, RegisterView)
- All accessibility attributes present
- Follows established patterns

---

### Step 5: Add Route Configuration

**File**: `frontend/src/App.tsx` (or wherever routes are defined)

Add the forgot password route:

```typescript
import ForgotPasswordView from './views/forgot-password/ForgotPasswordView'

// In your router configuration:
<Route path="/forgot-password" element={<ForgotPasswordView />} />
```

**Verification**:
- Route accessible at `/forgot-password`
- Page loads without errors
- Navigation from login page works

---

### Step 6: Add "Forgot Password?" Link to Login View

**File**: `frontend/src/views/login/LoginView.tsx`

Add a link below the password field (around line 230, after the password hint):

```typescript
<div className="space-y-1">
  <label htmlFor="password" className="block text-sm font-semibold text-brand-dark">
    Password
  </label>
  <input
    // ... existing input props
  />
  {touched.password && (fieldErrors.password || error.password) ? (
    <p id="password-error" className="text-xs text-red-700">
      {fieldErrors.password ?? error.password}
    </p>
  ) : null}
  <p className="text-xs text-gray-500">Password must be at least 8 characters.</p>
  
  {/* ADD THIS: */}
  <div className="text-right">
    <Link
      to="/forgot-password"
      className="text-xs font-medium text-brand-primary hover:text-brand-dark transition-colors"
    >
      Forgot Password?
    </Link>
  </div>
</div>
```

**Verification**:
- Link visible on login page
- Clicking link navigates to `/forgot-password`
- Styling consistent with other links

---

### Step 7: Manual Testing

Perform the following tests:

#### Functional Tests:
- [ ] Navigate to `/forgot-password` directly - page loads correctly
- [ ] Navigate from login page via "Forgot Password?" link - page loads correctly
- [ ] Submit empty form - shows "Email is required." error
- [ ] Enter invalid email format - shows "Enter a valid email address." error
- [ ] Enter valid email for existing user - shows success message
- [ ] Enter valid email for non-existing user - shows success message (same as above)
- [ ] Click "Back to Login" before submission - navigates to login
- [ ] Click "Back to Login" after submission - navigates to login
- [ ] Submit button shows "Sending..." during request
- [ ] Success message displayed after successful submission
- [ ] Form hidden after successful submission

#### Accessibility Tests:
- [ ] Tab through all interactive elements in correct order
- [ ] Email input receives autofocus on load
- [ ] Field error announced to screen reader
- [ ] Submit button disabled during submission
- [ ] All form labels properly associated with inputs
- [ ] Error messages have sufficient color contrast

#### Error Handling Tests:
- [ ] Network offline - shows generic error message
- [ ] Invalid email (400) - shows field-specific error
- [ ] Server error (500) - shows generic error message

#### Browser Compatibility:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge

---

### Step 8: Write Unit Tests (Optional but Recommended)

**File**: `frontend/src/hooks/useForgotPassword.test.ts`

Create tests for the custom hook:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useForgotPassword from './useForgotPassword'
import * as authService from '../services/authService'

vi.mock('../services/authService')

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useForgotPassword())

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.error).toEqual({})
  })

  it('should handle successful submission', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValueOnce()

    const { result } = renderHook(() => useForgotPassword())

    result.current.submit('test@example.com')

    expect(result.current.isSubmitting).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  it('should handle validation errors', async () => {
    const apiError = {
      status: 400,
      errors: [{ field: 'email', message: 'Invalid email format' }],
    }
    vi.mocked(authService.forgotPassword).mockRejectedValueOnce(apiError)

    const { result } = renderHook(() => useForgotPassword())

    result.current.submit('invalid-email')

    await waitFor(() => {
      expect(result.current.error.email).toBeTruthy()
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  it('should normalize email before submission', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValueOnce()

    const { result } = renderHook(() => useForgotPassword())

    await result.current.submit('  TEST@EXAMPLE.COM  ')

    expect(authService.forgotPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
    })
  })
})
```

**Verification**:
- All tests pass
- Coverage meets project standards

---

### Step 9: Update Documentation (If Required)

- Add entry to route documentation
- Update authentication flow diagrams (if they exist)
- Document the security considerations (user enumeration prevention)

---

### Step 10: Code Review and QA

- [ ] Submit pull request with all changes
- [ ] Request code review from team
- [ ] Address any feedback
- [ ] Perform QA testing in staging environment
- [ ] Verify email delivery in staging
- [ ] Check that backend endpoint is deployed

---

## Summary

This implementation plan provides a complete guide for implementing the Forgot Password view following the established patterns in the PetFoodVerifAI codebase. The view maintains consistency with existing authentication flows while implementing critical security measures to prevent user enumeration attacks. The component follows React best practices with proper TypeScript typing, accessibility features, and error handling.

**Key Files Created/Modified:**
- `frontend/src/types/auth.ts` - Type definitions (modified)
- `frontend/src/services/authService.ts` - API service function (modified)
- `frontend/src/hooks/useForgotPassword.ts` - Custom hook (new)
- `frontend/src/views/forgot-password/ForgotPasswordView.tsx` - Main view component (new)
- `frontend/src/views/login/LoginView.tsx` - Add link (modified)
- `frontend/src/App.tsx` - Route configuration (modified)

**Testing Requirements:**
- Unit tests for `useForgotPassword` hook
- Integration testing with mocked API
- Manual E2E testing of complete flow
- Accessibility testing with keyboard and screen reader


