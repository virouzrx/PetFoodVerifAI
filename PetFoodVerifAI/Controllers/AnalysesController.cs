using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Exceptions;
using PetFoodVerifAI.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace PetFoodVerifAI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalysesController : ControllerBase
    {
        private readonly IAnalysisService _analysisService;

        public AnalysesController(IAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAnalysis([FromBody] CreateAnalysisRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var result = await _analysisService.CreateAnalysisAsync(request, userId);
                return CreatedAtAction(nameof(CreateAnalysis), new { id = result.AnalysisId }, result);
            }
            catch (ExternalServiceException ex)
            {
                // Log the exception ex
                return StatusCode(503, new { message = "An external service is unavailable. Please try again later.", details = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception ex
                return StatusCode(500, new { message = "An unexpected error occurred.", details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAnalyses([FromQuery] GetAnalysesQueryParameters query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var result = await _analysisService.GetUserAnalysesAsync(userId, query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAnalysisById(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized(); 
            }

            var result = await _analysisService.GetAnalysisByIdAsync(id, userId);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        [HttpPost("{analysisId}/feedback")]
        public async Task<IActionResult> CreateFeedback(Guid analysisId, [FromBody] CreateFeedbackRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                await _analysisService.CreateFeedbackAsync(analysisId, userId, request);
                return Created();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException)
            {
                return Conflict();
            }
            catch (Exception ex)
            {
                // Log the exception ex
                return StatusCode(500, new { message = "An unexpected error occurred.", details = ex.Message });
            }
        }
    }
}
