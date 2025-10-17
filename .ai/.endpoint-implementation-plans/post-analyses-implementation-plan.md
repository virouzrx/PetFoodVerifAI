# API Endpoint Implementation Plan: POST /api/analyses

## 1. Endpoint Overview
This endpoint creates a new pet food analysis for an authenticated user. It serves as the primary entry point for the application's core feature. The endpoint orchestrates finding or creating a product, invoking external services for web scraping and AI-driven analysis, and persisting the results to the database.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/api/analyses`
- **Parameters**:
  - **Required**:
    - `productName` (string): The name of the pet food.
    - `productUrl` (string): A valid URL to the product page.
    - `species` (string): The target pet species. Must be either "Cat" or "Dog".
    - `breed` (string): The pet's breed.
    - `age` (integer): The pet's age in years (must be a positive integer).
  - **Optional**:
    - `ingredientsText` (string): The full text of the ingredients list. If not provided, the backend will attempt to scrape it from `productUrl`.
    - `additionalInfo` (string): Any extra information about the pet (e.g., allergies, health conditions) to refine the analysis.
- **Request Body**:
  ```json
  {
    "productName": "Example Premium Cat Food",
    "productUrl": "http://example.com/catfood",
    "ingredientsText": "Deboned Chicken, Chicken Meal, Brown Rice...",
    "species": "Cat",
    "breed": "Siamese",
    "age": 3,
    "additionalInfo": "My cat is a picky eater."
  }
  ```

## 3. Used Types
- **Request DTO**: `CreateAnalysisRequestDto`
  ```csharp
  public class CreateAnalysisRequestDto
  {
      [Required]
      public string ProductName { get; set; }

      [Required]
      [Url]
      public string ProductUrl { get; set; }

      public string? IngredientsText { get; set; }

      [Required]
      // Custom validation will be needed to ensure this maps to the Species enum
      public string Species { get; set; }

      [Required]
      public string Breed { get; set; }

      [Required]
      [Range(1, 40)] // Assuming a reasonable max age for a pet
      public int Age { get; set; }

      public string? AdditionalInfo { get; set; }
  }
  ```
- **Response DTO**: `AnalysisResponseDto`
  ```csharp
  public class AnalysisResponseDto
  {
      public Guid AnalysisId { get; set; }
      public Guid ProductId { get; set; }
      public string Recommendation { get; set; }
      public string Justification { get; set; }
      public DateTime CreatedAt { get; set; }
  }
  ```

## 4. Response Details
- **Success Response**:
  - **Code**: `201 Created`
  - **Body**:
    ```json
    {
      "analysisId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "productId": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
      "recommendation": "Recommended",
      "justification": "This food contains high-quality protein sources and is suitable for the specified breed and age.",
      "createdAt": "2025-10-15T14:30:00Z"
    }
    ```
- **Error Responses**:
  - `400 Bad Request`: Validation failed on the request body.
  - `401 Unauthorized`: The user is not authenticated.
  - `503 Service Unavailable`: A required external service (web scraper, LLM) is down or failed to process the request.
  - `500 Internal Server Error`: An unexpected server-side error occurred.

## 5. Data Flow
1. A `POST` request with the `CreateAnalysisRequestDto` payload is sent to `/api/analyses`.
2. The `AnalysesController` receives the request. The `[Authorize]` attribute confirms the user is authenticated.
3. ASP.NET Core's model binding and validation middleware validates the request DTO. If invalid, it returns a `400 Bad Request` response automatically.
4. The controller extracts the `UserId` from the user's claims.
5. The controller invokes the `CreateAnalysisAsync` method on the `IAnalysisService`, passing the request DTO and `UserId`.
6. **Inside `AnalysisService`**:
   a. It checks if a `Product` with the given `ProductName` and `ProductUrl` already exists in the database.
      - If it exists, it retrieves the existing `Product` entity.
      - If not, it creates a new `Product` entity.
   b. It determines the ingredients text. If `ingredientsText` was not provided in the request, it calls an external `IScrapingService` with the `productUrl`.
   c. It calls an external `ILLMService` with the ingredients text and all pet-specific details (`Species`, `Breed`, `Age`, `AdditionalInfo`).
   d. The `ILLMService` returns the `Recommendation` and `Justification`.
   e. A new `Analysis` entity is created, populating all fields: `ProductId`, `UserId`, `Recommendation`, `Justification`, pet details, etc. The `IsGeneral` flag is set to `FALSE` by default.
   f. The new `Product` (if created) and the new `Analysis` are saved to the database in a single transaction.
   g. The created `Analysis` entity is mapped to an `AnalysisResponseDto`.
7. The `AnalysisService` returns the `AnalysisResponseDto` to the controller.
8. The controller wraps the DTO in a `CreatedAtActionResult` (which generates a 201 status code) and returns it to the client.

## 6. Security Considerations
- **Authentication**: The controller action must be decorated with `[Authorize]` to ensure only authenticated users can create an analysis.
- **Authorization**: The `UserId` will be sourced directly from the JWT claims (`User.FindFirstValue(ClaimTypes.NameIdentifier)`), not from the request body, to ensure users can only create analyses for themselves.
- **Input Validation**: Rigorous validation on the `CreateAnalysisRequestDto` is crucial to prevent invalid data from entering the system. This will be handled by data annotations.
- **SSRF Protection**: The external scraping service must be hardened to prevent Server-Side Request Forgery. It should maintain an allowlist of domains if possible, or at a minimum, a denylist for internal/private IP ranges.
- **Prompt Injection**: The `ILLMService` should treat all user-provided input (`ingredientsText`, `additionalInfo`) as untrusted data and employ techniques to mitigate prompt injection, such as using delimiters, instruction defense, and sanitization before sending the final prompt to the AI model.

## 7. Performance Considerations
- **External Service Latency**: The primary performance bottlenecks will be the calls to the external scraping and LLM services. These calls must be made asynchronously (`await`).
- **Database Transaction**: The find/create logic for the `Product` and the creation of the `Analysis` should be wrapped in a single, efficient database transaction to ensure data integrity. An index on `(ProductName, ProductUrl)` in the `Products` table is critical for fast lookups.
- **Asynchronous Operations**: The entire controller action and service method chain should be fully asynchronous (`async`/`await`) to ensure the server thread is not blocked during I/O operations (database calls, external HTTP calls).

## 8. Implementation Steps
1. **Create DTOs**: In `DTOs/AnalysisDtos.cs`, define the `CreateAnalysisRequestDto` and `AnalysisResponseDto` classes with appropriate data annotations for validation.
2. **Create Controller**: Create a new controller file `Controllers/AnalysesController.cs`.
3. **Define Service Interface**: Create a new service interface `Services/IAnalysisService.cs` with a method signature like: `Task<AnalysisResponseDto> CreateAnalysisAsync(CreateAnalysisRequestDto request, string userId);`
4. **Implement Service**: Create the `Services/AnalysisService.cs` class that implements `IAnalysisService`.
   - Inject `ApplicationDbContext`, `ILogger`, and interfaces for external services (`IScrapingService`, `ILLMService`).
   - Implement the full data flow logic as described in section 5.
   - Use try-catch blocks to handle exceptions from external services and the database, logging errors and throwing specific exceptions to be handled by the controller or middleware.
5. **Register Services**: In `Program.cs`, register the new service for dependency injection: `builder.Services.AddScoped<IAnalysisService, AnalysisService>();`. Also, register mock/placeholder implementations for `IScrapingService` and `ILLMService`.
6. **Implement Controller Action**:
   - In `AnalysesController`, create a `POST` action method.
   - Decorate it with `[HttpPost]`, `[Authorize]`, and `[ProducesResponseType]`.
   - Inject `IAnalysisService`.
   - Get the `userId` from `User.Claims`.
   - Call the service method and return a `CreatedAtActionResult` with the response DTO.
7. **Error Handling**: Implement a global exception handling middleware or use try-catch blocks in the controller action to translate service-layer exceptions into the appropriate HTTP status codes (e.g., `503 Service Unavailable`).
8. **Configuration**: Add necessary configuration values for external service URLs or API keys to `appsettings.json`.
9. **Unit & Integration Tests**:
   - Write unit tests for the `AnalysisService` to verify the business logic, mocking all external dependencies.
   - Write integration tests for the `AnalysesController` to verify the end-to-end flow, including authentication, validation, and correct HTTP responses.
