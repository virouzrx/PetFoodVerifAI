using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using PetFoodVerifAI.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetFoodVerifAI.Services
{
    public class AuthService(
        UserManager<IdentityUser> userManager,
        IConfiguration configuration,
        SignInManager<IdentityUser> signInManager,
        IEmailService emailService) : IAuthService
    {
        private readonly UserManager<IdentityUser> _userManager = userManager;
        private readonly IConfiguration _configuration = configuration;
        private readonly SignInManager<IdentityUser> _signInManager = signInManager;
        private readonly IEmailService _emailService = emailService;

        public async Task<AuthResultDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email);
            if (user == null)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "Invalid credentials" } } };
            }

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "Email not confirmed. Please verify your email first." } } };
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginRequest.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "Invalid credentials" } } };
            }

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email!,
                    Token = token,
                    EmailConfirmed = user.EmailConfirmed
                }
            };
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto registerDto)
        {
            var user = new IdentityUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                EmailConfirmed = false
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                return new AuthResultDto
                {
                    Succeeded = false,
                    Errors = result.Errors
                };
            }

            // Generate verification token
            var verificationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // Set token expiration time (24 hours)
            var expiresAt = DateTime.UtcNow.AddHours(24);

            // Build verification link (frontend will construct this)
            var verificationLink = $"{_configuration["AppUrl"]}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(verificationToken)}";

            // Send verification email
            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email, verificationToken, verificationLink);
            }
            catch (Exception ex)
            {
                // Log error but don't fail registration
                System.Diagnostics.Debug.WriteLine($"Email sending failed: {ex.Message}");
            }

            // Return response WITHOUT JWT token - user must verify email first
            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Token = string.Empty, // No token until verified
                    EmailConfirmed = false
                }
            };
        }

        public async Task<AuthResultDto> ConfirmEmailAsync(VerifyEmailRequestDto verifyRequest)
        {
            var user = await _userManager.FindByIdAsync(verifyRequest.UserId);
            if (user == null)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "User not found" } } };
            }

            // URL-decode the token in case it arrives URL-encoded
            var decodedToken = Uri.UnescapeDataString(verifyRequest.VerificationToken);
            
            // Check if SecurityStamp looks like a token (corruption from old code)
            // This handles users created with the old buggy code that stored the token as SecurityStamp
            bool securityStampIsCorrupted = user.SecurityStamp == decodedToken || user.SecurityStamp == verifyRequest.VerificationToken;
            if (securityStampIsCorrupted)
            {
                // Regenerate a proper security stamp
                await _userManager.UpdateSecurityStampAsync(user);
            }

            // Verify the token
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
            {
                // Try with the raw token if decode didn't help
                if (decodedToken != verifyRequest.VerificationToken)
                {
                    result = await _userManager.ConfirmEmailAsync(user, verifyRequest.VerificationToken);
                }
                
                if (!result.Succeeded)
                {
                    return new AuthResultDto
                    {
                        Succeeded = false,
                        Errors = result.Errors.Any() ? result.Errors : new[] { new IdentityError { Description = "Invalid or expired verification token" } }
                    };
                }
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email!,
                    EmailConfirmed = user.EmailConfirmed,
                    Token = token
                }
            };
        }

        public async Task<AuthResultDto> ResendVerificationEmailAsync(ResendVerificationEmailDto resendRequest)
        {
            var user = await _userManager.FindByEmailAsync(resendRequest.Email);
            if (user == null)
            {
                // Don't reveal if email exists
                return new AuthResultDto
                {
                    Succeeded = true,
                    Response = new AuthResponseDto { }
                };
            }

            // If already confirmed, return success
            if (user.EmailConfirmed)
            {
                return new AuthResultDto
                {
                    Succeeded = true,
                    Response = new AuthResponseDto { Email = user.Email ?? "" }
                };
            }

            // Generate new verification token
            var verificationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // Build verification link
            var verificationLink = $"{_configuration["AppUrl"]}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(verificationToken)}";

            // Send verification email
            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email ?? "", verificationToken, verificationLink);
            }
            catch (Exception ex)
            {
                return new AuthResultDto
                {
                    Succeeded = false,
                    Errors = new[] { new IdentityError { Description = $"Failed to send email: {ex.Message}" } }
                };
            }

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email ?? ""
                }
            };
        }

        private string GenerateJwtToken(IdentityUser user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"]));

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<AuthResultDto> GoogleLoginAsync(GoogleLoginRequestDto googleRequest)
        {
            try
            {
                // Use Google's tokeninfo endpoint to validate the access token
                var googleClientId = _configuration["Google:ClientId"];
                
                using (var httpClient = new HttpClient())
                {
                    var tokenInfoUrl = $"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={Uri.EscapeDataString(googleRequest.GoogleToken)}";
                    
                    try
                    {
                        var response = await httpClient.GetAsync(tokenInfoUrl);
                        
                        if (!response.IsSuccessStatusCode)
                        {
                            return new AuthResultDto 
                            { 
                                Succeeded = false, 
                                Errors = new[] { new IdentityError { Description = "Invalid or expired Google token" } } 
                            };
                        }

                        var jsonContent = await response.Content.ReadAsStringAsync();
                        using (var document = System.Text.Json.JsonDocument.Parse(jsonContent))
                        {
                            var root = document.RootElement;
                            
                            // Validate that the token is for our app
                            if (root.TryGetProperty("issued_to", out var issuedTo))
                            {
                                if (issuedTo.GetString() != googleClientId)
                                {
                                    return new AuthResultDto 
                                    { 
                                        Succeeded = false, 
                                        Errors = new[] { new IdentityError { Description = "Google token is not for this application" } } 
                                    };
                                }
                            }

                            // Get the user's email from their profile
                            // Note: Access tokens don't contain claims; we need a separate call or use ID token
                            // For now, we'll need to get the user info from Google's userinfo endpoint
                            var userInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo";
                            var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, userInfoUrl);
                            userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", googleRequest.GoogleToken);
                            
                            var userInfoResponse = await httpClient.SendAsync(userInfoRequest);
                            if (!userInfoResponse.IsSuccessStatusCode)
                            {
                                return new AuthResultDto 
                                { 
                                    Succeeded = false, 
                                    Errors = new[] { new IdentityError { Description = "Failed to retrieve user information from Google" } } 
                                };
                            }

                            var userInfoContent = await userInfoResponse.Content.ReadAsStringAsync();
                            using (var userInfoDoc = System.Text.Json.JsonDocument.Parse(userInfoContent))
                            {
                                var userRoot = userInfoDoc.RootElement;
                                
                                if (!userRoot.TryGetProperty("email", out var emailElement))
                                {
                                    return new AuthResultDto 
                                    { 
                                        Succeeded = false, 
                                        Errors = new[] { new IdentityError { Description = "Could not retrieve email from Google profile" } } 
                                    };
                                }

                                var email = emailElement.GetString();
                                if (string.IsNullOrEmpty(email))
                                {
                                    return new AuthResultDto 
                                    { 
                                        Succeeded = false, 
                                        Errors = new[] { new IdentityError { Description = "Email is empty in Google profile" } } 
                                    };
                                }

                                // Find or create user
                                var user = await _userManager.FindByEmailAsync(email);
                                if (user == null)
                                {
                                    // Create new user with verified email
                                    user = new IdentityUser
                                    {
                                        UserName = email,
                                        Email = email,
                                        EmailConfirmed = true // Email is verified through Google
                                    };

                                    var result = await _userManager.CreateAsync(user);
                                    if (!result.Succeeded)
                                    {
                                        return new AuthResultDto 
                                        { 
                                            Succeeded = false, 
                                            Errors = result.Errors 
                                        };
                                    }
                                }
                                else if (!user.EmailConfirmed)
                                {
                                    // Auto-confirm email if user exists but email wasn't confirmed
                                    user.EmailConfirmed = true;
                                    await _userManager.UpdateAsync(user);
                                }

                                // Generate JWT token
                                var jwtToken = GenerateJwtToken(user);

                                return new AuthResultDto
                                {
                                    Succeeded = true,
                                    Response = new AuthResponseDto
                                    {
                                        UserId = user.Id,
                                        Email = user.Email!,
                                        Token = jwtToken,
                                        EmailConfirmed = user.EmailConfirmed
                                    }
                                };
                            }
                        }
                    }
                    catch (HttpRequestException)
                    {
                        return new AuthResultDto 
                        { 
                            Succeeded = false, 
                            Errors = new[] { new IdentityError { Description = "Failed to validate Google token. Please check your connection and try again." } } 
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                return new AuthResultDto 
                { 
                    Succeeded = false, 
                    Errors = new[] { new IdentityError { Description = $"Google login failed: {ex.Message}" } } 
                };
            }
        }
    }
}
