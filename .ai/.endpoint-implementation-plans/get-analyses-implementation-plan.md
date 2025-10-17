# API Endpoint Implementation Plan: GET /api/analyses

## 1. Endpoint Overview
This endpoint retrieves a paginated history of pet food analyses performed by the currently authenticated user. It supports filtering by product to view the analysis history for a specific item. The response includes pagination details to facilitate easy navigation of the results on the client-side.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/analyses`
- **Parameters**:
    - **`productId`** (Query, UUID, Optional): Filters the analyses for a specific product.
    - **`page`** (Query, int, Optional): The page number to retrieve. Defaults to `1`.
    - **`pageSize`** (Query, int, Optional): The number of results per page. Defaults to `10`.

## 3. Used Types

### DTOs and ViewModels
- **`GetAnalysesQueryParameters.cs`**
    ```csharp
    public class GetAnalysesQueryParameters
    {
        public Guid? ProductId { get; set; }

        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 100)] // Cap page size for performance
        public int PageSize { get; set; } = 10;
    }
    ```
- **`AnalysisSummaryDto.cs`** (to be added in `DTOs/AnalysisDtos.cs`)
    ```csharp
    public class AnalysisSummaryDto
    {
        public Guid AnalysisId { get; set; }
        public string ProductName { get; set; }
        public Recommendation Recommendation { get; set; } // Enum
        public DateTime CreatedAt { get; set; }
    }
    ```
- **`PaginatedResult.cs`** (A generic class for paginated responses)
    ```csharp
    public class PaginatedResult<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<T> Items { get; set; }
    }
    ```

## 4. Response Details
- **Success Code**: `200 OK`
- **Success Response Payload**:
    ```json
    {
      "page": 1,
      "pageSize": 10,
      "totalCount": 100,
      "items": [
        {
          "analysisId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "productName": "Example Premium Dog Food",
          "recommendation": "Recommended",
          "createdAt": "2025-10-16T10:00:00Z"
        }
      ]
    }
    ```

## 5. Data Flow
1. A `GET` request is made to `/api/analyses`.
2. The ASP.NET Core authentication middleware validates the user's JWT.
3. The request is routed to the `GetAnalyses` action in `AnalysesController`. The `[Authorize]` attribute confirms the user is authenticated.
4. The controller binds the query string parameters to a `GetAnalysesQueryParameters` object and validates them.
5. The controller retrieves the authenticated `UserId` from the `HttpContext.User` claims.
6. The controller calls the `IAnalysisService.GetUserAnalysesAsync(userId, queryParams)` method.
7. The `AnalysisService` uses Entity Framework Core to build a query against the `Analyses` database context.
8. The query will:
    a. Filter `Analyses` by the provided `UserId`.
    b. If `productId` is provided, add an additional filter for `ProductId`.
    c. Join with the `Products` table to retrieve `ProductName`.
    d. Order the results by `CreatedAt` in descending order.
    e. Calculate the `totalCount` before pagination.
    f. Apply pagination using `.Skip()` and `.Take()`.
    g. Project the final results into a list of `AnalysisSummaryDto` objects using `.Select()`.
9. The service constructs and returns a `PaginatedResult<AnalysisSummaryDto>` object.
10. The controller receives the result and returns a `200 OK` response with the paginated data.

## 6. Security Considerations
- **Authentication**: The endpoint will be decorated with the `[Authorize]` attribute, ensuring that only authenticated users can access it.
- **Authorization**: All database queries will be strictly filtered by the authenticated user's ID, preventing one user from accessing another user's data. This application-level check is the primary authorization mechanism.
- **Data Validation**: Query parameters (`page`, `pageSize`) will be validated using data annotations to prevent invalid values and protect against potential abuse (e.g., requesting an excessively large page size).

## 7. Error Handling
- **400 Bad Request**: Returned if query parameter validation fails (e.g., `page` < 1). This is handled automatically by the `[ApiController]` behavior.
- **401 Unauthorized**: Returned if the request is not authenticated. This is handled by the authentication middleware and `[Authorize]` attribute.
- **500 Internal Server Error**: In case of a database failure or other unhandled exception, a generic 500 error will be returned. The exception details will be logged using the standard `ILogger` framework for diagnostics.

## 8. Performance Considerations
- **Database Indexing**: The query will leverage the existing indexes on `Analyses(UserId)` and `Analyses(ProductId)` to ensure fast data retrieval, as specified in the database plan.
- **Query Projection**: The EF Core query will use `.Select()` to project directly to `AnalysisSummaryDto`. This ensures only the required columns are retrieved from the database, minimizing data transfer.
- **Pagination**: Server-side pagination is critical and is implemented by default. The `pageSize` is capped at 100 to prevent clients from requesting excessively large amounts of data in a single request.

## 9. Implementation Steps
1. **Create/Update DTOs**:
    - Add the `AnalysisSummaryDto` class to the existing `PetFoodVerifAI/DTOs/AnalysisDtos.cs` file.
    - Create a new file `PetFoodVerifAI/DTOs/PaginatedResult.cs` for the generic paginated result wrapper.
    - Create a new file `PetFoodVerifAI/DTOs/GetAnalysesQueryParameters.cs`.
2. **Update Service Layer**:
    - Add the method signature `Task<PaginatedResult<AnalysisSummaryDto>> GetUserAnalysesAsync(string userId, GetAnalysesQueryParameters query);` to the `IAnalysisService` interface.
    - Implement this method in `AnalysisService`. The implementation will contain the EF Core query logic for filtering, joining, ordering, paginating, and projecting the data.
3. **Update Controller Layer**:
    - In `AnalysesController.cs`, inject `IAnalysisService`.
    - Create a new public async method `GetAnalyses([FromQuery] GetAnalysesQueryParameters query)`.
    - Add the `[HttpGet]` and `[Authorize]` attributes to the method.
    - Implement the method body to:
        a. Get the current user's ID from `User.FindFirstValue(ClaimTypes.NameIdentifier)`.
        b. Call the `_analysisService.GetUserAnalysesAsync(...)` method.
        c. Return `Ok(result)`.
4. **Dependency Injection**:
    - Verify that `IAnalysisService` and `AnalysisService` are correctly registered in `Program.cs`.
