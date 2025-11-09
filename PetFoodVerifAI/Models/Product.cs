using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetFoodVerifAI.Models;

[Table("Products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid ProductId { get; set; }

    [Required]
    public string ProductName { get; set; } = string.Empty;

    // Remove [Required] attribute, make nullable (null for manual entries)
    public string? ProductUrl { get; set; }

    // NEW: Explicit flag to track manual vs scraped products
    [Required]
    public bool IsManualEntry { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }


    public virtual ICollection<Analysis> Analyses { get; set; } = new List<Analysis>();
}


