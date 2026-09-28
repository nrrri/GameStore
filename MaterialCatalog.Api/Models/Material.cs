namespace MaterialCatalog.Api.Models;

public class Material
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public Category? Category { get; set; }
    public int CategoryId { get; set; }
    public required string Manufacturer { get; set; }

    // Unit of measure the cost refers to, e.g. "m²", "m", "sheet", "box", "each"
    public required string Unit { get; set; }

    // Optional nominal dimensions in millimetres
    public decimal? Width { get; set; }
    public decimal? Depth { get; set; }
    public decimal? Height { get; set; }
    public decimal UnitCost { get; set; }

    // Relative URL of the uploaded example picture, e.g. "/images/{guid}.jpg"
    public string? ImageUrl { get; set; }
}
