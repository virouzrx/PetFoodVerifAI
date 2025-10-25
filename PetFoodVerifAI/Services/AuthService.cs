using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PetFoodVerifAI.DTOs;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class AuthService(UserManager<IdentityUser> userManager, IConfiguration configuration, SignInManager<IdentityUser> signInManager) : IAuthService
    {
        private readonly UserManager<IdentityUser> _userManager = userManager;
        private readonly IConfiguration _configuration = configuration;
        private readonly SignInManager<IdentityUser> _signInManager = signInManager;

        public async Task<AuthResultDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email);
            if (user == null)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "Invalid credentials" } } };
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
                    Token = token
                }
            };
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto registerDto)
        {
            var user = new IdentityUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email
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

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Token = token
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
    }
}
