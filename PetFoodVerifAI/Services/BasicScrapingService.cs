using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace PetFoodVerifAI.Services
{
    public class BasicScrapingService(HttpClient httpClient) : IScrapingService
    {
        private readonly HttpClient _httpClient = httpClient;

        public async Task<ScrapedProductData> ScrapeProductDataAsync(string productUrl)
        {
            try
            {
                var response = await _httpClient.GetStringAsync(productUrl);
                var htmlDoc = new HtmlDocument
                {
                    OptionCheckSyntax = false,
                    OptionFixNestedTags = true,
                    OptionAutoCloseOnEnd = true,
                    OptionDefaultStreamEncoding = Encoding.UTF8,
                    OptionReadEncoding = true,
                    OptionMaxNestedChildNodes = 5000
                };
                htmlDoc.LoadHtml(response);

                var productName = ExtractProductName(htmlDoc, response);
                var ingredients = ExtractIngredients(htmlDoc, response);

                return new ScrapedProductData(productName, ingredients);
            }
            catch (HttpRequestException e)
            {
                var errorMsg = $"Error fetching the page: {e.Message}";
                return new ScrapedProductData(errorMsg, errorMsg);
            }
            catch (Exception e)
            {
                var errorMsg = $"Error scraping product data: {e.Message}";
                return new ScrapedProductData(errorMsg, errorMsg);
            }
        }

        public async Task<string> ScrapeIngredientsAsync(string productUrl)
        {
            var data = await ScrapeProductDataAsync(productUrl);
            return data.Ingredients;
        }

        public async Task<string> ScrapeProductNameAsync(string productUrl)
        {
            var data = await ScrapeProductDataAsync(productUrl);
            return data.ProductName;
        }

        private static string ExtractIngredients(HtmlDocument htmlDoc, string response)
        {
            try
            {
                var ingredientsSectionPattern = @"<div[^>]*id=""ingredients""[^>]*>(.*?)</div>\s*</div>\s*</div>";
                var sectionMatch = Regex.Match(response, ingredientsSectionPattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
                
                string searchArea = sectionMatch.Success ? sectionMatch.Groups[1].Value : response;

                var regexPattern = @"<div[^>]*class=""[^""]*anchors_anchorsHTML___2lrv[^""]*""[^>]*>(.*?)</div>";
                var match = Regex.Match(searchArea, regexPattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
                
                if (match.Success)
                {
                    var htmlContent = match.Groups[1].Value;
                    var textOnly = Regex.Replace(htmlContent, @"<[^>]+>", "\n");
                    var decodedText = System.Net.WebUtility.HtmlDecode(textOnly);
                    var normalizedText = Regex.Replace(decodedText, @"[ \t]+", " ");
                    normalizedText = Regex.Replace(normalizedText, @"\n\s*\n", "\n");
                    normalizedText = normalizedText.Trim();
                    return normalizedText;
                }

                var ingredientsNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='ingredients']//div[contains(@class, 'anchors_anchorsHTML___2lrv')]");
                if (ingredientsNode != null)
                {
                    var ingredientsText = ingredientsNode.InnerText;
                    var decodedText = System.Net.WebUtility.HtmlDecode(ingredientsText);
                    var normalizedText = Regex.Replace(decodedText, @"\s+", " ").Trim();
                    return normalizedText;
                }

                ingredientsNode = htmlDoc.DocumentNode.SelectSingleNode("//div[contains(@class, 'anchors_anchorsHTML___2lrv')]");
                if (ingredientsNode != null)
                {
                    var ingredientsText = ingredientsNode.InnerText;
                    var decodedText = System.Net.WebUtility.HtmlDecode(ingredientsText);
                    var normalizedText = Regex.Replace(decodedText, @"\s+", " ").Trim();
                    return normalizedText;
                }

                return "Could not find ingredients on the page. Please check the XPath selector in BasicScrapingService for zooplus.";
            }
            catch (Exception)
            {
                return "Could not find ingredients on the page. Please check the XPath selector in BasicScrapingService for zooplus.";
            }
        }

        private static string ExtractProductName(HtmlDocument htmlDoc, string response)
        {
            try
            {
                var nameNode = htmlDoc.DocumentNode.SelectSingleNode("//h1[@data-zta='ProductTitle__Title']");
                
                if (nameNode == null)
                {
                    nameNode = htmlDoc.DocumentNode.SelectSingleNode("//h1[contains(@class, 'ProductTitle_title__')]");
                }

                if (nameNode != null)
                {
                    var productName = nameNode.InnerText;
                    var decodedName = System.Net.WebUtility.HtmlDecode(productName);
                    var normalizedName = Regex.Replace(decodedName, @"\s+", " ").Trim();
                    return normalizedName;
                }

                return "Unknown Product";
            }
            catch (Exception)
            {
                return "Unknown Product";
            }
        }
    }
}
