using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace PetFoodVerifAI.Models;

[Table("Feedback")]
public class Feedback
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid FeedbackId { get; set; }

    [Required]
    [ForeignKey(nameof(Analysis))]
    public Guid AnalysisId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public bool IsPositive { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }


    public virtual Analysis Analysis { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual IdentityUser User { get; set; } = null!;
}


