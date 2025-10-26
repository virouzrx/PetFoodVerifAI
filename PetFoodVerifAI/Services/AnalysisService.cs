using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Exceptions;
using PetFoodVerifAI.Models;
using System.Text.Json;

namespace PetFoodVerifAI.Services
{
    public class AnalysisService(ApplicationDbContext context, IScrapingService scrapingService, ILLMService llmService) : IAnalysisService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IScrapingService _scrapingService = scrapingService;
        private readonly ILLMService _llmService = llmService;

        public async Task<AnalysisCreatedResponse> CreateAnalysisAsync(CreateAnalysisRequest request, string userId)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductName == request.ProductName && p.ProductUrl == request.ProductUrl);

            if (product == null)
            {
                product = new Product
                {
                    ProductName = request.ProductName,
                    ProductUrl = request.ProductUrl,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Products.Add(product);
            }

            var ingredients = request.IngredientsText;
            if (string.IsNullOrWhiteSpace(ingredients))
            {
                try
                {
                    ingredients = await _scrapingService.ScrapeIngredientsAsync(request.ProductUrl);
                }
                catch (Exception ex)
                {
                    throw new ExternalServiceException("Failed to scrape ingredients.", ex);
                }
            }
            
            LlmAnalysisResult llmResponse;
            try
            {
                llmResponse = await _llmService.AnalyzeIngredientsAsync(ingredients, request);
            }
            catch (Exception ex)
            {
                throw new ExternalServiceException("Failed to get analysis from the LLM service.", ex);
            }
            
            // Serialize concerns to JSON for storage
            var concernsJson = llmResponse.Concerns.Count > 0 
                ? JsonSerializer.Serialize(llmResponse.Concerns.Select(c => new IngredientConcernDto
                {
                    Type = c.Type,
                    Ingredient = c.Ingredient,
                    Reason = c.Reason
                }).ToList())
                : null;

            var analysis = new Analysis
            {
                ProductId = product.ProductId,
                UserId = userId,
                Recommendation = llmResponse.IsRecommended ? Recommendation.Recommended : Recommendation.NotRecommended,
                Justification = llmResponse.Justification,
                IngredientsText = ingredients,
                Species = request.Species,
                Breed = request.Breed,
                Age = request.Age,
                AdditionalInfo = request.AdditionalInfo,
                ConcernsJson = concernsJson,
                CreatedAt = DateTime.UtcNow
            };

            _context.Analyses.Add(analysis);
            await _context.SaveChangesAsync();

            return new AnalysisCreatedResponse
            {
                AnalysisId = analysis.AnalysisId,
                ProductId = product.ProductId,
                Recommendation = analysis.Recommendation,
                Justification = analysis.Justification,
                Concerns = llmResponse.Concerns.Select(c => new IngredientConcernDto
                {
                    Type = c.Type,
                    Ingredient = c.Ingredient,
                    Reason = c.Reason
                }).ToList(),
                CreatedAt = analysis.CreatedAt
            };
        }

        public async Task<PaginatedResult<AnalysisSummaryDto>> GetUserAnalysesAsync(string userId, GetAnalysesQueryParameters query)
        {
            var queryable = _context.Analyses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .AsQueryable();

            if (query.ProductId.HasValue)
            {
                queryable = queryable.Where(a => a.ProductId == query.ProductId.Value);
            }

            var totalCount = await queryable.CountAsync();

            var items = await queryable
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(a => new AnalysisSummaryDto
                {
                    AnalysisId = a.AnalysisId,
                    ProductId = a.ProductId,
                    ProductName = a.Product.ProductName,
                    Recommendation = a.Recommendation,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return new PaginatedResult<AnalysisSummaryDto>
            {
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = totalCount,
                Items = items
            };
        }

        public async Task<AnalysisDetailsDto?> GetAnalysisByIdAsync(Guid analysisId, string userId)
        {
            var analysis = await _context.Analyses
                .Include(a => a.Product)
                .Where(a => a.AnalysisId == analysisId && a.UserId == userId)
                .FirstOrDefaultAsync();

            if (analysis == null)
            {
                return null;
            }

            // Deserialize concerns from JSON
            List<IngredientConcernDto> concerns = new List<IngredientConcernDto>();
            if (!string.IsNullOrEmpty(analysis.ConcernsJson))
            {
                try
                {
                    concerns = JsonSerializer.Deserialize<List<IngredientConcernDto>>(analysis.ConcernsJson) 
                        ?? new List<IngredientConcernDto>();
                }
                catch (JsonException)
                {
                    // If deserialization fails, return empty list
                    concerns = new List<IngredientConcernDto>();
                }
            }

            return new AnalysisDetailsDto
            {
                AnalysisId = analysis.AnalysisId,
                ProductId = analysis.ProductId,
                ProductName = analysis.Product.ProductName,
                ProductUrl = analysis.Product.ProductUrl,
                Recommendation = analysis.Recommendation,
                Justification = analysis.Justification,
                Concerns = concerns,
                IngredientsText = analysis.IngredientsText,
                Species = analysis.Species,
                Breed = analysis.Breed,
                Age = analysis.Age,
                AdditionalInfo = analysis.AdditionalInfo,
                CreatedAt = analysis.CreatedAt
            };
        }

        public async Task CreateFeedbackAsync(Guid analysisId, string userId, CreateFeedbackRequest request)
        {
            var analysisExists = await _context.Analyses.AnyAsync(a => a.AnalysisId == analysisId);
            if (!analysisExists)
            {
                throw new KeyNotFoundException("Analysis not found.");
            }

            var feedbackExists = await _context.Feedbacks
                .AnyAsync(f => f.AnalysisId == analysisId && f.UserId == userId);

            if (feedbackExists)
            {
                // Or update existing feedback, depending on requirements
                throw new InvalidOperationException("Feedback already submitted for this analysis.");
            }

            var feedback = new Feedback
            {
                AnalysisId = analysisId,
                UserId = userId,
                IsPositive = request.IsPositive ?? false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();
        }
    }
}
