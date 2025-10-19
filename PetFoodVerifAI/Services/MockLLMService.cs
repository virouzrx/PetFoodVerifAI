using PetFoodVerifAI.DTOs;
using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class MockLLMService : ILLMService
    {
        public Task<LlmAnalysisResult> AnalyzeIngredientsAsync(string ingredientsText, CreateAnalysisRequest petDetails)
        {
            // Return a hardcoded result for mock purposes
            var result = new LlmAnalysisResult
            {
                IsRecommended = true,
                Justification = "This food contains high-quality protein sources and is suitable for the specified breed and age based on the mock analysis.",
                Concerns = new List<IngredientConcern>()
            };
            return Task.FromResult(result);
        }
    }
}
