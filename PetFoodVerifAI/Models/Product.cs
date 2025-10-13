using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetFoodVerifAI.Models;

/// <summary>
/// Represents a unique pet food product identified by name and URL
/// </summary>
[Table("Products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid ProductId { get; set; }

    [Required]
    public string ProductName { get; set; } = string.Empty;

    [Required]
    public string ProductUrl { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; }


    // Navigation property
    public virtual ICollection<Analysis> Analyses { get; set; } = new List<Analysis>();
}


