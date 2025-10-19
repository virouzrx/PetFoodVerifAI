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
                // Get the response as string
                var response = await _httpClient.GetStringAsync(productUrl);

                // First, extract the entire ingredients section (div with id="ingredients")
                // This ensures we're looking in the right place
                var ingredientsSectionPattern = @"<div[^>]*id=""ingredients""[^>]*>(.*?)</div>\s*</div>\s*</div>";
                var sectionMatch = Regex.Match(response, ingredientsSectionPattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
                
                string searchArea = sectionMatch.Success ? sectionMatch.Groups[1].Value : response;

                // Now find the anchors_anchorsHTML___2lrv div within the ingredients section
                var regexPattern = @"<div[^>]*class=""[^""]*anchors_anchorsHTML___2lrv[^""]*""[^>]*>(.*?)</div>";
                var match = Regex.Match(searchArea, regexPattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
                
                if (match.Success)
                {
                    var htmlContent = match.Groups[1].Value;
                    
                    // Remove HTML tags
                    var textOnly = Regex.Replace(htmlContent, @"<[^>]+>", "\n");
                    
                    // Decode HTML entities
                    var decodedText = System.Net.WebUtility.HtmlDecode(textOnly);
                    
                    // Normalize whitespace but preserve line breaks for readability
                    var normalizedText = Regex.Replace(decodedText, @"[ \t]+", " ");
                    normalizedText = Regex.Replace(normalizedText, @"\n\s*\n", "\n");
                    normalizedText = normalizedText.Trim();
                    
                    return normalizedText;
                }

                // Fallback to HtmlAgilityPack if regex fails
                try
                {
                    var htmlDoc = new HtmlDocument();
                    
                    // Configure HtmlAgilityPack to be very lenient
                    htmlDoc.OptionCheckSyntax = false;
                    htmlDoc.OptionFixNestedTags = true;
                    htmlDoc.OptionAutoCloseOnEnd = true;
                    htmlDoc.OptionDefaultStreamEncoding = Encoding.UTF8;
                    htmlDoc.OptionReadEncoding = true;
                    
                    // Set a maximum depth to prevent infinite recursion
                    htmlDoc.OptionMaxNestedChildNodes = 5000;
                    
                    htmlDoc.LoadHtml(response);

                    // Try the specific div with class anchors_anchorsHTML___2lrv
                    var ingredientsNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='ingredients']//div[contains(@class, 'anchors_anchorsHTML___2lrv')]");

                    if (ingredientsNode != null)
                    {
                        var ingredientsText = ingredientsNode.InnerText;
                        
                        // Decode HTML entities and normalize whitespace
                        var decodedText = System.Net.WebUtility.HtmlDecode(ingredientsText);
                        var normalizedText = Regex.Replace(decodedText, @"\s+", " ").Trim();
                        return normalizedText;
                    }

                    // Fallback: try to find just the div with the specific class
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
                    // Log the parsing error but continue
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
