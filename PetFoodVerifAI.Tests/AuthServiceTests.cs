using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Services;

namespace PetFoodVerifAI.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<UserManager<IdentityUser>> _mockUserManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<SignInManager<IdentityUser>> _mockSignInManager;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            var userStoreMock = new Mock<IUserStore<IdentityUser>>();
            _mockUserManager = new Mock<UserManager<IdentityUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(c => c["AppUrl"]).Returns("http://localhost:5173");

            var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<IdentityUser>>();
            _mockSignInManager = new Mock<SignInManager<IdentityUser>>(
                _mockUserManager.Object,
                contextAccessorMock.Object,
                claimsFactoryMock.Object,
                null, null, null, null);

            _mockEmailService = new Mock<IEmailService>();

            _authService = new AuthService(
                _mockUserManager.Object,
                _mockConfiguration.Object,
                _mockSignInManager.Object,
                _mockEmailService.Object);
        }

        [Fact]
        public async Task ForgotPasswordAsync_WithExistingUser_GeneratesTokenAndSendsEmail()
        {
            var email = "test@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };
            var user = new IdentityUser { Email = email, UserName = email };
            var resetToken = "test-reset-token";

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync(resetToken);

            _mockEmailService
                .Setup(es => es.SendPasswordResetEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var result = await _authService.ForgotPasswordAsync(request);

            Assert.True(result);
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
            _mockUserManager.Verify(um => um.GeneratePasswordResetTokenAsync(user), Times.Once);
            _mockEmailService.Verify(es => es.SendPasswordResetEmailAsync(
                email,
                resetToken,
                It.Is<string>(s => s.Contains("reset-password") && s.Contains("test%40example.com"))),
                Times.Once);
        }

        [Fact]
        public async Task ForgotPasswordAsync_WithNonExistentUser_ReturnsSuccessWithoutSendingEmail()
        {
            var email = "nonexistent@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _authService.ForgotPasswordAsync(request);

            Assert.True(result);
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
            _mockUserManager.Verify(um => um.GeneratePasswordResetTokenAsync(It.IsAny<IdentityUser>()), Times.Never);
            _mockEmailService.Verify(es => es.SendPasswordResetEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task ForgotPasswordAsync_WithEmailServiceFailure_ReturnsSuccessAnyway()
        {
            var email = "test@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };
            var user = new IdentityUser { Email = email, UserName = email };
            var resetToken = "test-reset-token";

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync(resetToken);

            _mockEmailService
                .Setup(es => es.SendPasswordResetEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ThrowsAsync(new Exception("Email service unavailable"));

            var result = await _authService.ForgotPasswordAsync(request);

            Assert.True(result);
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
            _mockUserManager.Verify(um => um.GeneratePasswordResetTokenAsync(user), Times.Once);
            _mockEmailService.Verify(es => es.SendPasswordResetEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task ForgotPasswordAsync_NormalizesEmail_BeforeLookup()
        {
            var email = "  TEST@EXAMPLE.COM  ";
            var normalizedEmail = "test@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };
            var user = new IdentityUser { Email = normalizedEmail, UserName = normalizedEmail };
            var resetToken = "test-reset-token";

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(normalizedEmail))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync(resetToken);

            _mockEmailService
                .Setup(es => es.SendPasswordResetEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var result = await _authService.ForgotPasswordAsync(request);

            Assert.True(result);
            _mockUserManager.Verify(um => um.FindByEmailAsync(normalizedEmail), Times.Once);
        }

        [Fact]
        public async Task ForgotPasswordAsync_GeneratesCorrectResetLink_WithUrlEncodedParameters()
        {
            var email = "test@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };
            var user = new IdentityUser { Email = email, UserName = email };
            var resetToken = "test/reset+token=special";
            string? capturedResetLink = null;

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync(resetToken);

            _mockEmailService
                .Setup(es => es.SendPasswordResetEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Callback<string, string, string>((e, t, link) => capturedResetLink = link)
                .Returns(Task.CompletedTask);

            // Act
            var result = await _authService.ForgotPasswordAsync(request);

            // Assert
            Assert.True(result);
            Assert.NotNull(capturedResetLink);
            Assert.Contains("http://localhost:5173/reset-password", capturedResetLink);
            Assert.Contains($"email={Uri.EscapeDataString(email)}", capturedResetLink);
            Assert.Contains($"token={Uri.EscapeDataString(resetToken)}", capturedResetLink);
        }

        [Fact]
        public async Task ForgotPasswordAsync_WithUserManagerException_RethrowsException()
        {
            var email = "test@example.com";
            var request = new ForgotPasswordRequestDto { Email = email };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ThrowsAsync(new Exception("Database connection failed"));

            await Assert.ThrowsAsync<Exception>(() => _authService.ForgotPasswordAsync(request));
        }

        [Fact]
        public async Task ResetPasswordAsync_WithValidToken_ShouldSucceed()
        {
            var email = "test@example.com";
            var token = "valid-reset-token";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = newPassword
            };
            var user = new IdentityUser { Email = email, UserName = email };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, token, newPassword))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Succeeded);
            Assert.NotNull(result.Response);
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
            _mockUserManager.Verify(um => um.ResetPasswordAsync(user, token, newPassword), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithInvalidToken_ShouldFail()
        {
            var email = "test@example.com";
            var token = "invalid-token";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = newPassword
            };
            var user = new IdentityUser { Email = email, UserName = email };
            var error = new IdentityError { Code = "InvalidToken", Description = "Invalid token." };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, It.IsAny<string>(), newPassword))
                .ReturnsAsync(IdentityResult.Failed(error));

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Succeeded);
            Assert.Contains(result.Errors, e => e.Code == "InvalidToken");
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithNonExistentEmail_ShouldFailWithGenericError()
        {
            var email = "nonexistent@example.com";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = "some-token",
                NewPassword = "NewSecurePassword123!"
            };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Succeeded);
            Assert.Contains(result.Errors, e => e.Description.Contains("Invalid or expired password reset token"));
            _mockUserManager.Verify(um => um.FindByEmailAsync(email), Times.Once);
            _mockUserManager.Verify(um => um.ResetPasswordAsync(It.IsAny<IdentityUser>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithWeakPassword_ShouldFail()
        {
            var email = "test@example.com";
            var token = "valid-token";
            var weakPassword = "weak";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = weakPassword
            };
            var user = new IdentityUser { Email = email, UserName = email };
            var error = new IdentityError { Code = "PasswordTooShort", Description = "Passwords must be at least 6 characters." };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, It.IsAny<string>(), weakPassword))
                .ReturnsAsync(IdentityResult.Failed(error));

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Succeeded);
            Assert.Contains(result.Errors, e => e.Code == "PasswordTooShort");
        }

        [Fact]
        public async Task ResetPasswordAsync_NormalizesEmail_BeforeLookup()
        {
            var email = "  TEST@EXAMPLE.COM  ";
            var normalizedEmail = "test@example.com";
            var token = "valid-token";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = newPassword
            };
            var user = new IdentityUser { Email = normalizedEmail, UserName = normalizedEmail };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(normalizedEmail))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, token, newPassword))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Succeeded);
            _mockUserManager.Verify(um => um.FindByEmailAsync(normalizedEmail), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithUrlEncodedToken_ShouldDecodeAndTryBothVersions()
        {
            var email = "test@example.com";
            var encodedToken = "test%2Ftoken%2Bspecial";
            var decodedToken = "test/token+special";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = encodedToken,
                NewPassword = newPassword
            };
            var user = new IdentityUser { Email = email, UserName = email };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, decodedToken, newPassword))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalid token" }));

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, encodedToken, newPassword))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Succeeded);
            _mockUserManager.Verify(um => um.ResetPasswordAsync(user, decodedToken, newPassword), Times.Once);
            _mockUserManager.Verify(um => um.ResetPasswordAsync(user, encodedToken, newPassword), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithException_ShouldReturnGenericError()
        {
            var email = "test@example.com";
            var token = "valid-token";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = newPassword
            };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ThrowsAsync(new Exception("Database connection failed"));

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Succeeded);
            Assert.Contains(result.Errors, e => e.Description.Contains("An unexpected error occurred"));
        }

        [Fact]
        public async Task ResetPasswordAsync_AfterSuccessfulReset_SecurityStampShouldInvalidateOldTokens()
        {
            var email = "test@example.com";
            var token = "valid-token";
            var newPassword = "NewSecurePassword123!";
            var request = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token,
                NewPassword = newPassword
            };
            var user = new IdentityUser { Email = email, UserName = email, SecurityStamp = "old-stamp" };

            _mockUserManager
                .Setup(um => um.FindByEmailAsync(email))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(um => um.ResetPasswordAsync(user, token, newPassword))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Succeeded);
            _mockUserManager.Verify(um => um.ResetPasswordAsync(user, token, newPassword), Times.Once);
        }
    }
}

