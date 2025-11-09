namespace PetFoodVerifAI.Services
{
    public record ScrapedProductData(string ProductName, string Ingredients);

    public interface IScrapingService
    {
        Task<string> ScrapeIngredientsAsync(string productUrl);
        Task<string> ScrapeProductNameAsync(string productUrl);
        Task<ScrapedProductData> ScrapeProductDataAsync(string productUrl);
    }
}
