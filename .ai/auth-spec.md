# Authentication Module - Technical Specification

## 1. Overview

This document outlines the technical architecture for the user authentication module of the Pet Food Analyzer application. The implementation will be based on User Stories US-001 and US-002 from the Product Requirements Document (`prd.md`). The system will use ASP.NET Core Identity on the backend and a React frontend.

## 2. User Interface Architecture

The frontend will be responsible for presenting registration and login interfaces, managing user sessions, and protecting routes. Since `FR-01` states there is no guest access, all application routes, except for authentication pages, will be protected.

### 2.1. Pages & Layouts

*   **`/login` (React View):**
    *   **Description:** Publicly accessible page for user login. It will serve as the default entry point for unauthenticated users.
    *   **Components:** Renders the `LoginForm` React component.
    *   **Layout:** Uses `AuthLayout`.

*   **`/register` (React View):**
    *   **Description:** Publicly accessible page for new user registration.
    *   **Components:** Renders the `RegisterForm` React component.
    *   **Layout:** Uses `AuthLayout`.

*   **`/forgot-password` (React View):**
    *   **Description:** Publicly accessible page for password recovery. Users can request a password reset email.
    *   **Components:** Renders the `ForgotPasswordForm` React component.
    *   **Layout:** Uses `AuthLayout`.

*   **`/reset-password` (React View):**
    *   **Description:** Publicly accessible page for resetting password using a token received via email.
    *   **Components:** Implements `ResetPasswordView` component with three states: invalid link error, form, and success confirmation.
    *   **Layout:** Standalone centered layout with brand styling.
    *   **URL Parameters:** Expects `email` and `token` query parameters from the email link (e.g., `/reset-password?email=user@example.com&token=ABC123`).
    *   **Implementation:** Uses `useResetPassword` custom hook for API integration and state management.

*   **`AuthLayout` (React Layout Component):**
    *   **Description:** A simple layout for authentication pages (`/login`, `/register`). It will feature the application logo and a clean, centered container for the forms. It will not contain authenticated user navigation elements like "My Products" or "Logout".

*   **`AppLayout` (React Layout Component):**
    *   **Description:** The main layout for the authenticated application. It will wrap all protected pages.
    *   **Logic:** This layout will contain logic to check for a valid authentication token. If the user is not authenticated, it will redirect them to the `/login` page.
    *   **Elements:** Includes the main navigation bar with links to the "Analysis" page, "My Products" page, and a "Logout" button.

### 2.2. React Components & Hooks

**Custom Hooks:**

*   **`useResetPassword` Hook:**
    *   **Location:** `frontend/src/hooks/useResetPassword.ts`
    *   **Purpose:** Manages the password reset API call, loading state, error handling, and success state.
    *   **Returns:**
        *   `submitResetPassword(values)`: Function to submit password reset request
        *   `isLoading`: Boolean loading state
        *   `error`: FieldErrorMap with error messages
        *   `clearError()`: Function to clear errors
        *   `isSuccess`: Boolean success state
    *   **Features:**
        *   Minimum loading duration (600ms) for smooth UX
        *   Request cancellation to prevent race conditions
        *   Email normalization (trim + lowercase)
        *   Token trimming
        *   Comprehensive error handling (400, 429, generic errors)
    *   **Implementation:** Uses `resetPassword()` service function to call backend API

*   **`useForgotPassword` Hook:**
    *   **Location:** `frontend/src/hooks/useForgotPassword.ts`
    *   **Purpose:** Manages the forgot password API call and state.
    *   **Similar pattern to `useResetPassword` with appropriate endpoints**

*   **`usePasswordStrength` Hook:**
    *   **Location:** `frontend/src/hooks/usePasswordStrength.ts`
    *   **Purpose:** Calculates real-time password strength based on 5 criteria
    *   **Returns:** `{ score: 0-4, checks: { minLength8, hasUpper, hasLower, hasDigit, hasSpecial } }`

**Components:**

*   **`RegisterForm` Component:**
    *   **Responsibility:** Manages the state and logic for the user registration form.
    *   **State:** `email`, `password`, `confirmPassword`, `isLoading`, `error`.
    *   **Actions:**
        *   Handles form input changes.
        *   Performs client-side validation on submit.
        *   Makes a `POST` request to the `/api/auth/register` endpoint.
        *   On success: Stores the received authentication token, redirects the user to the main analysis page.
        *   On failure: Displays an error message received from the API.
    *   **UI:** A form with fields for Email, Password, Confirm Password, and a "Register" button.

*   **`LoginForm` Component:**
    *   **Responsibility:** Manages the state and logic for the user login form.
    *   **State:** `email`, `password`, `isLoading`, `error`.
    *   **Actions:**
        *   Handles form input changes.
        *   Performs client-side validation on submit.
        *   Makes a `POST` request to the `/api/auth/login` endpoint.
        *   On success: Stores the received authentication token, redirects the user to the main analysis page.
        *   On failure: Displays an error message.
    *   **UI:** A form with fields for Email, Password, and a "Login" button. Includes links to the `/register` page and `/forgot-password` page.

*   **`ForgotPasswordView` Component:**
    *   **Responsibility:** Manages the state and logic for the forgot password form.
    *   **Implementation:** Uses `useForgotPassword` custom hook.
    *   **State:** `email`, form validation, loading state, error state, success state.
    *   **Actions:**
        *   Handles email input changes with real-time validation.
        *   Performs client-side validation on submit.
        *   Makes a `POST` request to the `/api/auth/forgot-password` endpoint via `forgotPassword()` service function.
        *   On success: Displays success message informing the user to check their email (always shows success to prevent user enumeration).
        *   On failure: Displays validation error messages.
    *   **UI:** A form with an Email field and a "Send Reset Link" button. Includes a link back to the `/login` page. Shows success state with checkmark icon when email is sent.

*   **`ResetPasswordView` Component:**
    *   **Responsibility:** Manages the complete password reset flow with three distinct UI states.
    *   **Implementation:** Uses `useResetPassword` custom hook and `usePasswordStrength` for real-time password validation.
    *   **State Management:**
        *   Form values: `email`, `token`, `newPassword`
        *   Form validation with touched field tracking
        *   Loading state, error state, success state
        *   Password visibility toggle
    *   **Three UI States:**
        1. **Invalid Link State:** Displayed when `email` or `token` query parameters are missing. Shows error icon, message, and links to request new reset link or return to login.
        2. **Form State:** Active form for password reset with:
           - Email field (read-only, pre-filled from URL)
           - New password field with show/hide toggle
           - Real-time password strength indicator with visual meter
           - Submit button with loading state
        3. **Success State:** Confirmation screen with success icon, message, and "Sign in" button link.
    *   **Actions:**
        *   Extracts `email` and `token` from URL query parameters using `useSearchParams`.
        *   Handles password input changes with real-time validation.
        *   Performs comprehensive client-side validation (email format, token presence, password strength).
        *   Makes a `POST` request to the `/api/auth/reset-password` endpoint via `resetPassword()` service function.
        *   On success: Displays success message with link to login (no automatic redirect).
        *   On failure: Displays error message (e.g., invalid/expired token, weak password).
    *   **Password Validation:**
        *   Minimum 8 characters
        *   Contains uppercase letter
        *   Contains lowercase letter
        *   Contains digit
        *   Contains special character
        *   Real-time visual feedback via `PasswordStrengthHint` component
    *   **UI Components:**
        *   Email input (read-only, gray background)
        *   Password input with show/hide toggle button
        *   `PasswordStrengthHint` component showing 5 criteria with progress bar
        *   `SubmitButton` component with loading spinner
        *   `GlobalAlert` component for error messages
        *   Responsive design with brand colors (brand-secondary, brand-primary, brand-dark)

### 2.3. Frontend API Service Layer

**Location:** `frontend/src/services/authService.ts`

The frontend uses a centralized service layer for all authentication-related API calls:

*   **`resetPassword(payload: ResetPasswordRequestDto): Promise<void>`**
    *   **Purpose:** Sends password reset request to backend
    *   **Endpoint:** `POST /api/auth/reset-password`
    *   **Payload:** `{ email, token, newPassword }`
    *   **Response:** Empty on success (200 OK)
    *   **Error Handling:** Throws `ApiErrorResponse` with status code and error details
    *   **Credentials:** `omit` (public endpoint)

*   **`forgotPassword(payload: ForgotPasswordRequestDto): Promise<void>`**
    *   **Purpose:** Sends forgot password request to backend
    *   **Endpoint:** `POST /api/auth/forgot-password`
    *   **Payload:** `{ email }`
    *   **Response:** Empty on success (200 OK)
    *   **Error Handling:** Throws `ApiErrorResponse` with status code and error details
    *   **Credentials:** `omit` (public endpoint)

*   **`parseErrorResponse(response: Response): Promise<ApiErrorResponse>`**
    *   **Purpose:** Unified error parsing for all API calls
    *   **Returns:** Structured error object with status, message, and errors array
    *   **Used by:** All API service functions for consistent error handling

**TypeScript Types:**

*   **`ResetPasswordRequestDto`:** `{ email: string, token: string, newPassword: string }`
*   **`ForgotPasswordRequestDto`:** `{ email: string }`
*   **`ApiErrorResponse`:** `{ status: number, message?: string, errors?: ApiErrorField[] }`
*   **`FieldErrorMap`:** `{ email?: string, password?: string, newPassword?: string, token?: string, form?: string }`

### 2.3.1. Frontend Routing Configuration

**Location:** `frontend/src/App.tsx`

The application uses React Router for client-side routing:

**Public Routes (Wrapped in `RedirectIfAuthenticated`):**
*   `/` - Landing view
*   `/login` - Login view
*   `/register` - Register view
*   `/verify-email` - Email verification view
*   `/forgot-password` - Forgot password view
*   `/reset-password` - Reset password view (with query params: `?email=...&token=...`)

**Protected Routes (Wrapped in `AuthenticatedShell`):**
*   `/analyze` - Main analysis view
*   `/results/:analysisId` - Analysis results view
*   `/products` - My products view

**Redirect Logic:**
*   `RedirectIfAuthenticated` component checks authentication state and redirects authenticated users from public routes to `/analyze`
*   `AuthenticatedShell` component checks authentication state and redirects unauthenticated users to `/login`

**Implementation Details:**
*   Uses `react-router-dom` v6
*   All public auth routes use eager loading
*   Protected routes use lazy loading with `React.lazy()` and `Suspense`
*   404 handling with catch-all route redirecting to `/404`

### 2.4. Validation and Error Messages

Client-side validation will provide immediate feedback to the user.

*   **Email:**
    *   Required: "Email is required."
    *   Format: "Please enter a valid email address."
*   **Password (Registration):**
    *   Required: "Password is required."
    *   Minimum Length (e.g., 8 characters): "Password must be at least 8 characters long."
    *   Complexity (e.g., uppercase, lowercase, number, special character): "Password must contain an uppercase letter, a lowercase letter, a number, and a special character."
*   **Confirm Password:**
    *   Required: "Please confirm your password."
    *   Match: "Passwords do not match."
*   **Password Reset Token:**
    *   Invalid/Expired: "Invalid or expired password reset token. Please request a new reset link."
    *   Missing: "Password reset token is required."
*   **API Errors:**
    *   A generic error component will display messages returned from the backend (e.g., "An account with this email already exists.", "Invalid email or password.").
*   **Password Reset Success Messages:**
    *   Forgot Password: "If an account with that email exists, we've sent a password reset link. Please check your email."
    *   Reset Password: "Your password has been successfully reset. You can now sign in with your new password."

*   **Password Reset Error Messages:**
    *   Invalid Link: "The password reset link is invalid or incomplete. Please request a new password reset link."
    *   Invalid Token: "Invalid or expired password reset token."
    *   Missing Token: "Reset token is missing."
    *   Generic Error: "Unable to process your request. Please try again later."
    *   Rate Limit: "Too many attempts. Please wait and try again."

### 2.5. Scenarios

*   **Unauthenticated User Access:**
    1.  User navigates to a protected page (e.g., `/`).
    2.  `AppLayout` (React layout component) detects no valid auth token.
    3.  User is redirected to `/login`.

*   **Successful Registration (US-001):**
    1.  User visits `/register`.
    2.  Fills out the `RegisterForm` with valid data and submits.
    3.  `RegisterForm` component sends data to `/api/auth/register`.
    4.  Backend creates the user and returns a JWT.
    5.  The JWT is stored securely in the browser (e.g., `localStorage` or a secure cookie).
    6.  User is redirected to the main analysis page, now logged in.

*   **Successful Login (US-002):**
    1.  User visits `/login`.
    2.  Fills out the `LoginForm` with correct credentials and submits.
    3.  `LoginForm` component sends data to `/api/auth/login`.
    4.  Backend validates credentials and returns a JWT.
    5.  The JWT is stored.
    6.  User is redirected to the main analysis page.

*   **Failed Login (US-002):**
    1.  User submits `LoginForm` with incorrect credentials.
    2.  Backend returns a 401 Unauthorized error with a message.
    3.  `LoginForm` displays the error message "Invalid email or password." above the form. The user remains on the `/login` page.

*   **Forgot Password Flow:**
    1.  User visits `/login` and clicks "Forgot Password?" link.
    2.  User is redirected to `/forgot-password`.
    3.  User enters their email address and submits the form.
    4.  `ForgotPasswordForm` component sends data to `/api/auth/forgot-password`.
    5.  Backend generates a secure password reset token and sends an email with a reset link (if user exists).
    6.  Frontend always displays success message: "If an account with that email exists, we've sent a password reset link. Please check your email." (prevents user enumeration).
    7.  User checks email and clicks the reset link containing the token.
    8.  User is redirected to `/reset-password?email=user@example.com&token=ABC123`.

*   **Reset Password Flow:**
    1.  User arrives at `/reset-password` from email link (with email and token in URL, e.g., `/reset-password?email=user@example.com&token=ABC123`).
    2.  `ResetPasswordView` extracts email and token from URL query parameters using `useSearchParams`.
    3.  **If email or token is missing:** Component displays "Invalid reset link" error state with options to request new link or return to login.
    4.  **If email and token present:** Component displays form with:
        - Pre-filled email field (read-only)
        - New password input field (with show/hide toggle)
        - Real-time password strength indicator
    5.  User enters their new password.
    6.  Password strength is validated in real-time and displayed visually.
    7.  User submits form.
    8.  `useResetPassword` hook validates all fields client-side.
    9.  If validation passes, hook sends `POST` request to `/api/auth/reset-password` via `resetPassword()` service function with email, token, and new password.
    10. Backend validates token and updates password.
    11. On success: User sees success state with checkmark icon, confirmation message, and "Sign in" button link (no automatic redirect).
    12. On failure: User sees error message (e.g., "Invalid or expired password reset token") in dismissible alert at top of form.

*   **Failed Password Reset:**
    1.  User submits form with an expired or invalid token.
    2.  Backend returns 400 Bad Request error.
    3.  `useResetPassword` hook catches error and sets error state.
    4.  `ResetPasswordView` displays error message in `GlobalAlert` component.
    5.  User remains on form and can attempt again or click "Back to sign in" link.

*   **Missing Reset Link Parameters:**
    1.  User navigates to `/reset-password` without `email` or `token` query parameters.
    2.  `ResetPasswordView` detects missing parameters.
    3.  Component displays "Invalid reset link" error state with:
        - Error icon
        - Explanation message
        - "Request new reset link" button (navigates to `/forgot-password`)
        - "Back to sign in" link (navigates to `/login`)

## 3. Backend Logic

The backend will expose a set of RESTful API endpoints for authentication, leveraging ASP.NET Core Identity.

### 3.1. API Endpoints

All endpoints will be under the `/api/auth` route.

*   **`POST /api/auth/register`**
    *   **Description:** Registers a new user.
    *   **Request Body:** `RegisterRequestDto`
    *   **Response (Success - 200 OK):** `AuthResponseDto` (containing JWT and user info)
    *   **Response (Failure - 400 Bad Request):** Validation error object (e.g., if email is invalid or passwords don't match).
    *   **Response (Failure - 409 Conflict):** Error message if the email is already in use.

*   **`POST /api/auth/login`**
    *   **Description:** Authenticates a user and returns a token.
    *   **Request Body:** `LoginRequestDto`
    *   **Response (Success - 200 OK):** `AuthResponseDto`
    *   **Response (Failure - 401 Unauthorized):** Error message for invalid credentials.

*   **`POST /api/auth/logout`**
    *   **Description:** Logs out the user. While JWT is stateless, this endpoint can be used to manage token blocklists if needed. For a simple implementation, the frontend will just clear the token. This endpoint is a good practice placeholder.
    *   **Authentication:** Requires a valid JWT.
    *   **Response (Success - 200 OK):** Confirmation message.

*   **`POST /api/auth/forgot-password`**
    *   **Description:** Initiates the password reset process by sending a reset email to the user.
    *   **Authentication:** None required (public endpoint).
    *   **Request Body:** `ForgotPasswordRequestDto`
    *   **Response (Success - 200 OK):** Empty body (always returns success to prevent user enumeration).
    *   **Response (Failure - 400 Bad Request):** Validation error object for invalid email format.
    *   **Security Note:** Always returns 200 OK regardless of whether the email exists in the system to prevent user enumeration attacks.

*   **`POST /api/auth/reset-password`**
    *   **Description:** Resets a user's password using the token from the forgot-password email.
    *   **Authentication:** None required (public endpoint, security enforced via token).
    *   **Request Body:** `ResetPasswordRequestDto`
    *   **Response (Success - 200 OK):** Empty body.
    *   **Response (Failure - 400 Bad Request):** Error object with details (invalid token, weak password, validation errors, etc.).

### 3.2. Data Models (Contracts / DTOs)

These models define the data structure for API communication.

*   **`RegisterRequestDto.cs`**
    ```csharp
    public class RegisterRequestDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required, Compare("Password")]
        public string ConfirmPassword { get; set; }
    }
    ```

*   **`LoginRequestDto.cs`**
    ```csharp
    public class LoginRequestDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
    ```

*   **`AuthResponseDto.cs`**
    ```csharp
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public UserDto User { get; set; }
    }
    ```

*   **`UserDto.cs`**
    ```csharp
    public class UserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
    }
    ```

*   **`ForgotPasswordRequestDto.cs`**
    ```csharp
    public class ForgotPasswordRequestDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
        public string Email { get; set; } = string.Empty;
    }
    ```

*   **`ResetPasswordRequestDto.cs`**
    ```csharp
    public class ResetPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; } = string.Empty;
    }
    ```

### 3.3. Input Data Validation

*   Validation will be performed using .NET's built-in `[ApiController]` attribute, which automatically triggers model state validation.
*   Data Annotations (`[Required]`, `[EmailAddress]`, etc.) on DTOs will enforce rules.
*   Invalid requests will automatically result in a 400 Bad Request response with a detailed error object.

### 3.4. Exception Handling

*   A custom exception handling middleware will be implemented.
*   It will catch unhandled exceptions and format them into a consistent JSON error response.
*   **`400 Bad Request`:** For validation errors or business logic failures (e.g., trying to register an existing email, handled via a specific response, maybe 409).
*   **`401 Unauthorized`:** For failed login attempts or access to protected resources without a valid token.
*   **`403 Forbidden`:** If role-based access is introduced later.
*   **`500 Internal Server Error`:** For unexpected server-side errors, with details logged but not exposed to the client.

## 4. Authentication System (ASP.NET Identity)

### 4.1. Core Components

*   **`IdentityUser`:** The default ASP.NET Identity user class will be used. It can be extended with custom properties if needed in the future (e.g., `FirstName`, `LastName`), but for now, it's sufficient.
*   **`AppDbContext`:** The application's Entity Framework `DbContext` will inherit from `IdentityDbContext<IdentityUser>` to include all necessary Identity tables (Users, Roles, Claims, etc.).
*   **`UserManager<IdentityUser>`:** The primary service for managing users (creating, deleting, finding, managing passwords).
*   **`SignInManager<IdentityUser>`:** The primary service for handling user sign-in and sign-out operations.

### 4.2. Configuration

*   **`Program.cs` / `Startup.cs`:**
    *   ASP.NET Identity will be configured with `AddIdentity<IdentityUser, IdentityRole>()`.
    *   It will be linked to the PostgreSQL database via Entity Framework Core (`AddEntityFrameworkStores<AppDbContext>()`).
    *   Password requirements (length, complexity) will be configured in the Identity options to match frontend validation.
    *   User options will be configured to require a unique email address.

### 4.3. Authentication Scheme

*   **JWT (JSON Web Tokens):** The application will use JWT for authentication.
*   **Configuration:** The JWT bearer authentication scheme will be configured. This includes setting the issuer, audience, and the secret key (stored securely in `appsettings.json` or user secrets).
*   **Token Generation:** A dedicated `TokenService` will be created. Upon successful login or registration, this service will generate a signed JWT containing user claims (like user ID and email).
*   **API Protection:** The `[Authorize]` attribute will be used on controllers or specific endpoints that require authentication. The JWT bearer middleware will validate the token on each request to these endpoints.

### 4.4. Password Recovery

Although not specified in the initial user stories, password recovery is a standard feature for production applications.

#### 4.4.1. Forgot Password Flow

**Endpoint:** `POST /api/auth/forgot-password`

**Process:**
1. Receives email address from user
2. Normalizes email (lowercase, trim whitespace)
3. Looks up user in database using `UserManager.FindByEmailAsync()`
4. If user not found: Logs informational message and returns success (security best practice)
5. If user found:
   - Generates cryptographically secure token using `UserManager.GeneratePasswordResetTokenAsync()`
   - Constructs password reset link: `{AppUrl}/reset-password?email={email}&token={urlEncodedToken}`
   - Sends email via `IEmailService` with reset link
   - If email fails: Logs error but still returns success to client
6. Always returns 200 OK to prevent user enumeration

**Security Considerations:**
- **User Enumeration Prevention:** Always returns 200 OK regardless of email existence
- **Token Security:** Tokens are data protection tokens (encrypted and signed by ASP.NET Identity)
- **Token Expiration:** Configurable lifetime (typically 24 hours)
- **Single-Use Tokens:** Token invalidated after successful password reset (security stamp changes)
- **Rate Limiting (Future):** Should implement per-IP and per-email rate limits to prevent abuse

**Email Service Requirements:**
- Interface: `IEmailService.SendPasswordResetEmailAsync(email, token, resetLink)`
- Email should contain:
  - Clear subject line: "Password Reset Request"
  - User-friendly explanation
  - Clickable reset link button
  - Plain text link as backup
  - Token expiration notice (24 hours)
  - Security notice ("If you didn't request this, ignore it")
  - Support contact information

**Error Handling:**
- Invalid email format → 400 Bad Request with validation errors
- User not found → 200 OK (logged internally, not exposed)
- Email service failure → 200 OK (logged as error internally)
- Database/critical errors → 500 Internal Server Error

#### 4.4.2. Reset Password Flow

**Endpoint:** `POST /api/auth/reset-password`

**Process:**
1. Receives email, token, and new password from user
2. Finds user by email using `UserManager.FindByEmailAsync()`
3. If user not found: Returns generic error (security best practice)
4. URL-decodes token if necessary
5. Validates token and resets password using `UserManager.ResetPasswordAsync(user, token, newPassword)`
6. ASP.NET Identity validates:
   - Token format and signature
   - Token hasn't expired
   - Token is associated with this user
   - Password meets strength requirements
7. If validation succeeds:
   - Hashes new password (PBKDF2 with salt)
   - Updates password hash in database
   - Updates security stamp (invalidates all tokens/sessions for this user)
   - Commits transaction
8. Returns appropriate response

**Security Considerations:**
- **Token Validation:** ASP.NET Identity ensures token integrity and expiration
- **Email-Token Binding:** Token must match the user account
- **Password Security:** Passwords hashed with PBKDF2, never stored in plaintext
- **Session Invalidation:** Security stamp update invalidates existing sessions/tokens
- **Generic Error Messages:** Don't reveal if user exists or if token is specifically invalid

**Token Configuration:**
Configure in `Program.cs`:
```csharp
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(24);
});
```

**Error Handling:**
- Invalid email format → 400 Bad Request
- Missing required fields → 400 Bad Request
- Weak password → 400 Bad Request with password requirements
- Invalid/expired token → 400 Bad Request with generic message
- User not found → 400 Bad Request with generic message (prevent enumeration)
- Database/critical errors → 500 Internal Server Error

**Password Strength Requirements:**
Configured in Identity options to match frontend validation:
- Minimum length (e.g., 8 characters)
- Requires uppercase letter
- Requires lowercase letter
- Requires digit
- Requires special character (optional, configurable)

#### 4.4.3. Service Layer

**IAuthService Interface Updates:**
```csharp
Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request);
Task<AuthResultDto> ResetPasswordAsync(ResetPasswordRequestDto request);
```

**IEmailService Interface:**
```csharp
Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink);
```

#### 4.4.4. Configuration Requirements

**appsettings.json:**
```json
{
  "AppUrl": "http://localhost:5173",
  "Jwt": {
    "SecretKey": "...",
    "Issuer": "...",
    "Audience": "..."
  }
}
```

**Note:** `AppUrl` should be set to the production frontend URL in production environment.

---

## 5. Implementation Status

### 5.1. Frontend Implementation

**✅ Completed Components:**

*   **`ResetPasswordView`** (`frontend/src/views/reset-password/ResetPasswordView.tsx`)
    *   Three-state UI (invalid link, form, success)
    *   URL query parameter extraction
    *   Real-time password strength validation
    *   Comprehensive error handling
    *   Accessibility features (ARIA labels, focus management)
    *   Design system compliance

*   **`ForgotPasswordView`** (`frontend/src/views/forgot-password/ForgotPasswordView.tsx`)
    *   Email form with validation
    *   Success state with security-conscious messaging
    *   Error handling

*   **`LoginView`** (`frontend/src/views/login/LoginView.tsx`)
    *   Includes "Forgot password?" link to `/forgot-password`
    *   Email and password validation
    *   Google OAuth integration

**✅ Completed Hooks:**

*   **`useResetPassword`** (`frontend/src/hooks/useResetPassword.ts`)
    *   API integration
    *   Loading state management (600ms minimum)
    *   Request cancellation handling
    *   Error normalization
    *   Success state tracking

*   **`useForgotPassword`** (`frontend/src/hooks/useForgotPassword.ts`)
    *   Similar pattern to `useResetPassword`
    *   Optimized user experience

*   **`usePasswordStrength`** (`frontend/src/hooks/usePasswordStrength.ts`)
    *   Real-time password strength calculation
    *   5 criteria validation

**✅ Completed Services:**

*   **`resetPassword()`** (`frontend/src/services/authService.ts`)
    *   POST request to `/api/auth/reset-password`
    *   Error parsing
    *   TypeScript type safety

*   **`forgotPassword()`** (`frontend/src/services/authService.ts`)
    *   POST request to `/api/auth/forgot-password`
    *   Error parsing

**✅ Completed Types:**

*   **`ResetPasswordRequestDto`** (`frontend/src/types/auth.ts`)
*   **`ForgotPasswordRequestDto`** (`frontend/src/types/auth.ts`)
*   **Extended `FieldErrorMap`** to support password reset fields

**✅ Completed Routing:**

*   `/reset-password` route configured in `App.tsx`
*   `/forgot-password` route configured in `App.tsx`
*   Both routes wrapped in `RedirectIfAuthenticated`

**✅ Completed Shared Components Used:**

*   `PasswordStrengthHint` - Visual password strength feedback
*   `SubmitButton` - Reusable button with loading state
*   `GlobalAlert` - Dismissible error/success alerts

### 5.2. Backend Implementation

**Implementation Status:** Backend components need to be verified/implemented according to the specification.

**Required Backend Components:**

1. **DTOs:**
   - `ResetPasswordRequestDto` with validation attributes
   - `ForgotPasswordRequestDto` with validation attributes

2. **Controller Endpoints:**
   - `POST /api/auth/reset-password` endpoint in `AuthController`
   - `POST /api/auth/forgot-password` endpoint in `AuthController`

3. **Service Layer:**
   - `ResetPasswordAsync()` method in `AuthService`
   - `ForgotPasswordAsync()` method in `AuthService`
   - `IAuthService` interface updates

4. **Email Service:**
   - `IEmailService` with `SendPasswordResetEmailAsync()` method
   - Implementation (e.g., `ResendEmailService` or SMTP service)

5. **Configuration:**
   - Token lifetime configuration (24 hours recommended)
   - AppUrl configuration for generating reset links
   - Email service configuration (API keys, SMTP settings)

### 5.3. Testing Checklist

**Frontend Testing:**

- [x] URL parameter extraction works correctly
- [x] Invalid link state displays when parameters missing
- [x] Form state displays when parameters present
- [x] Password strength indicator updates in real-time
- [x] Client-side validation prevents invalid submissions
- [x] Loading states display during API calls
- [x] Success state displays after successful reset
- [x] Error states display with appropriate messages
- [x] Links navigate correctly (forgot password, login)
- [x] Design system compliance verified
- [x] Accessibility features working (ARIA, focus management)

**Integration Testing Required:**

- [ ] End-to-end flow: forgot password → email → reset → login
- [ ] Token validation (valid, invalid, expired)
- [ ] Password strength enforcement (backend and frontend match)
- [ ] Email delivery and link format
- [ ] Error handling for all scenarios
- [ ] Rate limiting (if implemented)

### 5.4. Files Created/Modified

**Created:**
- `frontend/src/views/reset-password/ResetPasswordView.tsx`
- `frontend/src/hooks/useResetPassword.ts`

**Modified:**
- `frontend/src/types/auth.ts` - Added `ResetPasswordRequestDto`, extended `FieldErrorMap`
- `frontend/src/services/authService.ts` - Added `resetPassword()` function
- `frontend/src/App.tsx` - Added `/reset-password` route
- `frontend/src/views/login/LoginView.tsx` - Added `Link` import (bug fix)

### 5.5. Next Steps

1. **Verify Backend Implementation:**
   - Ensure all backend endpoints match specification
   - Test token generation and validation
   - Verify email service integration

2. **End-to-End Testing:**
   - Test complete password reset flow
   - Verify email delivery with correct reset link format
   - Test token expiration behavior

3. **Production Considerations:**
   - Configure production AppUrl
   - Set up production email service
   - Implement rate limiting
   - Configure token lifetime
   - Set up monitoring and logging
   - Security audit of token handling

4. **Documentation:**
   - Update API documentation
   - Create user-facing help documentation
   - Document troubleshooting steps for common issues
