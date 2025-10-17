using System.Threading.Tasks;

namespace PetFoodVerifAI.Services
{
    public interface IScrapingService
    {
        Task<string> ScrapeIngredientsAsync(string productUrl);
    }
}
