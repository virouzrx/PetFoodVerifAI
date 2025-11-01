using Moq;
using Moq.Protected;
using PetFoodVerifAI.Services;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace PetFoodVerifAI.Tests
{
    public class BasicScrapingServiceTests
    {
        [Fact]
        public async Task ScrapeIngredientsAsync_WhenHtmlIsValid_ReturnsIngredients()
        {
            // Arrange
            var html = @"
                <html>
                <body>
                    <div id=""ingredients"" class=""Tabs_tabContent__z9pNv Tabs_selectedTabContent__yeYhd Tabs_selectedTabContentOpen__YaASE"">
                        <div class=""Content_content__ylGND Content_isTruncated__Ccutw"">
                            <a data-zta=""goToConstituents"" class=""z-anchor Ingredients_goToConstituents__Ctiwd"">Składniki analityczne</a>
                            <div class=""anchors_anchorsHTML___2lrv"">
                                <strong>Skład</strong><br>
                                <em>Z wołowiną i kurczakiem:</em><br>
                                Mięso i produkty uboczne pochodzenia zwierzęcego (wołowina 4%, kurczak 4%), roślinne ekstrakty białkowe, zboża, ryby i produkty uboczne, cukry, minerały.<br>
                                <br>
                                <em>Z kaczką i indykiem:</em><br>
                                Mięso i produkty uboczne pochodzenia zwierzęcego (kaczka 4%, indyk 4%), roślinne ekstrakty białkowe, zboża, ryby i rybne produkty uboczne, cukry, minerały.<br>
                                <br>
                                <em>Z królikiem i wątróbką:</em><br>
                                Mięso i produkty uboczne pochodzenia zwierzęcego (królik 4%, wątróbka 4%), roślinne ekstrakty białkowe, zboża, ryby i produkty uboczne, minerały, cukry.<br>
                                <br>
                                <em>Z rybą morską w sosie ze szpinakiem:</em><br>
                                Mięso i produkty uboczne pochodzenia zwierzęcego, ryby i produkty uboczne (w tym ryby morskie 4%), roślinne ekstrakty białkowe, zboża, minerały, warzywa (0,5% odwodnionego szpinaku, co odpowiada 4% szpinaku w sosie), cukry.<br>
                                <br>
                                <strong>Dodatki</strong><br>
                                <em>Dodatki dietetyczne:</em><br>
                                Witamina A (775 j.m./kg), witamina D3 (118 j.m./kg), żelazo (8,9 mg/kg), jod (0,22 mg/kg), miedź (0,77 mg/kg), mangan (1,7 mg/kg), cynk (16 mg/kg), tauryna (488 mg/kg). Dodatki smakowe.
                            </div>
                            <hr class=""Ingredients_space__lmdVR"">
                            <p class=""Ingredients_paragraph__bAqdh""><b>Składniki analityczne</b></p>
                            <table data-zta=""constituentsTable"" class=""Table_table__c5Cjw"">
                                <tbody>
                                    <tr><td>Białko surowe</td><td>10.0<!-- --> <!-- -->%</td></tr>
                                    <tr><td>Tłuszcz surowy</td><td>2.7<!-- --> <!-- -->%</td></tr>
                                    <tr><td>Włókno surowe</td><td>0.05<!-- --> <!-- -->%</td></tr>
                                    <tr><td>Popiół surowy</td><td>2.0<!-- --> <!-- -->%</td></tr>
                                    <tr><td>Wilgotność</td><td>81.5<!-- --> <!-- -->%</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </body>
                </html>";

            var expectedIngredients = @"Skład
Z wołowiną i kurczakiem:
Mięso i produkty uboczne pochodzenia zwierzęcego (wołowina 4%, kurczak 4%), roślinne ekstrakty białkowe, zboża, ryby i produkty uboczne, cukry, minerały.

Z kaczką i indykiem:
Mięso i produkty uboczne pochodzenia zwierzęcego (kaczka 4%, indyk 4%), roślinne ekstrakty białkowe, zboża, ryby i rybne produkty uboczne, cukry, minerały.

Z królikiem i wątróbką:
Mięso i produkty uboczne pochodzenia zwierzęcego (królik 4%, wątróbka 4%), roślinne ekstrakty białkowe, zboża, ryby i produkty uboczne, minerały, cukry.

Z rybą morską w sosie ze szpinakiem:
Mięso i produkty uboczne pochodzenia zwierzęcego, ryby i produkty uboczne (w tym ryby morskie 4%), roślinne ekstrakty białkowe, zboża, minerały, warzywa (0,5% odwodnionego szpinaku, co odpowiada 4% szpinaku w sosie), cukry.

Dodatki
Dodatki dietetyczne:
Witamina A (775 j.m./kg), witamina D3 (118 j.m./kg), żelazo (8,9 mg/kg), jod (0,22 mg/kg), miedź (0,77 mg/kg), mangan (1,7 mg/kg), cynk (16 mg/kg), tauryna (488 mg/kg). Dodatki smakowe.";

            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock
               .Protected()
               .Setup<Task<HttpResponseMessage>>(
                  "SendAsync",
                  ItExpr.IsAny<HttpRequestMessage>(),
                  ItExpr.IsAny<CancellationToken>()
               )
               .ReturnsAsync(new HttpResponseMessage()
               {
                   StatusCode = HttpStatusCode.OK,
                   Content = new StringContent(html),
               });

            var httpClient = new HttpClient(handlerMock.Object);
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "http://any-url.com";

            // Act
            var result = await scrapingService.ScrapeIngredientsAsync(productUrl);

            // Assert
            // Normalize both to single spaces (collapse all whitespace including newlines)
            var normalizedResult = System.Text.RegularExpressions.Regex.Replace(result.Trim(), @"\s+", " ");
            var normalizedExpected = System.Text.RegularExpressions.Regex.Replace(expectedIngredients, @"\s+", " ").Trim();
            Assert.Equal(normalizedExpected, normalizedResult);
        }

        [Fact]
        [Trait("Category", "Integration")]
        public async Task ScrapeIngredientsAsync_WithRealUrl_ShouldReturnIngredients()
        {
            // Arrange
            var httpClient = new HttpClient();
            // Some websites block requests that don't have a standard User-Agent header.
            httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36");
            
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "https://www.zooplus.pl/shop/koty/karma_dla_kota_mokra/gourmet_karma_dla_kota/gourmet/1306354?activeVariant=1306354.0";

            // Act
            var result = await scrapingService.ScrapeIngredientsAsync(productUrl);

            // Assert
            Assert.NotNull(result);
            Assert.NotEmpty(result);
            Assert.DoesNotContain("Could not find ingredients on the page", result);
            Assert.DoesNotContain("Error fetching the page", result);

            // A simple check to see if we got something that looks like ingredients. "Skład" means "Composition" in Polish.
            Assert.Contains("Skład", result, System.StringComparison.OrdinalIgnoreCase);
        }
    }
}
