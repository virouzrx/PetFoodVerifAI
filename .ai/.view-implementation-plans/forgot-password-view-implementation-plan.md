# View Implementation Plan: Forgot Password

## 1. Overview
This document outlines the implementation plan for the "Forgot Password" view. The primary purpose of this view is to provide a user interface for users who have forgotten their password to initiate the password reset process. Users will enter their email address, and upon submission, the system will send a password reset link to that email if an account exists. The view prioritizes security by preventing user enumeration attacks.

## 2. View Routing
- **Path**: `/forgot-password`
- **Description**: This is a public route accessible to unauthenticated users, typically linked from the Login view.

## 3. Component Structure
The view will be composed of a main view component that orchestrates the state and presentation of several child components.

```
ForgotPasswordView
└── AuthLayout
    ├── Header (e.g., "Forgot Password")
    ├── SuccessMessage (Conditionally rendered on success)
    └── ForgotPasswordForm (Visible initially)
        ├── FormErrorSummary (For general API errors)
        ├── InputField (For Email)
        ├── SubmitButton
        └── BackToLoginLink
```

## 4. Component Details

### `ForgotPasswordView`
- **Component description**: The main container for the forgot password feature. It manages the application state for the process, such as success and error states, and conditionally renders the form or the success message.
- **Main elements**: Renders the `ForgotPasswordForm` or a `SuccessMessage` based on the `isSuccess` state. It will utilize the `useForgotPassword` custom hook to manage its state and logic.
- **Handled interactions**: None directly. It orchestrates child components.
- **Handled validation**: None directly.
- **Types**: None.
- **Props**: None.

### `ForgotPasswordForm`
- **Component description**: A form that captures the user's email address. It handles user input, form submission, and displays validation and API errors.
- **Main elements**: A `<form>` element containing a shared `InputField` for the email, a `SubmitButton`, a `FormErrorSummary` for non-field specific errors, and a `BackToLoginLink` component for navigation.
- **Handled interactions**:
  - `onChange` on the email input field to update the form state.
  - `onSubmit` on the form to trigger the password reset process.
- **Handled validation**:
  - **Email is required**: The field cannot be empty. An error message "Email is required." will be shown.
  - **Valid email format**: The input must conform to a standard email pattern (e.g., `user@domain.com`). An error message "Please enter a valid email address." will be shown.
- **Types**: `ForgotPasswordFormViewModel`, `ForgotPasswordRequestDto`.
- **Props**:
  - `onSubmit: (data: ForgotPasswordFormViewModel) => void`: Function to call when the form is submitted with valid data.
  - `isLoading: boolean`: Indicates if the submission is in progress.
  - `apiError: string | null`: A general error message from the API to display.

### Shared Components
- **`SuccessMessage`**: Displays a static success message.
- **`InputField`**: A reusable input component with a label and inline error display.
- **`SubmitButton`**: A reusable button that shows a loading state.
- **`BackToLoginLink`**: Navigates the user to the `/login` route.
- **`FormErrorSummary`**: Displays a general, non-field-specific error message.

## 5. Types

### DTOs (Data Transfer Objects)
These types define the contract with the API.

```typescript
// DTO for the API request
interface ForgotPasswordRequestDto {
  email: string;
}
```

### ViewModels
These types represent the form's state within the frontend.

```typescript
// ViewModel for the form state
interface ForgotPasswordFormViewModel {
  email: string;
}
```

## 6. State Management
The view's logic will be encapsulated in a custom hook, `useForgotPassword`, to promote reusability and separation of concerns.

### `useForgotPassword` Hook
- **Purpose**: To manage the state and side effects related to the forgot password process.
- **State**:
  - `isLoading: boolean`: Tracks the loading state of the API request.
  - `isSuccess: boolean`: Becomes `true` after a successful API call, used to render the success message.
  - `error: string | null`: Stores any generic error messages from the API.
- **Returns**:
  - `isLoading: boolean`
  - `isSuccess: boolean`
  - `error: string | null`
  - `submitForgotPassword: (data: ForgotPasswordRequestDto) => Promise<void>`: A function to execute the API call.

## 7. API Integration
- **Endpoint**: `POST /api/auth/forgot-password`
- **Description**: Submits the user's email to initiate the password reset process.
- **Request Type**: `ForgotPasswordRequestDto`
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response Type**:
  - **Success (200 OK)**: Empty body. The frontend should interpret this as a successful submission.
  - **Error (400 Bad Request)**: Indicates invalid email format from the server's perspective.
  - **Error (500 Internal Server Error)**: Indicates a generic server-side issue.

## 8. User Interactions
- **Typing in Email Field**: The form's state is updated on every keystroke.
- **Submitting the Form**:
  - **With Invalid Data**: Frontend validation prevents submission and displays inline error messages.
  - **With Valid Data**: The `submitForgotPassword` function is called. The `SubmitButton` enters a loading state, and the API request is dispatched.
- **Clicking "Back to Login"**: The user is immediately navigated to the `/login` page using React Router.

## 9. Conditions and Validation
- **Client-Side Validation**: The `ForgotPasswordForm` is responsible for all client-side validation before attempting to submit to the API.
  - The `email` field must not be empty.
  - The `email` field must match a valid email regular expression.
- **UI State Changes**:
  - The `SubmitButton` will be disabled while `isLoading` is `true`.
  - Inline validation messages will appear beneath the `InputField` if validation fails.
  - A general error message will appear in the `FormErrorSummary` if `apiError` is not null.

## 10. Error Handling
- **Invalid Email Format**: Handled by client-side validation. A fallback in the API integration logic will handle a 400 response by displaying an error in the `FormErrorSummary`.
- **Network/Server Errors (5xx)**: Any failed API request (e.g., network error, 500 status code) will be caught. The `error` state in `useForgotPassword` will be populated with a generic message like "An error occurred processing your request. Please try again.", which will be displayed in the `FormErrorSummary`.
- **User Enumeration Prevention**: On a successful API call, the view will *always* display a generic success message: "If an account with that email exists, we've sent a password reset link. Please check your email." This ensures that it's impossible to determine whether an email is registered with the service from the UI response.

## 11. Implementation Steps
1.  **Create Custom Hook**: Implement the `useForgotPassword` hook (`src/hooks/useForgotPassword.ts`) to manage state (`isLoading`, `isSuccess`, `error`) and contain the API call logic using `authService`.
2.  **Create View Component**: Create the `ForgotPasswordView.tsx` file in `src/views/auth/`. This component will use the `useForgotPassword` hook and render child components.
3.  **Create Form Component**: Create the `ForgotPasswordForm.tsx` component. It will manage the form's local state (e.g., using `react-hook-form`) and perform validation.
4.  **Add Routing**: Add a new route for `/forgot-password` in the main router configuration (`App.tsx` or similar), pointing to the `ForgotPasswordView` component.
5.  **Update Login View**: Add a link on the `LoginView` that navigates to `/forgot-password`.
6.  **API Service Function**: Add a `forgotPassword` function to `src/services/authService.ts` that makes the `POST` request to `/api/auth/forgot-password`.
7.  **Create Types**: Define the `ForgotPasswordRequestDto` and `ForgotPasswordFormViewModel` in a relevant types file (e.g., `src/types/auth.ts`).
8.  **Styling**: Style all new components using Tailwind CSS according to the application's design system.
9.  **Testing**: Write unit/integration tests for the `useForgotPassword` hook and the `ForgotPasswordView` to cover form submission, validation, success, and error states.
