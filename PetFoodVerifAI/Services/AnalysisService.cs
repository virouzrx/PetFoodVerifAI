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
            string productName;
            string ingredients;
            Product? product;

            if (request.IsManual)
            {
                productName = request.ProductName!;
                ingredients = request.IngredientsText!;
                
                product = new Product
                {
                    ProductName = productName,
                    ProductUrl = null,
                    IsManualEntry = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Products.Add(product);
            }
            else
            {
                try
                {
                    var scrapedData = await _scrapingService.ScrapeProductDataAsync(request.ProductUrl!);
                    productName = scrapedData.ProductName;
                    ingredients = scrapedData.Ingredients;
                }
                catch (Exception ex)
                {
                    throw new ExternalServiceException("Failed to scrape product data.", ex);
                }
                
                product = await _context.Products
                    .FirstOrDefaultAsync(p => p.ProductName == productName && p.ProductUrl == request.ProductUrl && !p.IsManualEntry);
                    
                if (product == null)
                {
                    product = new Product
                    {
                        ProductName = productName,
                        ProductUrl = request.ProductUrl,
                        IsManualEntry = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Products.Add(product);
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
                .Include(a => a.Product)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .AsQueryable();

            if (query.ProductId.HasValue)
            {
                queryable = queryable.Where(a => a.ProductId == query.ProductId.Value);
            }

            if (query.GroupByProduct && !query.ProductId.HasValue)
            {
                var allAnalyses = await queryable.ToListAsync();
                var latestAnalyses = allAnalyses
                    .GroupBy(a => a.ProductId)
                    .Select(g => g.OrderByDescending(a => a.CreatedAt).First())
                    .ToList();

                var totalCount = latestAnalyses.Count;

                var items = latestAnalyses
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(a => new AnalysisSummaryDto
                    {
                        AnalysisId = a.AnalysisId,
                        ProductId = a.ProductId,
                        ProductName = a.Product.ProductName,
                        ProductUrl = a.Product.ProductUrl,
                        IsManualEntry = a.Product.IsManualEntry,
                        Recommendation = a.Recommendation,
                        CreatedAt = a.CreatedAt
                    })
                    .ToList();

                return new PaginatedResult<AnalysisSummaryDto>
                {
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalCount = totalCount,
                    Items = items
                };
            }

            // Default behavior: return all analyses
            var defaultTotalCount = await queryable.CountAsync();

            var defaultItems = await queryable
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(a => new AnalysisSummaryDto
                {
                    AnalysisId = a.AnalysisId,
                    ProductId = a.ProductId,
                    ProductName = a.Product.ProductName,
                    ProductUrl = a.Product.ProductUrl,
                    IsManualEntry = a.Product.IsManualEntry,
                    Recommendation = a.Recommendation,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return new PaginatedResult<AnalysisSummaryDto>
            {
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = defaultTotalCount,
                Items = defaultItems
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

            List<IngredientConcernDto> concerns = [];
            if (!string.IsNullOrEmpty(analysis.ConcernsJson))
            {
                try
                {
                    concerns = JsonSerializer.Deserialize<List<IngredientConcernDto>>(analysis.ConcernsJson) 
                        ?? [];
                }
                catch (JsonException)
                {
                    concerns = [];
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
