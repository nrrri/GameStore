using System.ComponentModel.DataAnnotations;

namespace MaterialCatalog.Api.Dtos;

public record class CreateMaterialDto(
    [Required] [StringLength(100)] string Name,
    [Range(1, 50)] int CategoryId,
    [Required] [StringLength(100)] string Manufacturer,
    [Required] [StringLength(20)] string Unit,
    [Range(0, 100_000)] decimal? Width,
    [Range(0, 100_000)] decimal? Depth,
    [Range(0, 100_000)] decimal? Height,
    [Range(0, 1_000_000)] decimal UnitCost
);
