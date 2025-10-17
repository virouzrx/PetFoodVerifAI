using PetFoodVerifAI.DTOs;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class LlmAnalysisResult
    {
        public string Recommendation { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
    }

    public interface ILLMService
    {
        Task<LlmAnalysisResult> AnalyzeIngredientsAsync(string ingredientsText, CreateAnalysisRequest petDetails);
    }
}
