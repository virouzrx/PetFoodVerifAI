using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;
using System;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly IResend _resend;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendEmailService> _logger;

        public ResendEmailService(IResend resend, IConfiguration configuration, ILogger<ResendEmailService> logger)
        {
            _resend = resend;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendVerificationEmailAsync(string email, string verificationToken, string verificationLink)
        {
            var subject = "Verify Your Email - PetFoodVerifAI";
            var htmlBody = GenerateVerificationEmailHtml(email, verificationToken, verificationLink);
            await SendEmailAsync(email, subject, htmlBody);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
        {
            var subject = "Password Reset Request - PetFoodVerifAI";
            var htmlBody = GeneratePasswordResetEmailHtml(email, resetToken, resetLink);
            await SendEmailAsync(email, subject, htmlBody);
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var fromEmail = _configuration["Email:From"] ?? "@resend.dev";

                var response = await _resend.EmailSendAsync(new EmailMessage
                {
                    From = fromEmail,
                    To = to,
                    Subject = subject,
                    HtmlBody = body,
                });

                _logger.LogInformation($"Email sent successfully to {to} via Resend");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send email to {to}: {ex.Message}");
                throw;
            }
        }

        private string GenerateVerificationEmailHtml(string email, string verificationToken, string verificationLink)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #2c5f2d; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        .button {{ display: inline-block; background-color: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .code {{ background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 3px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to PetFoodVerifAI</h1>
        </div>
        <div class='content'>
            <p>Hi,</p>
            <p>Thank you for registering with PetFoodVerifAI! To complete your registration, please verify your email.</p>
            
            <p><strong>Verification Token:</strong></p>
            <div class='code'>{verificationToken}</div>
            
            <p><strong>Or click the link below:</strong></p>
            <a href='{verificationLink}' class='button'>Verify Email</a>
            
            <p>This link expires in 24 hours.</p>
            <p>Best regards,<br>The PetFoodVerifAI Team</p>
        </div>
        <div class='footer'>
            <p>&copy; 2025 PetFoodVerifAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GeneratePasswordResetEmailHtml(string email, string resetToken, string resetLink)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #2c5f2d; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        .button {{ display: inline-block; background-color: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .warning {{ background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }}
        .link-box {{ background-color: #f0f0f0; padding: 10px; word-break: break-all; margin: 10px 0; border-radius: 3px; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset Request</h1>
        </div>
        <div class='content'>
            <p>Hi,</p>
            <p>You recently requested to reset your password for your PetFoodVerifAI account.</p>
            
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetLink}' class='button'>Reset Password</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class='link-box'>{resetLink}</div>
            
            <div class='warning'>
                <p><strong>⚠️ Important:</strong></p>
                <ul style='margin: 5px 0; padding-left: 20px;'>
                    <li>This link will expire in 24 hours</li>
                    <li>You can only use this link once</li>
                    <li>If you did not request a password reset, please ignore this email or contact support</li>
                </ul>
            </div>
            
            <p>Best regards,<br>The PetFoodVerifAI Team</p>
        </div>
        <div class='footer'>
            <p>&copy; 2025 PetFoodVerifAI. All rights reserved.</p>
            <p style='margin-top: 10px;'>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
