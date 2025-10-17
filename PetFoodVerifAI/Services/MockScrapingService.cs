using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public class MockScrapingService : IScrapingService
    {
        public Task<string> ScrapeIngredientsAsync(string productUrl)
        {
            return Task.FromResult("Deboned Chicken, Chicken Meal, Brown Rice, Barley, Oatmeal");
        }
    }
}
