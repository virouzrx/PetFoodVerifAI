using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Exceptions;
using PetFoodVerifAI.Models;

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
            
            LlmAnalysisResult llmResult;
            try
            {
                llmResult = await _llmService.AnalyzeIngredientsAsync(ingredients, request);
            }
            catch (Exception ex)
            {
                throw new ExternalServiceException("Failed to get analysis from the LLM service.", ex);
            }
            
            var analysis = new Analysis
            {
                Product = product,
                UserId = userId,
                IsGeneral = false,
                Recommendation = Enum.Parse<Recommendation>(llmResult.Recommendation),
                Justification = llmResult.Justification,
                IngredientsText = ingredients,
                Species = request.Species,
                Breed = request.Breed,
                Age = request.Age,
                AdditionalInfo = request.AdditionalInfo,
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
                .Select(a => new AnalysisDetailsDto
                {
                    AnalysisId = a.AnalysisId,
                    ProductId = a.ProductId,
                    ProductName = a.Product.ProductName,
                    ProductUrl = a.Product.ProductUrl,
                    IsGeneral = a.IsGeneral,
                    Recommendation = a.Recommendation,
                    Justification = a.Justification,
                    IngredientsText = a.IngredientsText,
                    Species = a.Species,
                    Breed = a.Breed,
                    Age = a.Age,
                    AdditionalInfo = a.AdditionalInfo,
                    CreatedAt = a.CreatedAt
                })
                .FirstOrDefaultAsync();

            return analysis;
        }
    }
}
