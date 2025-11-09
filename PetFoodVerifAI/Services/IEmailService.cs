namespace PetFoodVerifAI.Services
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(string email, string verificationToken, string verificationLink);
        Task SendEmailAsync(string to, string subject, string body);
        Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink);
    }
}
