using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace PetFoodVerifAI.Services
{
    public class BasicScrapingService(HttpClient httpClient) : IScrapingService
    {
        private readonly HttpClient _httpClient = httpClient;

        public async Task<string> ScrapeIngredientsAsync(string productUrl)
        {
            try
            {
                var response = await _httpClient.GetStringAsync(productUrl);

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

                try
                {
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
                }
                catch (Exception htmlParseEx)
                {
                    Console.WriteLine($"HtmlAgilityPack parsing failed: {htmlParseEx.Message}");
                }

                return "Could not find ingredients on the page. Please check the XPath selector in BasicScrapingService for zooplus.";
            }
            catch (HttpRequestException e)
            {
                return $"Error fetching the page: {e.Message}";
            }
            catch (Exception e)
            {
                return $"An error occurred during scraping: {e.Message}";
            }
        }
    }
}
