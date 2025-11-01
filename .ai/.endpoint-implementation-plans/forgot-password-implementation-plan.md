# API Endpoint Implementation Plan: POST /api/auth/forgot-password

## 1. Endpoint Overview

The `POST /api/auth/forgot-password` endpoint initiates the password reset process for a user account. When a user provides their email address, the system generates a secure password reset token and sends it to the user's email. This endpoint implements critical security measures to prevent user enumeration attacks by always returning a success response, regardless of whether the email exists in the system.

**Key Characteristics:**
- Publicly accessible (no authentication required)
- Stateless operation
- Security-focused design preventing user enumeration
- Triggers asynchronous email sending
- Always returns success to the client

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/forgot-password`
- **Content-Type**: `application/json`
- **Authentication**: None required (public endpoint)

### Parameters

#### Required:
- `email` (string): The email address of the user requesting a password reset
  - Must be a valid email format
  - Case-insensitive matching
  - Maximum length: 256 characters (standard email length)

#### Optional:
- None

### Request Body Example:
```json
{
  "email": "user@example.com"
}
```

### Validation Rules:
- `email`: Required, must match valid email address pattern (validated via `[EmailAddress]` attribute)

## 3. Used Types

### DTOs to Create

#### ForgotPasswordRequestDto
```csharp
public class ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
    public string Email { get; set; } = string.Empty;
}
```

### DTOs Already Existing
- **AuthResultDto**: Not used (endpoint returns empty response)
- **AuthResponseDto**: Not used (endpoint returns empty response)

### Service Interface Update

Update `IAuthService` interface to include:
```csharp
Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request);
```

## 4. Response Details

### Success Response (200 OK)
- **Status Code**: 200 OK
- **Body**: Empty (no content)
- **Headers**: Standard response headers

### Error Responses

#### 400 Bad Request
- **When**: Invalid email format or missing required fields
- **Body**:
```json
{
  "errors": {
    "Email": ["Invalid email format"]
  }
}
```

#### 500 Internal Server Error
- **When**: Catastrophic server failure (should be extremely rare)
- **Body**: Generic error message
- **Note**: Most internal errors (email service failure, etc.) should still return 200 OK to prevent enumeration

### Response Examples

**Success (Email Found and Sent):**
```
HTTP/1.1 200 OK
Content-Length: 0
```

**Success (Email Not Found - Still Returns Success):**
```
HTTP/1.1 200 OK
Content-Length: 0
```

**Invalid Email Format:**
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": {
    "Email": ["Invalid email format"]
  }
}
```

## 5. Data Flow

### High-Level Flow
1. Client sends POST request with email address
2. Controller validates request model
3. If validation fails → Return 400 Bad Request
4. Controller calls `AuthService.ForgotPasswordAsync(request)`
5. AuthService attempts to find user by email
6. **If user not found:**
   - Log informational message (not an error)
   - Return success to controller
7. **If user found:**
   - Generate password reset token using `UserManager.GeneratePasswordResetTokenAsync()`
   - Construct password reset link (frontend URL + token)
   - Attempt to send email via `IEmailService`
   - If email fails: Log error but still return success
   - Return success to controller
8. Controller returns 200 OK with empty body
9. Client receives success response

### Detailed Service Logic Flow

```
ForgotPasswordAsync(ForgotPasswordRequestDto request)
│
├─→ var user = await _userManager.FindByEmailAsync(request.Email)
│
├─→ if (user == null)
│   ├─→ _logger.LogInformation("Password reset requested for non-existent email")
│   └─→ return true (success)
│
├─→ var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user)
│
├─→ var resetLink = $"{_configuration["AppUrl"]}/reset-password?email={email}&token={encodedToken}"
│
├─→ try
│   ├─→ await _emailService.SendPasswordResetEmailAsync(email, resetToken, resetLink)
│   └─→ _logger.LogInformation("Password reset email sent successfully")
│
└─→ catch (Exception ex)
    ├─→ _logger.LogError(ex, "Failed to send password reset email")
    └─→ still return true (success)
```

### Email Template Content
The password reset email should include:
- Clear subject line: "Password Reset Request"
- User-friendly explanation
- Password reset link (clickable button/link)
- Token expiration notice (typically 24 hours)
- Security notice (ignore if not requested)
- Support contact information

## 6. Security Considerations

### Critical Security Requirements

#### 1. User Enumeration Prevention
**Threat**: Attackers could determine which email addresses are registered by observing different responses.

**Mitigation**:
- Always return 200 OK regardless of whether the email exists
- Never reveal in the response whether an email was found
- Use identical response times (consider adding small random delay if needed)
- Log user lookup results internally but don't expose them

#### 2. Token Security
**Threat**: Weak or predictable tokens could be exploited.

**Mitigation**:
- Use ASP.NET Identity's `GeneratePasswordResetTokenAsync()` (cryptographically secure)
- Tokens are one-time use only
- Tokens expire after configured time (default 24 hours)
- Tokens are invalidated after successful password reset
- URL-encode tokens before sending in email links

#### 3. Email Bombing / DoS
**Threat**: Attackers could abuse the endpoint to spam users with reset emails.

**Mitigation** (Future Enhancements):
- Implement rate limiting per IP address
- Implement rate limiting per email address
- Add CAPTCHA for suspicious traffic patterns
- Log excessive requests for monitoring

#### 4. Token Storage
**Threat**: Tokens could be intercepted or exposed.

**Mitigation**:
- Never log tokens (except in encrypted debug logs)
- Use HTTPS to transmit tokens
- Tokens stored as hashed values in database by ASP.NET Identity
- Include token in URL parameter (not in request body for reset)

#### 5. Information Disclosure
**Threat**: Error messages could leak sensitive information.

**Mitigation**:
- Generic error messages for email sending failures
- Detailed errors only in server logs
- No stack traces in production responses

### Authentication & Authorization
- **Authentication**: None required (public endpoint)
- **Authorization**: None required
- **Note**: The actual password reset endpoint will require the valid token

### Data Validation
- Email format validation at controller level
- Email normalization (lowercase, trim whitespace)
- Maximum length validation (prevent buffer overflow attempts)

## 7. Error Handling

### Error Scenarios and Status Codes

| Scenario | HTTP Status | Client Response | Internal Action |
|----------|-------------|-----------------|-----------------|
| Email format invalid | 400 Bad Request | Validation error details | None |
| Email field missing | 400 Bad Request | Validation error details | None |
| User not found | 200 OK | Empty body (success) | Log info message |
| Email service failure | 200 OK | Empty body (success) | Log error with details |
| Token generation failure | 200 OK | Empty body (success) | Log critical error |
| Database connection failure | 500 Internal Server Error | Generic error | Log critical error |
| Configuration missing (AppUrl) | 500 Internal Server Error | Generic error | Log critical error |

### Logging Strategy

#### Information Level
- Password reset requested for existing user
- Password reset requested for non-existent email
- Password reset email sent successfully

#### Error Level
- Email service failure (with exception details)
- Token generation failure
- Configuration errors

#### Critical Level
- Database connection failures
- Repeated failures indicating system issues

### Exception Handling in Service

```csharp
try
{
    // Find user and send email
}
catch (EmailServiceException ex)
{
    _logger.LogError(ex, "Failed to send password reset email to {Email}", request.Email);
    // Still return success to prevent enumeration
    return true;
}
catch (Exception ex)
{
    _logger.LogCritical(ex, "Unexpected error in ForgotPasswordAsync");
    // Rethrow for controller to handle as 500 error
    throw;
}
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Email Service Latency**: External email service calls can be slow (1-5 seconds)
   - **Optimization**: Consider async/fire-and-forget pattern with background job queue
   - **Current**: Acceptable for MVP, user expects delay

2. **Database User Lookup**: Email-based user search
   - **Optimization**: Ensure index exists on AspNetUsers.NormalizedEmail (default in Identity)
   - **Performance**: Should be < 10ms with proper indexing

3. **Token Generation**: Cryptographic operations for token generation
   - **Optimization**: ASP.NET Identity handles this efficiently
   - **Performance**: Typically < 50ms

4. **Rate Limiting**: Without rate limiting, endpoint could be abused
   - **Future Enhancement**: Implement rate limiting middleware
   - **Target**: Max 3 requests per email per 15 minutes

### Optimization Strategies

#### Immediate (MVP):
- Use indexed email lookups (default in ASP.NET Identity)
- Async/await pattern throughout
- Connection pooling for database (configured in Program.cs)

#### Future Enhancements:
- Background job queue for email sending (e.g., Hangfire)
- Redis cache for rate limiting
- Database query optimization if needed

### Expected Performance Metrics
- **Response Time**: < 3 seconds (including email send)
- **Database Queries**: 1 query (user lookup)
- **External Calls**: 1 call (email service)

## 9. Implementation Steps

### Step 1: Create DTO
**File**: `PetFoodVerifAI/DTOs/AuthDtos.cs`

Add the following DTO to the existing file:
```csharp
public class ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
    public string Email { get; set; } = string.Empty;
}
```

### Step 2: Update IEmailService Interface
**File**: `PetFoodVerifAI/Services/IEmailService.cs`

Add new method signature:
```csharp
/// <summary>
/// Sends a password reset email to the specified email address
/// </summary>
/// <param name="email">Recipient email address</param>
/// <param name="resetToken">Password reset token</param>
/// <param name="resetLink">Full reset link to include in email</param>
/// <returns>Task representing the asynchronous operation</returns>
Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink);
```

### Step 3: Implement Email Service Method
**File**: `PetFoodVerifAI/Services/ResendEmailService.cs` (or whichever email service implementation is being used)

Implement the `SendPasswordResetEmailAsync` method:
```csharp
public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
{
    var subject = "Password Reset Request - PetFoodVerifAI";
    
    var htmlBody = $@"
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <h2>Password Reset Request</h2>
            <p>You recently requested to reset your password for your PetFoodVerifAI account.</p>
            <p>Click the button below to reset your password:</p>
            <p>
                <a href='{resetLink}' 
                   style='display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                          color: white; text-decoration: none; border-radius: 4px;'>
                    Reset Password
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style='word-break: break-all;'>{resetLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you did not request a password reset, please ignore this email or contact support.</p>
            <hr>
            <p style='color: #666; font-size: 12px;'>
                This is an automated email from PetFoodVerifAI. Please do not reply.
            </p>
        </body>
        </html>
    ";

    await SendEmailAsync(email, subject, htmlBody);
}
```

### Step 4: Update IAuthService Interface
**File**: `PetFoodVerifAI/Services/IAuthService.cs`

Add new method signature:
```csharp
Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request);
```

### Step 5: Implement Service Method
**File**: `PetFoodVerifAI/Services/AuthService.cs`

Add the implementation:
```csharp
public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request)
{
    try
    {
        // Normalize email for lookup
        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        
        // Find user by email
        var user = await _userManager.FindByEmailAsync(normalizedEmail);
        
        // If user doesn't exist, log and return success (prevent enumeration)
        if (user == null)
        {
            // Log at Information level - not an error
            System.Diagnostics.Debug.WriteLine($"Password reset requested for non-existent email: {normalizedEmail}");
            return true;
        }
        
        // Generate password reset token
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        // Build password reset link
        var encodedToken = Uri.EscapeDataString(resetToken);
        var encodedEmail = Uri.EscapeDataString(user.Email ?? "");
        var resetLink = $"{_configuration["AppUrl"]}/reset-password?email={encodedEmail}&token={encodedToken}";
        
        // Send password reset email
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email ?? "", resetToken, resetLink);
            System.Diagnostics.Debug.WriteLine($"Password reset email sent successfully to {normalizedEmail}");
        }
        catch (Exception ex)
        {
            // Log error but still return success to prevent enumeration
            System.Diagnostics.Debug.WriteLine($"Failed to send password reset email: {ex.Message}");
        }
        
        return true;
    }
    catch (Exception ex)
    {
        // Log critical error
        System.Diagnostics.Debug.WriteLine($"Critical error in ForgotPasswordAsync: {ex.Message}");
        // Rethrow to let controller handle as 500 error
        throw;
    }
}
```

### Step 6: Add Controller Endpoint
**File**: `PetFoodVerifAI/Controllers/AuthController.cs`

Add new endpoint method:
```csharp
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
{
    // Validate model state
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    try
    {
        // Call service to initiate password reset
        await _authService.ForgotPasswordAsync(request);
        
        // Always return 200 OK (even if email doesn't exist - prevents enumeration)
        return Ok();
    }
    catch (Exception ex)
    {
        // Log critical error
        System.Diagnostics.Debug.WriteLine($"Critical error in ForgotPassword endpoint: {ex.Message}");
        
        // Return generic error (don't expose details)
        return StatusCode(500, new { message = "An error occurred processing your request" });
    }
}
```

### Step 7: Update Configuration (if needed)
**File**: `PetFoodVerifAI/appsettings.json` and `PetFoodVerifAI/appsettings.Development.json`

Ensure `AppUrl` is configured:
```json
{
  "AppUrl": "http://localhost:5173",
  ...
}
```

For production, set appropriate production URL.

### Step 8: Testing

#### Unit Tests to Create:
1. **AuthService.ForgotPasswordAsync Tests**:
   - Test with existing user email → Token generated and email sent
   - Test with non-existent user email → Returns success without sending email
   - Test with invalid email service → Returns success despite email failure
   - Test with null user manager → Throws exception

2. **Controller Tests**:
   - Test with valid email format → Returns 200 OK
   - Test with invalid email format → Returns 400 Bad Request
   - Test with missing email → Returns 400 Bad Request
   - Test service exception → Returns 500 Internal Server Error

#### Manual Testing:
1. Test with registered email address → Check email received
2. Test with unregistered email address → Verify 200 OK response (no email sent)
3. Test with malformed email → Verify 400 Bad Request
4. Test email link → Verify it contains correct parameters
5. Test with email service down → Verify still returns 200 OK

### Step 9: Documentation
- Update API documentation to include new endpoint
- Add endpoint to Swagger/OpenAPI specification
- Document security considerations
- Add example requests/responses

### Step 10: Security Review
- Verify user enumeration prevention
- Test rate limiting (if implemented)
- Review logging (ensure no sensitive data logged)
- Verify HTTPS enforcement
- Test token security and expiration

---

## Additional Considerations

### Related Endpoints
This endpoint is part of the password reset flow. The related endpoints are:
- `POST /api/auth/reset-password`: Actually resets the password using the token
- `POST /api/auth/login`: Users will use this after successful password reset

### Future Enhancements
1. **Rate Limiting**: Implement per-IP and per-email rate limits
2. **CAPTCHA**: Add CAPTCHA for suspected bot traffic
3. **Audit Trail**: Log all password reset attempts for security monitoring
4. **Multi-language Support**: Send emails in user's preferred language
5. **SMS Option**: Offer SMS as alternative to email
6. **Background Jobs**: Move email sending to background queue for better performance

### Migration Requirements
No database migration required. This endpoint uses existing ASP.NET Identity infrastructure.

### Deployment Checklist
- [ ] Ensure AppUrl is configured for production environment
- [ ] Verify email service credentials are set in production
- [ ] Test email delivery in production environment
- [ ] Set up monitoring for email failures
- [ ] Configure rate limiting (if available)
- [ ] Verify HTTPS is enforced
- [ ] Test complete password reset flow end-to-end

