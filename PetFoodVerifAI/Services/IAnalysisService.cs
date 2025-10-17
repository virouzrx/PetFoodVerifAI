using PetFoodVerifAI.DTOs;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public interface IAnalysisService
    {
        Task<AnalysisCreatedResponse> CreateAnalysisAsync(CreateAnalysisRequest request, string userId);
        Task<PaginatedResult<AnalysisSummaryDto>> GetUserAnalysesAsync(string userId, GetAnalysesQueryParameters query);
        Task<AnalysisDetailsDto?> GetAnalysisByIdAsync(Guid analysisId, string userId);
    }
}
