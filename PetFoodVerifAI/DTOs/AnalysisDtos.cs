using PetFoodVerifAI.Models;
using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs;

/// <summary>
/// Command model for creating a new analysis.
/// </summary>
public class CreateAnalysisRequest
{
    [Required]
    public string ProductName { get; set; } = string.Empty;

    [Required]
    [Url]
    public string ProductUrl { get; set; } = string.Empty;

    public string? IngredientsText { get; set; }

    [Required]
    public Species Species { get; set; }

    [Required]
    public string Breed { get; set; } = string.Empty;

    [Required]
    public int Age { get; set; }

    public string? AdditionalInfo { get; set; }
}

/// <summary>
/// DTO for the response after creating an analysis.
/// </summary>
public class AnalysisCreatedResponse
{
    public Guid AnalysisId { get; set; }
    public Guid ProductId { get; set; }
    public Recommendation Recommendation { get; set; }
    public string Justification { get; set; } = string.Empty;
    public List<IngredientConcernDto> Concerns { get; set; } = new List<IngredientConcernDto>();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for ingredient concerns in the analysis response.
/// </summary>
public class IngredientConcernDto
{
    public string Type { get; set; } = string.Empty; // "questionable" or "unacceptable"
    public string Ingredient { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// DTO for a paginated list of analysis summaries.
/// </summary>
public class PaginatedAnalysesResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalCount { get; set; }
    public IEnumerable<AnalysisSummaryDto> Items { get; set; } = new List<AnalysisSummaryDto>();
}


/// <summary>
/// DTO for a summary of an analysis, used in lists.
/// </summary>
public class AnalysisSummaryDto
{
    public Guid AnalysisId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Recommendation Recommendation { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for the detailed view of a single analysis.
/// </summary>
public class AnalysisDetailDto
{
    public Guid AnalysisId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductUrl { get; set; } = string.Empty;
    public bool IsGeneral { get; set; }
    public Recommendation Recommendation { get; set; }
    public string Justification { get; set; } = string.Empty;
    public string IngredientsText { get; set; } = string.Empty;
    public Species Species { get; set; }
    public string? Breed { get; set; }
    public int? Age { get; set; }
    public string? AdditionalInfo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AnalysisDetailsDto
{
      public Guid AnalysisId { get; set; }
      public Guid ProductId { get; set; }
      public string ProductName { get; set; }
      public string ProductUrl { get; set; }
      public bool IsGeneral { get; set; }
      public Recommendation Recommendation { get; set; }
      public string Justification { get; set; }
      public string IngredientsText { get; set; }
      public Species Species { get; set; }
      public string? Breed { get; set; }
      public int? Age { get; set; }
      public string? AdditionalInfo { get; set; }
      public DateTime CreatedAt { get; set; }
}