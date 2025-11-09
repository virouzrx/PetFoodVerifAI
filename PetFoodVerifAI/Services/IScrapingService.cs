namespace PetFoodVerifAI.Services
{
    public interface IScrapingService
    {
        Task<string> ScrapeIngredientsAsync(string productUrl);
    }
}
