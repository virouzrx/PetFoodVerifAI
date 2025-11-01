using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    /// <summary>
    /// Service interface for sending emails
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends a verification email to the specified email address
        /// </summary>
        /// <param name="email">Recipient email address</param>
        /// <param name="verificationToken">Token for email verification</param>
        /// <param name="verificationLink">Full verification link to include in email</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task SendVerificationEmailAsync(string email, string verificationToken, string verificationLink);

        /// <summary>
        /// Sends a generic email
        /// </summary>
        /// <param name="to">Recipient email address</param>
        /// <param name="subject">Email subject</param>
        /// <param name="body">Email body (HTML)</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task SendEmailAsync(string to, string subject, string body);
    }
}
