using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs;

public class CreateFeedbackRequest
{
    [Required]
    public bool? IsPositive { get; set; }
}
