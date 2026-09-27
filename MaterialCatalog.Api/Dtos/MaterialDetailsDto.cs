namespace MaterialCatalog.Api.Dtos;

public record class MaterialDetailsDto
(
    int Id,
    string Name,
    int CategoryId,
    string Manufacturer,
    string Unit,
    decimal? Width,
    decimal? Depth,
    decimal? Height,
    decimal UnitCost,
    string? ImageUrl
);
