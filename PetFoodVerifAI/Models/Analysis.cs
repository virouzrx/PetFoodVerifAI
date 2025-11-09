using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace PetFoodVerifAI.Models;

[Table("Analyses")]
public class Analysis
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid AnalysisId { get; set; }

    [Required]
    [ForeignKey(nameof(Product))]
    public Guid ProductId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public Recommendation Recommendation { get; set; }

    [Required]
    public string Justification { get; set; } = string.Empty;

    [Required]
    public string IngredientsText { get; set; } = string.Empty;

    [Required]
    public Species Species { get; set; }

    public string? Breed { get; set; }

    public int? Age { get; set; }

    public string? AdditionalInfo { get; set; }

    public string? ConcernsJson { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }


    public virtual Product Product { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual IdentityUser User { get; set; } = null!;

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
}


