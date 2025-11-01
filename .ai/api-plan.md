# REST API Plan for PetFoodVerifAI

This document outlines the RESTful API for the PetFoodVerifAI application, based on the project's PRD, database schema, and tech stack.

## 1. Resources

The API is designed around the following main resources:

- **Analyses**: Represents the analysis of a pet food product. Corresponds to the `Analyses` table.
- **Products**: Represents a unique pet food product. Corresponds to the `Products` table. This resource is implicitly managed through the Analyses endpoint.
- **Feedback**: Represents user feedback on a specific analysis. Corresponds to the `Feedback` table.
- **Authentication**: Handles user registration and login. Corresponds to the `AspNetUsers` table managed by ASP.NET Identity.

## 2. Endpoints

### 2.1. Authentication

Authentication will be handled by the built-in endpoints provided by ASP.NET Identity. The following are conceptual representations.

- **POST `/api/auth/register`**
  - **Description**: Registers a new user.
  - **Request Payload**: `{ "email": "user@example.com", "password": "Password123!" }`
  - **Response Payload**: `{ "userId": "...", "token": "..." }`
  - **Success Code**: 201 Created
  - **Error Codes**: 400 Bad Request (invalid email, weak password), 409 Conflict (email already exists)

- **POST `/api/auth/login`**
  - **Description**: Logs in an existing user.
  - **Request Payload**: `{ "email": "user@example.com", "password": "Password123!" }`
  - **Response Payload**: `{ "userId": "...", "token": "..." }`
  - **Success Code**: 200 OK
  - **Error Codes**: 400 Bad Request, 401 Unauthorized (invalid credentials)

- **POST `/api/auth/forgot-password`**
  - **Description**: Initiates the password reset process for a user.
  - **Request Payload**: `{ "email": "user@example.com" }`
  - **Response Payload**: (Empty body)
  - **Success Code**: 200 OK
  - **Error Codes**: 400 Bad Request (invalid email format). Note: The endpoint should return 200 OK even if the email is not found to prevent user enumeration attacks.

- **POST `/api/auth/reset-password`**
  - **Description**: Resets the user's password using a token sent to their email.
  - **Request Payload**: `{ "email": "user@example.com", "token": "...", "newPassword": "NewPassword123!" }`
  - **Response Payload**: (Empty body)
  - **Success Code**: 200 OK
  - **Error Codes**: 400 Bad Request (invalid token, weak password, email does not match token).

### 2.2. Analyses

- **POST `/api/analyses`**
  - **Description**: Creates a new analysis for a product. This is the core endpoint that orchestrates scraping, LLM analysis, and database persistence. If the product (by name and URL) doesn't exist, it's created implicitly.
  - **Request Payload**:
    ```json
    {
      "productName": "Example Pet Food",
      "productUrl": "http://example.com/petfood",
      "ingredientsText": "Chicken, rice, ...", // Optional: only if scraping fails client-side
      "species": "Dog", // "Cat" or "Dog"
      "breed": "Golden Retriever",
      "age": 5,
      "additionalInfo": "My dog has a sensitive stomach." // Optional
    }
    ```
  - **Response Payload**:
    ```json
    {
      "analysisId": "uuid-goes-here",
      "productId": "uuid-goes-here",
      "recommendation": "Recommended",
      "justification": "This food contains high-quality protein sources...",
      "createdAt": "2025-10-13T10:00:00Z"
    }
    ```
  - **Success Code**: 201 Created
  - **Error Codes**: 400 Bad Request (missing required fields, invalid enum values), 401 Unauthorized, 503 Service Unavailable (if LLM or scraper fails)

- **GET `/api/analyses`**
  - **Description**: Retrieves a paginated list of the authenticated user's past analyses.
  - **Query Parameters**:
    - `productId` (UUID, optional): Filters analyses for a specific product (for version history).
    - `page` (int, optional, default: 1): The page number.
    - `pageSize` (int, optional, default: 10): The number of results per page.
  - **Response Payload**:
    ```json
    {
      "page": 1,
      "pageSize": 10,
      "totalCount": 100,
      "items": [
        {
          "analysisId": "uuid-goes-here",
          "productName": "Example Pet Food",
          "recommendation": "Recommended",
          "createdAt": "2025-10-13T10:00:00Z"
        }
      ]
    }
    ```
  - **Success Code**: 200 OK
  - **Error Codes**: 401 Unauthorized

- **GET `/api/analyses/{id}`**
  - **Description**: Retrieves a single analysis by its ID.
  - **Response Payload**:
    ```json
    {
      "analysisId": "uuid-goes-here",
      "productId": "uuid-goes-here",
      "productName": "Example Pet Food",
      "productUrl": "http://example.com/petfood",
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
  - **Success Code**: 200 OK
  - **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.3. Feedback

- **POST `/api/analyses/{analysisId}/feedback`**
  - **Description**: Submits feedback for a specific analysis.
  - **Request Payload**:
    ```json
    {
      "isPositive": true // true for thumbs-up, false for thumbs-down
    }
    ```
  - **Response Payload**: (Empty body)
  - **Success Code**: 201 Created
  - **Error Codes**: 400 Bad Request (invalid payload), 401 Unauthorized, 404 Not Found (if analysisId doesn't exist), 409 Conflict (user has already submitted feedback for this analysis).

## 3. Authentication and Authorization

- **Mechanism**: The API will use token-based authentication (e.g., JWT) managed by ASP.NET Identity. A token will be issued upon successful login.
- **Implementation**:
  - All endpoints under `/api/*` will require a valid authentication token in the `Authorization` header (e.g., `Authorization: Bearer <token>`).
  - Unauthenticated requests will receive a `401 Unauthorized` response.
  - Authorization logic will be implemented to enforce that users can only access their own analyses. This ensures data privacy.

## 4. Validation and Business Logic

### 4.1. Validation

Input validation will be performed at the API layer for all incoming requests based on the database schema constraints.

- **Analyses (`POST /api/analyses`)**:
  - `productName`: Required, non-empty string.
  - `productUrl`: Required, valid URL format.
  - `species`: Required, must be either 'Cat' or 'Dog'.
  - `age`: Required, must be a positive integer.
  - `breed`: Required, non-empty string.
  - If `(productName, productUrl)` combination already exists, the existing product record will be used.

- **Feedback (`POST /api/analyses/{analysisId}/feedback`)**:
  - `isPositive`: Required, must be a boolean.
  - The combination of `(analysisId, userId)` must be unique to prevent duplicate feedback.

### 4.2. Business Logic Implementation

- **Product Analysis (`POST /api/analyses`)**:
  - This endpoint will contain the core business logic.
  1.  **Find or Create Product**: It first queries for a `Product` with the provided `productName` and `productUrl`. If it doesn't exist, a new one is created.
  2.  **Scrape/Receive Ingredients**: If `ingredientsText` is not in the payload, it triggers a web scraping service.
  3.  **LLM Call**: It sends the ingredients and pet details to the LLM service for analysis.
  4.  **Persist Analysis**: It saves the LLM's response (`recommendation`, `justification`) as a new `Analysis` record, linked to the product and the authenticated user.
- **Analysis History & Versioning (`GET /api/analyses`)**:
  - To get a user's history, the endpoint queries the `Analyses` table filtered by the authenticated user's ID.
  - To get a product's version history, the client will pass the `productId` in the query string, which adds a filter to the database query. Both scenarios leverage the respective database indexes for performance.
