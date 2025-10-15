using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs;

/// <summary>
/// Command model for submitting feedback for an analysis.
/// </summary>
public class CreateFeedbackRequest
{
    [Required]
    public bool? IsPositive { get; set; }
}
