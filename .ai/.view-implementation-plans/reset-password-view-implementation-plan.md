# View Implementation Plan: Reset Password

## 1. Overview
This document outlines the implementation plan for the `Reset Password` view. Its purpose is to allow a user who has forgotten their password to set a new one using a secure token received via email. The view will validate the new password, handle the API interaction for the password reset, and provide clear feedback to the user on success or failure.

## 2. View Routing
- **Path**: `/reset-password`
- **URL Parameters**: The view expects `email` and `token` as URL query parameters (e.g., `/reset-password?email=user@example.com&token=...`).

## 3. Component Structure
The view will be composed of the following components in a hierarchical structure:

```
ResetPasswordView
├── if (link is invalid)
│   ├── ErrorAlert (message: "Invalid or expired link.")
│   └── RequestNewResetLink (to /forgot-password)
├── else if (submission is successful)
│   ├── SuccessMessage (message: "Password reset successfully.")
│   └── RedirectCountdown (redirects to /login after 3s)
└── else
    ├── PageTitle ("Reset Your Password")
    ├── ResetPasswordForm
    │   ├── PasswordField (for newPassword)
    │   ├── PasswordStrengthIndicator
    │   ├── PasswordField (for confirmPassword)
    │   └── SubmitButton
    └── ErrorAlert (for API errors)
```

## 4. Component Details

### `ResetPasswordView`
- **Component description**: The main page component that orchestrates the entire reset password flow. It is responsible for parsing URL parameters and managing the overall state of the process (e.g., loading, success, error).
- **Main elements**: Renders child components conditionally based on the state: the form, a success message, or an error message if the link is invalid.
- **Handled interactions**: Reads `email` and `token` from URL query parameters on component mount.
- **Props**: None.

### `ResetPasswordForm`
- **Component description**: A form for the user to enter and confirm their new password. It handles input, validation, and submission. It will be built using `React Hook Form`.
- **Main elements**: `form` element, two `PasswordField` components, a `PasswordStrengthIndicator`, an `ErrorAlert` for form-level errors, and a `SubmitButton`.
- **Handled interactions**:
    - `onChange` on password fields to update form state.
    - `onSubmit` on the form to trigger validation and the API call.
- **Handled validation**:
    - **New Password**:
        - Required.
        - Minimum length: 6 characters.
        - Must contain at least one uppercase letter (A-Z).
        - Must contain at least one lowercase letter (a-z).
        - Must contain at least one number (0-9).
        - Must contain at least one non-alphanumeric character (e.g., !, @, #, $).
    - **Confirm Password**:
        - Required.
        - Must match the value of the "New Password" field.
- **Types**: `ResetPasswordFormViewModel`, `ResetPasswordRequestDto`.
- **Props**:
    - `onSubmit`: `(data: ResetPasswordFormViewModel) => void`
    - `isLoading`: `boolean`
    - `error`: `ApiError | null`

### `PasswordStrengthIndicator`
- **Component description**: A visual component that provides real-time feedback on the strength of the password as the user types, based on the validation criteria.
- **Main elements**: A series of text elements or icons indicating which criteria have been met (e.g., "✓ Minimum 6 characters", "✗ At least one uppercase letter").
- **Handled interactions**: None. It's a display-only component.
- **Props**:
    - `password`: `string`

### `RedirectCountdown`
- **Component description**: A simple component that displays a message indicating a successful password reset and informs the user they will be redirected shortly, showing a countdown.
- **Main elements**: A `p` tag (e.g., "Redirecting to login in 3...").
- **Handled interactions**: None.
- **Props**:
    - `targetUrl`: `string` (e.g., `/login`)
    - `delayInSeconds`: `number` (e.g., 3)

## 5. Types
### DTOs
```typescript
/**
 * DTO for the POST /api/auth/reset-password request.
 * This must match the backend's ResetPasswordRequestDto.
 */
interface ResetPasswordRequestDto {
  email: string;
  token: string;
  newPassword: string;
}
```

### ViewModels
```typescript
/**
 * ViewModel for the ResetPasswordForm state, managed by React Hook Form.
 */
interface ResetPasswordFormViewModel {
  newPassword: string;
  confirmPassword: string;
}
```

## 6. State Management
A custom hook, `useResetPassword`, will be created to encapsulate the view's logic and state.
- **Responsibilities**:
    - Parse `email` and `token` from URL query parameters using React Router's `useSearchParams`.
    - Manage a state variable `isInvalidLink` if parameters are missing.
    - Initialize `React Hook Form` (`useForm`) with the `ResetPasswordFormViewModel` and validation rules.
    - Implement the `useMutation` hook from `TanStack Query` to handle the API call to `POST /api/auth/reset-password`.
    - Manage the success and error states from the mutation.
    - Handle the redirect logic on success.
- **Exposed values**:
    - `form`: The instance returned from `useForm`.
    - `handleSubmit`: The submission handler to be passed to the form.
    - `mutation`: The `useMutation` instance containing `isLoading`, `isSuccess`, `isError`, `error`.
    - `isInvalidLink`: A boolean to indicate if the URL parameters are valid.

## 7. API Integration
- **Endpoint**: `POST /api/auth/reset-password`
- **Request Type**: `ResetPasswordRequestDto`
- **Implementation**: The `useResetPassword` hook will use `TanStack Query`'s `useMutation` hook.
    - The `mutationFn` will call a service function (e.g., `authService.resetPassword`) which performs an `axios.post` call.
    - The `email` and `token` from the URL are combined with the `newPassword` from the form data to construct the request payload.
- **Response**:
    - **On Success (200 OK)**: The response body is empty. The `onSuccess` callback in `useMutation` will trigger the success UI and redirect.
    - **On Error (400 Bad Request)**: The response body will contain an `errors` array. The `onError` callback will handle displaying an appropriate error message.

## 8. User Interactions
- **User lands on the page with a valid link**: The reset password form is displayed.
- **User lands on the page with an invalid/missing link**: An error message is shown, with a link to request a new password reset.
- **User types in password fields**: The `PasswordStrengthIndicator` updates in real-time. Validation errors (e.g., "Passwords must match") appear if the user blurs an invalid field.
- **User submits the form with invalid data**: Validation messages are displayed, and the API call is blocked.
- **User submits a valid form**: The submit button enters a loading state.
    - **If API call succeeds**: The form is hidden and a success message with a redirect countdown is shown. The user is navigated to the login page after 3 seconds.
    - **If API call fails**: An error alert is displayed with a message like "This link may be expired. Please try again."

## 9. Conditions and Validation
- **URL Parameter Validation**: The `ResetPasswordView` will immediately check for the presence of `email` and `token` in the URL search parameters upon rendering. If either is missing, the form will not be rendered.
- **Form Field Validation**: `React Hook Form` will be used to enforce all password complexity and matching rules on the client side before enabling form submission. This provides instant feedback to the user.

## 10. Error Handling
- **Invalid URL Parameters**: If `email` or `token` are missing, the view will render a prominent error state explaining that the link is invalid and will provide a link to `/forgot-password`.
- **API Errors**: If the `resetPassword` mutation fails (e.g., due to an expired token), the `isError` state from `useMutation` will be true. An `ErrorAlert` component will display a user-friendly message, guiding them to request a new link.
- **Network Errors**: `TanStack Query` will automatically handle network failures. A generic error message will be displayed in the `ErrorAlert`.

## 11. Implementation Steps
1. Create the file `src/views/auth/ResetPasswordView.tsx`.
2. Implement the `useResetPassword` custom hook in a new file `src/hooks/useResetPassword.ts` to encapsulate all logic (URL parsing, form state, API mutation).
3. Define the `ResetPasswordRequestDto` and `ResetPasswordFormViewModel` types in `src/types/auth.ts`.
4. Create the `ResetPasswordView` component. It will call `useResetPassword` and render UI conditionally based on the hook's state (`isInvalidLink`, `mutation.isSuccess`, etc.).
5. Create the `ResetPasswordForm` component, which receives props from the view. Use `react-hook-form` and a `zod` schema for validation.
6. Create the `PasswordStrengthIndicator` component, which takes the current password value as a prop and displays the status of validation criteria.
7. Create the `RedirectCountdown` component.
8. Add the new route `/reset-password` in the main router file, pointing to `ResetPasswordView`.
9. Update the `authService` to include the `resetPassword` function that makes the `POST` request.
10. Write unit and integration tests for the `useResetPassword` hook and the `ResetPasswordView` component to cover all scenarios (success, API error, invalid link).
