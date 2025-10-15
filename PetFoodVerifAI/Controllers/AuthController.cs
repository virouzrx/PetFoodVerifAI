using Microsoft.AspNetCore.Mvc;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Services;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(registerDto);

            if (!result.Succeeded)
            {
                return Conflict(new { Errors = result.Errors });
            }

            return CreatedAtAction(nameof(Register), new { userId = result.Response.UserId }, result.Response);
        }
    }
}
