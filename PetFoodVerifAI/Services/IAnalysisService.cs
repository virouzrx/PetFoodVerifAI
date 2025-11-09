using PetFoodVerifAI.DTOs;

namespace PetFoodVerifAI.Services
{
    public interface IAnalysisService
    {
        Task<AnalysisCreatedResponse> CreateAnalysisAsync(CreateAnalysisRequest request, string userId);
        Task<PaginatedResult<AnalysisSummaryDto>> GetUserAnalysesAsync(string userId, GetAnalysesQueryParameters query);
        Task<AnalysisDetailsDto?> GetAnalysisByIdAsync(Guid analysisId, string userId);
        Task CreateFeedbackAsync(Guid analysisId, string userId, CreateFeedbackRequest request);
    }
}
