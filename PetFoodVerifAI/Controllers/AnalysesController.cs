using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Exceptions;
using PetFoodVerifAI.Services;
using System.Security.Claims;

namespace PetFoodVerifAI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalysesController(IAnalysisService analysisService) : ControllerBase
    {
        private readonly IAnalysisService _analysisService = analysisService;

        [HttpPost]
        public async Task<IActionResult> CreateAnalysis([FromBody] CreateAnalysisRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }
            
            if (request.IsManual)
            {
                if (string.IsNullOrWhiteSpace(request.ProductName))
                {
                    return BadRequest(new 
                    { 
                        message = "Product name is required for manual entry.",
                        errors = new Dictionary<string, string[]>
                        {
                            ["ProductName"] = ["Product name is required when entering manually"]
                        }
                    });
                }
                
                if (string.IsNullOrWhiteSpace(request.IngredientsText))
                {
                    return BadRequest(new 
                    { 
                        message = "Ingredients are required for manual entry.",
                        errors = new Dictionary<string, string[]>
                        {
                            ["IngredientsText"] = ["Ingredients are required when entering manually"]
                        }
                    });
                }
                
                if (!string.IsNullOrWhiteSpace(request.ProductUrl))
                {
                    return BadRequest(new 
                    { 
                        message = "ProductUrl should not be provided when IsManual is true.",
                        errors = new Dictionary<string, string[]>
                        {
                            ["ProductUrl"] = ["Do not provide URL in manual mode"]
                        }
                    });
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.ProductUrl))
                {
                    return BadRequest(new 
                    { 
                        message = "Product URL is required when IsManual is false.",
                        errors = new Dictionary<string, string[]>
                        {
                            ["ProductUrl"] = ["Product URL is required for scraping mode"]
                        }
                    });
                }
                
                if (!Uri.TryCreate(request.ProductUrl, UriKind.Absolute, out var uri) ||
                    (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                {
                    return BadRequest(new 
                    { 
                        message = "ProductUrl must be a valid HTTP or HTTPS URL.",
                        errors = new Dictionary<string, string[]>
                        {
                            ["ProductUrl"] = ["Please enter a valid URL starting with http:// or https://"]
                        }
                    });
                }
            }

            try
            {
                var result = await _analysisService.CreateAnalysisAsync(request, userId);
                return CreatedAtAction(nameof(CreateAnalysis), new { id = result.AnalysisId }, result);
            }
            catch (ExternalServiceException ex)
            {
                return StatusCode(503, new { message = "An external service is unavailable. Please try again later.", details = ex.Message });
            }
            catch (Exception ex)
            {
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
                return StatusCode(201);
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
                return StatusCode(500, new { message = "An unexpected error occurred.", details = ex.Message });
            }
        }
    }
}
