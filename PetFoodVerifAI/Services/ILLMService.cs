using PetFoodVerifAI.DTOs;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class IngredientConcern
    {
        public string Type { get; set; } = string.Empty; // "questionable" or "unacceptable"
        public string Ingredient { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }

    public class LlmAnalysisResult
    {
        public bool IsRecommended { get; set; }
        public string Justification { get; set; } = string.Empty;
        public List<IngredientConcern> Concerns { get; set; } = new List<IngredientConcern>();
    }

    public interface ILLMService
    {
        Task<LlmAnalysisResult> AnalyzeIngredientsAsync(string ingredientsText, CreateAnalysisRequest petDetails);
    }
}
