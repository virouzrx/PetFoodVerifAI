# API Endpoint Implementation Plan: GET /api/analyses/{id}

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /api/analyses/{id}` endpoint. Its purpose is to retrieve a single pet food analysis by its unique identifier. The endpoint will return detailed information about the analysis, including product details, the recommendation, and justification. Access is restricted to authenticated users, who can only view their own personal analyses or any public (general) analysis.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/analyses/{id}`
- **Parameters**:
  - **Required**:
    - `id` (route parameter): The `UUID` of the analysis to retrieve.
- **Request Body**: None.

## 3. Used Types

### DTOs
- **`AnalysisDetailsDto`**: A new DTO will be created in `PetFoodVerifAI/DTOs/AnalysisDtos.cs` to represent the response payload.
  ```csharp
  public class AnalysisDetailsDto
  {
      public Guid AnalysisId { get; set; }
      public Guid ProductId { get; set; }
      public string ProductName { get; set; }
      public string ProductUrl { get; set; }
      public bool IsGeneral { get; set; }
      public string Recommendation { get; set; }
      public string Justification { get; set; }
      public string IngredientsText { get; set; }
      public string Species { get; set; }
      public string? Breed { get; set; }
      public int? Age { get; set; }
      public string? AdditionalInfo { get; set; }
      public DateTime CreatedAt { get; set; }
  }
  ```

## 4. Response Details
- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**: An `AnalysisDetailsDto` object.
    ```json
    {
      "analysisId": "uuid-goes-here",
      "productId": "uuid-goes-here",
      "productName": "Example Pet Food",
      "productUrl": "http://example.com/petfood",
      "isGeneral": false,
      "recommendation": "Recommended",
      "justification": "This food contains high-quality protein sources...",
      "ingredientsText": "Chicken, rice, ...",
      "species": "Dog",
      "breed": "Golden Retriever",
      "age": 5,
      "additionalInfo": "My dog has a sensitive stomach.",
      "createdAt": "2025-10-13T10:00:00Z"
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` (Invalid UUID format)
  - **Code**: `401 Unauthorized` (User not authenticated)
  - **Code**: `404 Not Found` (Analysis not found or user not authorized to view)
  - **Code**: `500 Internal Server Error` (Unexpected server error)

## 5. Data Flow
1. A `GET` request is made to `/api/analyses/{id}` with a valid JWT in the `Authorization` header.
2. The `[Authorize]` attribute on the `AnalysesController` action validates the JWT.
3. The controller action extracts the `id` from the route and the `userId` from the user's claims.
4. The controller calls the `GetAnalysisByIdAsync(id, userId)` method in the `IAnalysisService`.
5. The `AnalysisService` queries the database for an `Analysis` record matching the `id`. The query will join the `Products` table to retrieve product information and include a `WHERE` clause to enforce authorization (`WHERE a.AnalysisId == id AND (a.UserId == userId OR a.IsGeneral)`).
6. If a matching and authorized record is found, it's mapped to an `AnalysisDetailsDto` and returned to the controller.
7. If no record is found (or the user is not authorized), the service returns `null`.
8. The controller checks the service response:
   - If a DTO is returned, it sends a `200 OK` response with the DTO as the body.
   - If `null` is returned, it sends a `404 Not Found` response.

## 6. Security Considerations
- **Authentication**: The controller action will be decorated with the `[Authorize]` attribute, ensuring only authenticated users can access the endpoint.
- **Authorization**: The business logic within `AnalysisService` will ensure that users can only access their own personal analyses or analyses marked as `IsGeneral = true`. This prevents Insecure Direct Object Reference (IDOR) vulnerabilities. Returning `404 Not Found` for unauthorized access attempts is intentional to avoid disclosing the existence of a resource.
- **Data Validation**: The `id` route parameter will be automatically validated as a `Guid` by the ASP.NET Core framework.

## 7. Performance Considerations
- The database query will involve a join between the `Analyses` and `Products` tables. An index on `Analyses.ProductId` (`idx_analyses_product_id` as per the DB plan) will ensure this join is performant.
- The query will be filtered by `AnalysisId` (the primary key), which is inherently efficient.
- The use of `FirstOrDefaultAsync` will ensure the database stops searching once a record is found.

## 8. Implementation Steps
1. **Create DTO**:
   - Add the `AnalysisDetailsDto` class definition to `PetFoodVerifAI/DTOs/AnalysisDtos.cs`.

2. **Update Service Interface**:
   - Add the following method signature to `PetFoodVerifAI/Services/IAnalysisService.cs`:
     ```csharp
     Task<AnalysisDetailsDto?> GetAnalysisByIdAsync(Guid analysisId, string userId);
     ```

3. **Implement Service Logic**:
   - In `PetFoodVerifAI/Services/AnalysisService.cs`, implement the `GetAnalysisByIdAsync` method.
   - Inject `ApplicationDbContext`.
   - Construct an Entity Framework Core query to select the analysis, including the related `Product`.
   - The query must filter by both `analysisId` and the authorization logic (`userId` or `IsGeneral`).
   - Project the result into an `AnalysisDetailsDto`. Return `null` if not found.

4. **Implement Controller Action**:
   - In `PetFoodVerifAI/Controllers/AnalysesController.cs`, create a new public async method for the endpoint.
   - Add the `[HttpGet("{id}")]` and `[Authorize]` attributes.
   - Inject `IAnalysisService`.
   - Retrieve the current user's ID from the `HttpContext.User` claims.
   - Call the service method `_analysisService.GetAnalysisByIdAsync(id, userId)`.
   - Return `Ok(result)` if the result is not null, otherwise return `NotFound()`.
