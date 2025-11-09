using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.Services;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Models;

namespace PetFoodVerifAI.Tests
{
    public class AnalysisServiceTests_DualMode
    {
        [Fact]
        public async Task CreateAnalysisAsync_UrlMode_ShouldScrapeAndCreateProduct()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_UrlMode")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            mockScrapingService
                .Setup(s => s.ScrapeProductDataAsync(It.IsAny<string>()))
                .ReturnsAsync(new ScrapedProductData("Scraped Product Name", "Chicken, Rice, Vitamins"));

            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                IsManual = false,
                ProductUrl = "https://example.com/product",
                ProductName = null,
                IngredientsText = null,
                Species = Species.Dog,
                Breed = "Labrador",
                Age = 5,
                AdditionalInfo = null
            };

            // Act
            var result = await analysisService.CreateAnalysisAsync(request, "user123");

            // Assert
            Assert.NotNull(result);
            var product = await context.Products.FirstOrDefaultAsync();
            Assert.NotNull(product);
            Assert.Equal("Scraped Product Name", product.ProductName);
            Assert.Equal("https://example.com/product", product.ProductUrl);
            Assert.False(product.IsManualEntry);

            mockScrapingService.Verify(s => s.ScrapeProductDataAsync(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task CreateAnalysisAsync_ManualMode_ShouldCreateProductWithoutUrl()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_ManualMode")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                IsManual = true,
                ProductUrl = null,
                ProductName = "Manual Product Name",
                IngredientsText = "Beef, Pork, Vegetables",
                Species = Species.Cat,
                Breed = "Persian",
                Age = 3,
                AdditionalInfo = null
            };

            // Act
            var result = await analysisService.CreateAnalysisAsync(request, "user123");

            // Assert
            Assert.NotNull(result);
            var product = await context.Products.FirstOrDefaultAsync();
            Assert.NotNull(product);
            Assert.Equal("Manual Product Name", product.ProductName);
            Assert.Null(product.ProductUrl);
            Assert.True(product.IsManualEntry);

            // Scraping should NOT be called
            mockScrapingService.Verify(s => s.ScrapeProductDataAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAnalysisAsync_UrlMode_WithExistingProduct_ShouldReuseProduct()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_ReuseProduct")
                .Options;

            using var context = new ApplicationDbContext(options);

            // Create existing product
            var existingProduct = new Product
            {
                ProductId = Guid.NewGuid(),
                ProductName = "Existing Product",
                ProductUrl = "https://example.com/existing",
                IsManualEntry = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            context.Products.Add(existingProduct);
            await context.SaveChangesAsync();

            var mockScrapingService = new Mock<IScrapingService>();
            mockScrapingService
                .Setup(s => s.ScrapeProductDataAsync(It.IsAny<string>()))
                .ReturnsAsync(new ScrapedProductData("Existing Product", "Same ingredients"));

            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = false,
                    Justification = "Contains allergens",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                IsManual = false,
                ProductUrl = "https://example.com/existing",
                ProductName = null,
                IngredientsText = null,
                Species = Species.Dog,
                Breed = "Golden Retriever",
                Age = 7,
                AdditionalInfo = null
            };

            // Act
            var result = await analysisService.CreateAnalysisAsync(request, "user456");

            // Assert
            Assert.NotNull(result);
            var products = await context.Products.ToListAsync();
            Assert.Single(products); // Should reuse existing product, not create new one
            Assert.Equal(existingProduct.ProductId, products[0].ProductId);

            var analyses = await context.Analyses.ToListAsync();
            Assert.Single(analyses);
            Assert.Equal(existingProduct.ProductId, analyses[0].ProductId);
            Assert.Equal("user456", analyses[0].UserId);
        }

        [Fact]
        public async Task CreateAnalysisAsync_ManualMode_AlwaysCreatesNewProduct()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb_ManualDuplicates")
                .Options;

            using var context = new ApplicationDbContext(options);

            var mockScrapingService = new Mock<IScrapingService>();
            var mockLlmService = new Mock<ILLMService>();
            mockLlmService
                .Setup(s => s.AnalyzeIngredientsAsync(It.IsAny<string>(), It.IsAny<CreateAnalysisRequest>()))
                .ReturnsAsync(new LlmAnalysisResult
                {
                    IsRecommended = true,
                    Justification = "Good ingredients",
                    Concerns = new List<IngredientConcern>()
                });

            var analysisService = new AnalysisService(context, mockScrapingService.Object, mockLlmService.Object);

            var request = new CreateAnalysisRequest
            {
                IsManual = true,
                ProductUrl = null,
                ProductName = "Same Product Name",
                IngredientsText = "Ingredients",
                Species = Species.Cat,
                Breed = "Persian",
                Age = 3,
                AdditionalInfo = null
            };

            // Act - Create two analyses with same product name
            await analysisService.CreateAnalysisAsync(request, "user123");
            await analysisService.CreateAnalysisAsync(request, "user456");

            // Assert - Should create TWO separate products
            var productCount = await context.Products.CountAsync();
            Assert.Equal(2, productCount);

            var products = await context.Products.ToListAsync();
            Assert.All(products, p => Assert.True(p.IsManualEntry));
            Assert.All(products, p => Assert.Null(p.ProductUrl));
        }
    }
}
