using Xunit;
using Moq;
using Moq.Protected;
using System.Net;
using System.Net.Http;
using PetFoodVerifAI.Services;

namespace PetFoodVerifAI.Tests
{
    public class BasicScrapingServiceTests_ProductName
    {
        [Fact]
        public async Task ScrapeProductNameAsync_WithZooplusDataZta_ShouldReturnProductName()
        {
            // Arrange
            var html = @"
                <html>
                    <body>
                        <div class=""ProductTitle_titleContainer__gZMux"">
                            <h1 data-zta=""ProductTitle__Title"" class=""z-h1 ProductTitle_title__FNHsJ"">
                                Royal Canin Adult Cat Food
                            </h1>
                        </div>
                    </body>
                </html>";

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
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Royal Canin Adult Cat Food", result);
        }

        [Fact]
        public async Task ScrapeProductNameAsync_WithZooplusClassFallback_ShouldReturnProductName()
        {
            // Arrange
            var html = @"
                <html>
                    <body>
                        <h1 class=""ProductTitle_title__FNHsJ"">
                            Whiskas Ocean Fish Flavor
                        </h1>
                    </body>
                </html>";

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
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Whiskas Ocean Fish Flavor", result);
        }

        [Fact]
        public async Task ScrapeProductNameAsync_NoProductName_ShouldReturnUnknown()
        {
            // Arrange
            var html = @"<html><body><p>No product info</p></body></html>";

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
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Equal("Unknown Product", result);
        }

        [Fact]
        public async Task ScrapeProductNameAsync_HttpError_ShouldReturnErrorMessage()
        {
            // Arrange
            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ThrowsAsync(new HttpRequestException("Network error"));

            var httpClient = new HttpClient(handlerMock.Object);
            var scrapingService = new BasicScrapingService(httpClient);
            var productUrl = "http://example.com/product";

            // Act
            var result = await scrapingService.ScrapeProductNameAsync(productUrl);

            // Assert
            Assert.Contains("Error fetching the page", result);
            Assert.Contains("Network error", result);
        }
    }
}
