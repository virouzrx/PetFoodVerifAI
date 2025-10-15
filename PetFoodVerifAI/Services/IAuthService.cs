using PetFoodVerifAI.DTOs;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResultDto> LoginAsync(LoginRequestDto loginRequest);
    }
}
