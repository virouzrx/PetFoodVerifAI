using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs;

public class GetAnalysesQueryParameters
{
    public Guid? ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)] // Cap page size for performance
    public int PageSize { get; set; } = 10;
}
