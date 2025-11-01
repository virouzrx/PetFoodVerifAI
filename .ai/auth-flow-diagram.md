# Authentication Flow Diagrams

## Overview
This document contains Mermaid diagrams illustrating the authentication flows for the PetFoodVerifAI application, based on the authentication specification and PRD.

---

## 1. User Registration Flow (US-001)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant RegisterView as RegisterView<br/>(React Component)
    participant AuthService as authService<br/>(Frontend)
    participant AuthController as AuthController<br/>(Backend API)
    participant AuthSvc as AuthService<br/>(Backend Service)
    participant UserMgr as UserManager<br/>(Identity)
    participant EmailSvc as EmailService
    participant DB as PostgreSQL<br/>(Database)
    
    User->>RegisterView: Enters email & password
    User->>RegisterView: Clicks "Register"
    
    RegisterView->>RegisterView: Validates input<br/>(client-side)
    
    RegisterView->>AuthService: POST /api/auth/register<br/>{email, password}
    
    AuthService->>AuthController: POST /api/auth/register
    AuthController->>AuthController: Validates ModelState
    
    AuthController->>AuthSvc: RegisterAsync(registerDto)
    
    AuthSvc->>UserMgr: CreateAsync(user, password)
    UserMgr->>UserMgr: Hashes password
    UserMgr->>DB: INSERT INTO AspNetUsers
    DB-->>UserMgr: User created
    
    UserMgr-->>AuthSvc: IdentityResult (Success)
    
    AuthSvc->>UserMgr: GenerateEmailConfirmationTokenAsync(user)
    UserMgr-->>AuthSvc: verificationToken
    
    AuthSvc->>AuthSvc: Build verification link<br/>(with token & userId)
    
    AuthSvc->>EmailSvc: SendVerificationEmailAsync(email, token, link)
    EmailSvc-->>AuthSvc: Email sent (async)
    
    AuthSvc-->>AuthController: AuthResultDto<br/>{Succeeded: true, EmailConfirmed: false}
    
    AuthController-->>AuthService: 201 Created<br/>{userId, email, token: empty}
    
    AuthService-->>RegisterView: Registration successful
    
    RegisterView->>RegisterView: Show "Check your email" message
    RegisterView->>User: Display verification instructions
    
    Note over User,DB: User must verify email before login
```

---

## 2. Email Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Email
    participant Browser
    participant VerifyView as VerificationView<br/>(React Component)
    participant AuthService as authService<br/>(Frontend)
    participant AuthController as AuthController<br/>(Backend API)
    participant AuthSvc as AuthService<br/>(Backend Service)
    participant UserMgr as UserManager<br/>(Identity)
    participant DB as PostgreSQL
    
    User->>Email: Opens verification email
    User->>Email: Clicks verification link
    
    Email->>Browser: Navigate to /verify-email?userId=...&token=...
    
    Browser->>VerifyView: Load with query params
    VerifyView->>VerifyView: Extract userId & token
    
    VerifyView->>AuthService: POST /api/auth/verify-email<br/>{userId, verificationToken}
    
    AuthService->>AuthController: POST /api/auth/verify-email
    AuthController->>AuthController: Validates ModelState
    
    AuthController->>AuthSvc: ConfirmEmailAsync(verifyRequest)
    
    AuthSvc->>UserMgr: FindByIdAsync(userId)
    UserMgr->>DB: SELECT FROM AspNetUsers
    DB-->>UserMgr: User data
    UserMgr-->>AuthSvc: IdentityUser
    
    AuthSvc->>UserMgr: ConfirmEmailAsync(user, token)
    UserMgr->>UserMgr: Validates token signature<br/>Checks expiration (24h)
    UserMgr->>DB: UPDATE AspNetUsers<br/>SET EmailConfirmed = true
    DB-->>UserMgr: Updated
    UserMgr-->>AuthSvc: IdentityResult (Success)
    
    AuthSvc->>AuthSvc: GenerateJwtToken(user)
    
    AuthSvc-->>AuthController: AuthResultDto<br/>{Token: "jwt...", EmailConfirmed: true}
    
    AuthController-->>AuthService: 200 OK<br/>{userId, email, token, emailConfirmed: true}
    
    AuthService-->>VerifyView: Verification successful + JWT
    
    VerifyView->>VerifyView: Stores JWT in localStorage
    VerifyView->>Browser: Redirect to /analyze
    
    Browser->>User: Displays analysis page
```

---

## 3. User Login Flow (US-002)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LoginView as LoginView<br/>(React Component)
    participant AuthService as authService<br/>(Frontend)
    participant AuthContext as AuthContext<br/>(React Context)
    participant AuthController as AuthController<br/>(Backend API)
    participant AuthSvc as AuthService<br/>(Backend Service)
    participant UserMgr as UserManager<br/>(Identity)
    participant SignInMgr as SignInManager<br/>(Identity)
    participant DB as PostgreSQL
    
    User->>LoginView: Enters email & password
    User->>LoginView: Clicks "Login"
    
    LoginView->>LoginView: Validates input<br/>(client-side)
    
    LoginView->>AuthService: POST /api/auth/login<br/>{email, password}
    
    AuthService->>AuthController: POST /api/auth/login
    AuthController->>AuthController: Validates ModelState
    
    AuthController->>AuthSvc: LoginAsync(loginRequest)
    
    AuthSvc->>UserMgr: FindByEmailAsync(email)
    UserMgr->>DB: SELECT FROM AspNetUsers
    DB-->>UserMgr: User data
    UserMgr-->>AuthSvc: IdentityUser
    
    alt Email not confirmed
        AuthSvc-->>AuthController: AuthResultDto<br/>{Succeeded: false, Error: "Email not confirmed"}
        AuthController-->>AuthService: 401 Unauthorized
        AuthService-->>LoginView: Error message
        LoginView->>User: "Please verify your email first"
    else Email is confirmed
        AuthSvc->>SignInMgr: CheckPasswordSignInAsync(user, password)
        SignInMgr->>SignInMgr: Verifies password hash
        
        alt Password valid
            SignInMgr-->>AuthSvc: SignInResult (Success)
            
            AuthSvc->>AuthSvc: GenerateJwtToken(user)<br/>(includes userId, email claims)
            
            AuthSvc-->>AuthController: AuthResultDto<br/>{Token: "jwt...", EmailConfirmed: true}
            
            AuthController-->>AuthService: 200 OK<br/>{userId, email, token}
            
            AuthService-->>LoginView: Login successful + JWT
            
            LoginView->>AuthContext: login(token, userId, email)
            AuthContext->>AuthContext: Stores in localStorage
            
            LoginView->>User: Redirect to /analyze
        else Password invalid
            SignInMgr-->>AuthSvc: SignInResult (Failed)
            AuthSvc-->>AuthController: AuthResultDto<br/>{Succeeded: false, Error: "Invalid credentials"}
            AuthController-->>AuthService: 401 Unauthorized
            AuthService-->>LoginView: Error message
            LoginView->>User: "Invalid email or password"
        end
    end
```

---

## 4. Forgot Password Flow (US-003 - Part 1)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant ForgotPwdView as ForgotPasswordView<br/>(React Component)
    participant AuthService as authService<br/>(Frontend)
    participant AuthController as AuthController<br/>(Backend API)
    participant AuthSvc as AuthService<br/>(Backend Service)
    participant UserMgr as UserManager<br/>(Identity)
    participant EmailSvc as EmailService
    participant DB as PostgreSQL
    
    User->>ForgotPwdView: Clicks "Forgot Password?" on login
    ForgotPwdView->>User: Displays email input form
    
    User->>ForgotPwdView: Enters email address
    User->>ForgotPwdView: Clicks "Send Reset Link"
    
    ForgotPwdView->>ForgotPwdView: Validates email format
    
    ForgotPwdView->>AuthService: POST /api/auth/forgot-password<br/>{email}
    
    AuthService->>AuthController: POST /api/auth/forgot-password
    AuthController->>AuthController: Validates ModelState
    
    AuthController->>AuthSvc: ForgotPasswordAsync(request)
    
    AuthSvc->>AuthSvc: Normalizes email<br/>(lowercase, trim)
    
    AuthSvc->>UserMgr: FindByEmailAsync(email)
    UserMgr->>DB: SELECT FROM AspNetUsers
    
    alt User exists
        DB-->>UserMgr: User data
        UserMgr-->>AuthSvc: IdentityUser
        
        AuthSvc->>UserMgr: GeneratePasswordResetTokenAsync(user)
        UserMgr-->>AuthSvc: resetToken<br/>(encrypted, signed, 24h expiry)
        
        AuthSvc->>AuthSvc: Build reset link<br/>/reset-password?email=...&token=...
        
        AuthSvc->>EmailSvc: SendPasswordResetEmailAsync(email, token, link)
        EmailSvc-->>AuthSvc: Email sent
        
        Note over AuthSvc: Logs success internally
    else User does not exist
        DB-->>UserMgr: NULL
        UserMgr-->>AuthSvc: NULL
        
        Note over AuthSvc: Logs info internally<br/>(no error to client)
    end
    
    AuthSvc-->>AuthController: Success (always)
    AuthController-->>AuthService: 200 OK (empty)
    AuthService-->>ForgotPwdView: Request processed
    
    ForgotPwdView->>User: "If account exists, check your email"<br/>(prevents user enumeration)
    
    Note over User,DB: Security: Always returns success<br/>regardless of email existence
```

---

## 5. Reset Password Flow (US-003 - Part 2)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Email
    participant Browser
    participant ResetPwdView as ResetPasswordView<br/>(React Component)
    participant AuthService as authService<br/>(Frontend)
    participant AuthController as AuthController<br/>(Backend API)
    participant AuthSvc as AuthService<br/>(Backend Service)
    participant UserMgr as UserManager<br/>(Identity)
    participant DB as PostgreSQL
    
    User->>Email: Opens password reset email
    User->>Email: Clicks reset link
    
    Email->>Browser: Navigate to /reset-password?email=...&token=...
    
    Browser->>ResetPwdView: Load with query params
    ResetPwdView->>ResetPwdView: Extract email & token
    
    User->>ResetPwdView: Enters new password
    User->>ResetPwdView: Confirms new password
    User->>ResetPwdView: Clicks "Reset Password"
    
    ResetPwdView->>ResetPwdView: Validates password<br/>(strength, matching)
    
    ResetPwdView->>AuthService: POST /api/auth/reset-password<br/>{email, token, newPassword}
    
    AuthService->>AuthController: POST /api/auth/reset-password
    AuthController->>AuthController: Validates ModelState
    
    AuthController->>AuthSvc: ResetPasswordAsync(request)
    
    AuthSvc->>UserMgr: FindByEmailAsync(email)
    UserMgr->>DB: SELECT FROM AspNetUsers
    
    alt User exists
        DB-->>UserMgr: User data
        UserMgr-->>AuthSvc: IdentityUser
        
        AuthSvc->>UserMgr: ResetPasswordAsync(user, token, newPassword)
        
        UserMgr->>UserMgr: Validates token signature
        UserMgr->>UserMgr: Checks token expiration (24h)
        UserMgr->>UserMgr: Validates password strength
        
        alt Token valid & password strong
            UserMgr->>UserMgr: Hashes new password (PBKDF2)
            UserMgr->>DB: UPDATE AspNetUsers<br/>SET PasswordHash, SecurityStamp
            DB-->>UserMgr: Updated
            
            Note over UserMgr: SecurityStamp change<br/>invalidates all existing tokens
            
            UserMgr-->>AuthSvc: IdentityResult (Success)
            AuthSvc-->>AuthController: Success
            
            AuthController-->>AuthService: 200 OK
            AuthService-->>ResetPwdView: Password reset successful
            
            ResetPwdView->>User: "Password reset successfully!"
            ResetPwdView->>Browser: Redirect to /login (after 3s)
        else Token invalid or expired
            UserMgr-->>AuthSvc: IdentityResult (Failed)
            AuthSvc-->>AuthController: Error
            
            AuthController-->>AuthService: 400 Bad Request<br/>"Invalid or expired token"
            AuthService-->>ResetPwdView: Error message
            
            ResetPwdView->>User: "Token expired. Request new reset link"
        end
    else User does not exist
        DB-->>UserMgr: NULL
        UserMgr-->>AuthSvc: NULL
        
        AuthSvc-->>AuthController: Generic error
        AuthController-->>AuthService: 400 Bad Request
        AuthService-->>ResetPwdView: Generic error message
        
        ResetPwdView->>User: "Reset failed. Request new link"
    end
```

---

## 6. Protected Route Access Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant AppRouter as React Router
    participant AuthShell as AuthenticatedShell<br/>(Layout)
    participant AuthContext as AuthContext
    participant ProtectedView as Protected View<br/>(e.g., AnalyzeView)
    
    User->>Browser: Navigates to /analyze
    
    Browser->>AppRouter: Route: /analyze
    AppRouter->>AuthShell: Render wrapper
    
    AuthShell->>AuthContext: Check isAuthenticated
    AuthContext->>AuthContext: Checks localStorage<br/>for valid JWT
    
    alt User authenticated (has valid token)
        AuthContext-->>AuthShell: isAuthenticated: true
        
        AuthShell->>ProtectedView: Render child route
        ProtectedView-->>User: Display analyze page
    else User not authenticated
        AuthContext-->>AuthShell: isAuthenticated: false
        
        AuthShell->>AppRouter: <Navigate to="/login" />
        AppRouter->>Browser: Redirect to /login
        
        Browser->>User: Display login page
    end
```

---

## 7. JWT Token Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant API as Backend API<br/>(Protected Endpoint)
    participant JwtMiddleware as JWT Bearer<br/>Middleware
    participant Controller as Protected<br/>Controller
    
    User->>Frontend: Performs action requiring API call
    
    Frontend->>Frontend: Retrieves JWT from localStorage
    
    Frontend->>API: API Request<br/>Header: Authorization: Bearer <token>
    
    API->>JwtMiddleware: Intercepts request
    
    JwtMiddleware->>JwtMiddleware: Extracts JWT from header
    JwtMiddleware->>JwtMiddleware: Validates signature<br/>(using secret key)
    JwtMiddleware->>JwtMiddleware: Checks expiration
    JwtMiddleware->>JwtMiddleware: Verifies issuer & audience
    
    alt Token valid
        JwtMiddleware->>JwtMiddleware: Extracts user claims<br/>(userId, email)
        JwtMiddleware->>Controller: Request proceeds<br/>(User authenticated)
        
        Controller->>Controller: Processes request<br/>(can access User.Identity)
        Controller-->>Frontend: Response data
        
        Frontend-->>User: Display result
    else Token invalid/expired
        JwtMiddleware-->>Frontend: 401 Unauthorized
        
        Frontend->>Frontend: Clear stored token
        Frontend->>User: Redirect to /login
    end
```

---

## 8. Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[User] -->|Interacts| B[Views]
        B --> C[LoginView]
        B --> D[RegisterView]
        B --> E[VerificationView]
        B --> F[ForgotPasswordView]
        B --> G[ResetPasswordView]
        B --> H[Protected Views]
        
        C -->|Uses| I[AuthContext]
        D -->|Uses| I
        E -->|Uses| I
        F -->|Uses| I
        G -->|Uses| I
        H -->|Protected by| I
        
        C -->|Calls| J[authService]
        D -->|Calls| J
        E -->|Calls| J
        F -->|Calls| J
        G -->|Calls| J
        H -->|Calls| J
        
        I -->|Stores| K[localStorage]
        K -->|JWT Token| I
    end
    
    subgraph "Backend (ASP.NET Core)"
        J -->|HTTP/REST| L[AuthController]
        
        L --> M[POST /api/auth/register]
        L --> N[POST /api/auth/login]
        L --> O[POST /api/auth/verify-email]
        L --> P[POST /api/auth/forgot-password]
        L --> Q[POST /api/auth/reset-password]
        
        M -->|Calls| R[AuthService]
        N -->|Calls| R
        O -->|Calls| R
        P -->|Calls| R
        Q -->|Calls| R
        
        R -->|Uses| S[UserManager]
        R -->|Uses| T[SignInManager]
        R -->|Uses| U[EmailService]
        R -->|Generates| V[JWT Tokens]
        
        S -->|Manages| W[ASP.NET Identity]
    end
    
    subgraph "Data Layer"
        W -->|EF Core| X[ApplicationDbContext]
        X -->|Queries| Y[(PostgreSQL Database)]
        Y --> Z[AspNetUsers Table]
    end
    
    subgraph "External Services"
        U -->|Sends| AA[Email Service<br/>Resend/SMTP]
    end
    
    style A fill:#e1f5ff
    style Y fill:#ffe1e1
    style AA fill:#fff4e1
```

---

## 9. Data Models Overview

```mermaid
classDiagram
    class RegisterDto {
        +string Email
        +string Password
    }
    
    class LoginRequestDto {
        +string Email
        +string Password
    }
    
    class AuthResponseDto {
        +string UserId
        +string Email
        +string Token
        +bool EmailConfirmed
    }
    
    class AuthResultDto {
        +bool Succeeded
        +AuthResponseDto Response
        +IEnumerable~IdentityError~ Errors
    }
    
    class VerifyEmailRequestDto {
        +string UserId
        +string VerificationToken
    }
    
    class ForgotPasswordRequestDto {
        +string Email
    }
    
    class ResetPasswordRequestDto {
        +string Email
        +string Token
        +string NewPassword
    }
    
    class IdentityUser {
        +string Id
        +string UserName
        +string Email
        +bool EmailConfirmed
        +string PasswordHash
        +string SecurityStamp
    }
    
    AuthResultDto --> AuthResponseDto : contains
    AuthResultDto --> IdentityError : contains list
```

---

## Security Considerations

### 1. Password Security
- All passwords hashed using PBKDF2 with salt (ASP.NET Identity default)
- Never stored or transmitted in plaintext
- Password strength requirements enforced

### 2. Token Security
- JWT tokens signed with secret key
- Tokens include expiration claims
- Email verification tokens are encrypted and signed
- Password reset tokens expire after 24 hours
- Single-use tokens (security stamp changes after use)

### 3. User Enumeration Prevention
- Forgot password endpoint always returns 200 OK
- Generic error messages for failed login
- No indication of whether email exists

### 4. Transport Security
- All endpoints must use HTTPS in production
- JWT transmitted in Authorization header

### 5. Rate Limiting (Recommended)
- Implement rate limiting for login attempts
- Implement rate limiting for forgot password requests
- Account lockout after failed login attempts

---

## Notes

- **US-001**: User Registration - Implemented with email verification requirement
- **US-002**: User Login - Implemented with email confirmation check
- **US-003**: Password Recovery - Specified but not yet implemented in current codebase
- All endpoints follow RESTful conventions
- Frontend uses React Router for navigation
- Authentication state managed via React Context
- JWT tokens stored in localStorage (consider httpOnly cookies for enhanced security)

