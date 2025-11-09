using PetFoodVerifAI.Models;
using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs;

public class CreateAnalysisRequest
{
    // NEW: Explicit flag to indicate input mode
    [Required]
    public bool IsManual { get; set; }
    
    // Optional - required based on IsManual flag
    public string? ProductName { get; set; }
    
    // Optional - required if IsManual = false
    public string? ProductUrl { get; set; }

    // Optional - required if IsManual = true, otherwise scraped
    public string? IngredientsText { get; set; }

    [Required]
    public Species Species { get; set; }

    [Required]
    public string Breed { get; set; } = string.Empty;

    [Required]
    public int Age { get; set; }

    public string? AdditionalInfo { get; set; }
}

public class AnalysisCreatedResponse
{
    public Guid AnalysisId { get; set; }
    public Guid ProductId { get; set; }
    public Recommendation Recommendation { get; set; }
    public string Justification { get; set; } = string.Empty;
    public List<IngredientConcernDto> Concerns { get; set; } = new List<IngredientConcernDto>();
    public DateTime CreatedAt { get; set; }
}

public class IngredientConcernDto
{
    public string Type { get; set; } = string.Empty; // "questionable" or "unacceptable"
    public string Ingredient { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class PaginatedAnalysesResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalCount { get; set; }
    public IEnumerable<AnalysisSummaryDto> Items { get; set; } = new List<AnalysisSummaryDto>();
}


public class AnalysisSummaryDto
{
    public Guid AnalysisId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductUrl { get; set; } // Nullable for manual entries
    public bool IsManualEntry { get; set; } // Explicit flag to determine if product was manually entered
    public Recommendation Recommendation { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AnalysisDetailDto
{
    public Guid AnalysisId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductUrl { get; set; } // Nullable for manual entries
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
      public string ProductName { get; set; } = string.Empty;
      public string? ProductUrl { get; set; } // Nullable for manual entries
      public Recommendation Recommendation { get; set; }
      public string Justification { get; set; } = string.Empty;
      public List<IngredientConcernDto> Concerns { get; set; } = new List<IngredientConcernDto>();
      public string? IngredientsText { get; set; }
      public Species Species { get; set; }
      public string? Breed { get; set; }
      public int? Age { get; set; }
      public string? AdditionalInfo { get; set; }
      public DateTime CreatedAt { get; set; }
}