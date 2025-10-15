# API Endpoint Implementation Plan: POST /login

## 1. Endpoint Overview
This document outlines the implementation plan for the `POST /login` endpoint. Its purpose is to authenticate an existing user using their email and password. Upon successful authentication, it returns the user's ID and a JSON Web Token (JWT) for use in subsequent authenticated requests.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/login`
- **Request Body**: The request body should be a JSON object containing the user's email and password.
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```

## 3. Used Types
The following Data Transfer Objects (DTOs) will be created to handle the request and response data.

- **`LoginRequestDto.cs`**: To model the incoming request body.
  ```csharp
  using System.ComponentModel.DataAnnotations;

  public class LoginRequestDto
  {
      [Required]
      [EmailAddress]
      public string Email { get; set; }

      [Required]
      public string Password { get; set; }
  }
  ```

- **`LoginResponseDto.cs`**: To model the successful response body.
  ```csharp
  public class LoginResponseDto
  {
      public string UserId { get; set; }
      public string Token { get; set; }
  }
  ```

## 4. Response Details
- **Success Response (200 OK)**: Indicates that the user's credentials were valid. The response body will contain the user's ID and the JWT.
  ```json
  {
    "userId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - **400 Bad Request**: The request is malformed (e.g., missing fields, invalid email format).
  - **401 Unauthorized**: The provided credentials are invalid.

## 5. Data Flow
1. The client sends a `POST` request to `/login` with the user's email and password in the request body.
2. The `AuthController` receives the request. The ASP.NET Core framework automatically binds and validates the request body against the `LoginRequestDto`. If validation fails, it immediately returns a `400 Bad Request`.
3. The controller calls the `LoginAsync` method on the injected `IAuthService`, passing the DTO.
4. The `AuthService` uses ASP.NET Identity's `UserManager` to find the user by email.
5. If the user is found, the service uses `SignInManager`'s `CheckPasswordSignInAsync` method to validate the password.
6. If the password is valid, the `AuthService` generates a JWT containing claims for the user (e.g., user ID, email).
7. The service returns a result object containing the user ID and the generated token to the controller.
8. The controller maps the service result to a `LoginResponseDto` and returns a `200 OK` response.
9. If any step in the service fails (user not found, password invalid), it returns a failure result, which the controller translates into a `401 Unauthorized` response.

## 6. Security Considerations
- **Password Hashing**: All user passwords must be securely hashed and salted before being stored in the database. ASP.NET Identity handles this automatically.
- **Transport Security**: The endpoint must only be accessible via HTTPS to ensure credentials are encrypted in transit.
- **JWT Security**: The JWT will be signed using a strong, secret key stored securely in the application's configuration (`appsettings.json`). The key should not be checked into source control.
- **Account Lockout**: To prevent brute-force attacks, ASP.NET Identity's account lockout policy will be enabled. After a configured number of failed login attempts, the account will be temporarily locked.

## 7. Error Handling
- **Invalid Input (400)**: The controller's action method will be decorated with `[ApiController]`, which automatically triggers model state validation and returns a standardized `400 Bad Request` with validation details.
- **Invalid Credentials (401)**: If `AuthService.LoginAsync` fails due to an incorrect email or password, the controller will return an `IActionResult` representing a `401 Unauthorized` status. A generic error message ("Invalid credentials") should be used to avoid user enumeration.
- **Server Errors (500)**: Any unhandled exceptions within the controller or service will be caught by a global exception handler middleware, logged, and result in a generic `500 Internal Server Error` response.

## 8. Performance Considerations
The login process involves a database query to find the user. The `AspNetUsers` table should be indexed on the `NormalizedEmail` column to ensure this lookup is fast. ASP.NET Identity creates this index by default. The performance impact is expected to be minimal.

## 9. Implementation Steps
1.  **Create DTOs**: Create the `LoginRequestDto.cs` and `LoginResponseDto.cs` files in a new `PetFoodVerifAI/DTOs` directory.
2.  **Update Service Interface**: Add the `LoginAsync` method signature to the `IAuthService` interface.
    ```csharp
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginRequest);
    ```
3.  **Implement Service Logic**: Implement the `LoginAsync` method in `AuthService.cs`. This will involve injecting `UserManager<IdentityUser>` and `SignInManager<IdentityUser>`, finding the user, checking the password, and generating the JWT.
4.  **Configure JWT Authentication**: In `Program.cs`, add the necessary services and configuration for JWT bearer authentication, including specifying the signing key, issuer, and audience from `IConfiguration`.
5.  **Update Controller**: In `AuthController.cs`, add a new public endpoint method for `POST /login`.
6.  **Implement Endpoint**: The new method will accept `LoginRequestDto` as a parameter. It will call `IAuthService.LoginAsync`. Based on the result, it will return `Ok(response)` on success or `Unauthorized()` on failure.
7.  **Add Configuration**: Add JWT settings (secret key, issuer, audience) to `appsettings.Development.json` and `appsettings.json`. Ensure the secret key in `appsettings.json` is a placeholder and is managed via user secrets or another secure configuration provider in production.
8.  **Enable Account Lockout**: In `Program.cs`, configure the default Identity options to enable account lockout.
    ```csharp
    builder.Services.Configure<IdentityOptions>(options =>
    {
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
    });
    ```
