# PetFoodVerifAI - PostgreSQL Database Schema

This document outlines the database schema for the PetFoodVerifAI application, designed based on the PRD, tech stack, and planning session notes.

## 1. Tables and Data Types

### ENUM Types

To ensure data integrity for categorical fields, the following ENUM types will be created:

```sql
CREATE TYPE species_enum AS ENUM ('Cat', 'Dog');
CREATE TYPE recommendation_enum AS ENUM ('Recommended', 'Not Recommended');
```

### Table Definitions

#### `AspNetUsers`
This is the standard table provided by ASP.NET Identity for user management. It will be used as the central repository for user data.
- **Primary Key:** `Id` (TEXT)

---

#### `Products`
Stores unique product information. A product is uniquely identified by the combination of its name and URL.

| Column Name   | Data Type   | Constraints                                       | Description                               |
|---------------|-------------|---------------------------------------------------|-------------------------------------------|
| `ProductId`   | `UUID`      | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`        | Unique identifier for the product.        |
| `ProductName` | `TEXT`      | `NOT NULL`                                        | The name of the pet food product.         |
| `ProductUrl`  | `TEXT`      | `NOT NULL`                                        | The URL of the product page.              |
| `CreatedAt`   | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT NOW()`                       | Timestamp of when the product was added.  |
| **Constraint**| `UNIQUE`    | `(ProductName, ProductUrl)`                       | Ensures each product entry is unique.     |

---

#### `Analyses`
The central table storing the results of all analyses.

| Column Name       | Data Type             | Constraints                                       | Description                                                |
|-------------------|-----------------------|---------------------------------------------------|------------------------------------------------------------|
| `AnalysisId`      | `UUID`                | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`        | Unique identifier for the analysis.                        |
| `ProductId`       | `UUID`                | `NOT NULL`, `REFERENCES Products(ProductId)`      | Foreign key to the `Products` table.                       |
| `UserId`          | `TEXT`                | `NOT NULL`, `REFERENCES AspNetUsers(Id)`          | Foreign key to the user who requested the analysis.        |
| `Recommendation`  | `recommendation_enum` | `NOT NULL`                                        | The final verdict ("Recommended" or "Not Recommended").    |
| `Justification`   | `TEXT`                | `NOT NULL`                                        | The LLM-generated reason for the recommendation.           |
| `IngredientsText` | `TEXT`                | `NOT NULL`                                        | The raw ingredient list used for the analysis.             |
| `Species`         | `species_enum`        | `NOT NULL`                                        | The pet species for which the analysis was run.            |
| `Breed`           | `TEXT`                | `NULL`                                            | The pet's breed (free-text input).                         |
| `Age`             | `INTEGER`             | `NULL`                                            | The pet's age in years.                                    |
| `AdditionalInfo`  | `TEXT`                | `NULL`                                            | Optional additional info provided by the user.             |
| `CreatedAt`       | `TIMESTAMPTZ`         | `NOT NULL`, `DEFAULT NOW()`                       | Timestamp of when the analysis was created.                |

---

#### `Feedback`
Stores user feedback (thumbs up/down) on the quality of a specific analysis.

| Column Name  | Data Type   | Constraints                                       | Description                                         |
|--------------|-------------|---------------------------------------------------|-----------------------------------------------------|
| `FeedbackId` | `UUID`      | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`        | Unique identifier for the feedback entry.           |
| `AnalysisId` | `UUID`      | `NOT NULL`, `REFERENCES Analyses(AnalysisId)`     | Foreign key to the analysis being reviewed.         |
| `UserId`     | `TEXT`      | `NOT NULL`, `REFERENCES AspNetUsers(Id)`          | Foreign key to the user providing the feedback.     |
| `IsPositive` | `BOOLEAN`   | `NOT NULL`                                        | `TRUE` for "thumbs up", `FALSE` for "thumbs down".  |
| `CreatedAt`  | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT NOW()`                       | Timestamp of when the feedback was submitted.       |
| **Constraint**| `UNIQUE`    | `(AnalysisId, UserId)`                            | Prevents a user from giving multiple feedback entries for the same analysis. |


## 2. Relationships

- **`AspNetUsers` to `Analyses`**: `One-to-Many`. A user can have multiple analyses.
- **`Products` to `Analyses`**: `One-to-Many`. A product can have multiple analyses, enabling version history.
- **`Analyses` to `Feedback`**: `One-to-Many`. An analysis can have multiple feedback entries from different users.
- **`AspNetUsers` to `Feedback`**: `One-to-Many`. A user can provide feedback on many different analyses.

## 3. Indexes

To optimize query performance, especially for retrieving user histories and product analysis versions, the following indexes will be created:

```sql
-- Index to quickly retrieve all analyses for a specific product (version history)
CREATE INDEX idx_analyses_product_id ON Analyses(ProductId);

-- Index to quickly retrieve all analyses for a specific user (personal history)
CREATE INDEX idx_analyses_user_id ON Analyses(UserId);

-- Indexes on foreign keys in the Feedback table
CREATE INDEX idx_feedback_analysis_id ON Feedback(AnalysisId);
CREATE INDEX idx_feedback_user_id ON Feedback(UserId);
```

## 4. PostgreSQL Policies (Row-Level Security)

To ensure users can only access their own data, Row-Level Security (RLS) will be enabled on the `Analyses` table.

```sql
-- 1. Enable RLS on the Analyses table
ALTER TABLE Analyses ENABLE ROW LEVEL SECURITY;

-- 2. Create the policy
CREATE POLICY analyses_rls_policy ON Analyses
FOR ALL
USING (
    -- Users can only read their own personal analyses
    (UserId = current_user_id())
)
WITH CHECK (
    -- Users can only write (INSERT, UPDATE) to their own records
    UserId = current_user_id()
);
```
_Note: `current_user_id()` is a placeholder for the function that will be implemented in the application logic to retrieve the current user's ID from the session._

## 5. Design Notes

- **Primary Keys**: `UUID` is used for all primary keys to avoid enumeration attacks and to simplify integration in distributed systems.
- **Timestamps**: `TIMESTAMPTZ` is used for all date/time fields to ensure time zone correctness across the application.
- **ASP.NET Identity Integration**: The `UserId` foreign key is of type `TEXT` to match the default `Id` column type in the `AspNetUsers` table from ASP.NET Identity.
