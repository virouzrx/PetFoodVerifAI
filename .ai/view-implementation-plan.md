# API Endpoint Implementation Plan: POST /register

## 1. Endpoint Overview
This document outlines the implementation plan for the `POST /register` endpoint. The purpose of this endpoint is to allow new users to create an account in the system by providing their email and a password. Upon successful registration, the endpoint will return the newly created user's unique identifier and a JWT authentication token.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/api/auth/register`
- **Parameters**:
  - **Required**: None in URL.
  - **Optional**: None.
- **Request Body**: The request body must be a JSON object with the following structure:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```

## 3. Used Types
The following Data Transfer Objects (DTOs) will be used for this endpoint. They should be created in the `DTOs/AuthDtos.cs` file.

- **Request DTO (`RegisterDto`)**:
  ```csharp
  public class RegisterDto
  {
      [Required]
      [EmailAddress]
      public string Email { get; set; }

      [Required]
      [StringLength(100, ErrorMessage = "The {0} must be at least {2} and at max {1} characters long.", MinimumLength = 8)]
      public string Password { get; set; }
  }
  ```

- **Response DTO (`AuthResponseDto`)**:
  ```csharp
  public class AuthResponseDto
  {
      public string UserId { get; set; }
      public string Token { get; set; }
  }
  ```

## 4. Response Details
- **Success Response (Code `201 Created`)**:
  ```json
  {
    "userId": "some-unique-user-id",
    "token": "generated-jwt-token"
  }
  ```
- **Error Responses**:
  - **Code `400 Bad Request`**: Returned for validation errors (e.g., invalid email, weak password). The response body should contain details about the validation errors.
  - **Code `409 Conflict`**: Returned when the email is already registered.
  - **Code `500 Internal Server Error`**: Returned for unexpected server-side errors.

## 5. Data Flow
1.  A `POST` request containing the user's email and password is sent to the `/api/auth/register` endpoint.
2.  The `AuthController` receives the request.
3.  The controller validates the request body using the `RegisterDto`. If validation fails, it returns a `400 Bad Request` response.
4.  The controller calls the `RegisterAsync` method on the `IAuthService`.
5.  The `AuthService` uses ASP.NET Identity's `UserManager<IdentityUser>` to create a new user. It will set both the `UserName` and `Email` properties of the new user object to the email address from the request.
6.  The `UserManager` validates the email and password against the configured identity policies and hashes the password.
7.  If a user with the email already exists, `UserManager` returns a failure result. `AuthService` catches this and returns a result indicating a conflict.
8.  If the user is created successfully, the `AuthService` generates a JWT token for the new user.
9.  The `AuthService` returns the new user's ID and the JWT token to the `AuthController`.
10. The `AuthController` wraps this data in an `AuthResponseDto` and returns a `201 Created` response with the DTO as the body.

## 6. Security Considerations
- **Authentication**: This endpoint is for creating new users and does not require prior authentication.
- **Authorization**: No specific roles are required to access this endpoint.
- **Data Validation**: Rigorous validation will be applied to the request body using Data Annotations on the `RegisterDto` to prevent invalid data from being processed.
- **Password Hashing**: ASP.NET Identity will automatically handle the hashing and salting of user passwords. Passwords will not be stored in plain text.
- **JWT Security**: The JWT signing key will be stored securely using the .NET configuration system (e.g., `appsettings.json` for development, Azure Key Vault for production). The token will have a limited expiration time.
- **Transport Security**: The application should be configured to use HTTPS to ensure that all data is encrypted in transit.

## 7. Performance Considerations
- The registration process involves a database write operation and password hashing, which are computationally intensive. Under normal load, this should be fast.
- To prevent abuse and potential denial-of-service attacks, rate limiting should be considered for this endpoint in the future.

## 8. Implementation Steps
1.  **Create Controller Directory**: Create a new directory named `Controllers` in the root of the `PetFoodVerifAI` project.
2.  **Define DTOs**: Create/update the `RegisterDto` and `AuthResponseDto` classes inside `PetFoodVerifAI/DTOs/AuthDtos.cs`.
3.  **Create Service Interface**: Create a new file `Services/IAuthService.cs` and define the `IAuthService` interface with a `RegisterAsync` method.
4.  **Implement Service**: Create the `Services/AuthService.cs` file and implement the `IAuthService` interface. This service will contain the core logic for user registration and token generation. It will be injected with `UserManager<IdentityUser>` and `IConfiguration`. Note: When creating the `IdentityUser`, set both the `UserName` and `Email` fields to the email from the DTO.
5.  **Configure JWT**: Add JWT settings (Key, Issuer, Audience) to `appsettings.json`.
6.  **Register Services**: In `Program.cs`, register the `IAuthService` and `AuthService` for dependency injection. Also, configure JWT Bearer authentication.
7.  **Create Controller**: Create `Controllers/AuthController.cs`. This controller will have a single endpoint, `POST /register`.
8.  **Implement Endpoint**: Implement the `Register` action in `AuthController`. It will take `RegisterDto` as a parameter, call the `AuthService`, and handle the responses based on the service result (success, conflict, or validation error).
9.  **Unit & Integration Testing**: Create tests to verify the registration logic, including success cases, validation errors, and handling of existing users.
