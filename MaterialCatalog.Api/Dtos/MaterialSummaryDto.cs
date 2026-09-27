namespace MaterialCatalog.Api.Dtos;

// A DTO is a contract between the client and server since it represents
// shared agreement about how data will be transferred and used
public record class MaterialSummaryDto
(
    int Id,
    string Name,
    string Category,
    string Manufacturer,
    string Unit,
    decimal? Width,
    decimal? Depth,
    decimal? Height,
    decimal UnitCost,
    string? ImageUrl
);
