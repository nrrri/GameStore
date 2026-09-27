using MaterialCatalog.Api.Data;
using MaterialCatalog.Api.Dtos;
using MaterialCatalog.Api.Models;
using MaterialCatalog.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace MaterialCatalog.Api.Endpoints;

public static class MaterialsEndpoints
{
    const string GetMaterialEndpointName = "GetMaterial";

    public static void MapMaterialsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/materials");

        // GET /materials
        group.MapGet(
            "/",
            async (MaterialCatalogContext dbContext) =>
                await dbContext
                    .Materials.Include(material => material.Category)
                    .Select(material => new MaterialSummaryDto(
                        material.Id,
                        material.Name,
                        material.Category!.Name,
                        material.Manufacturer,
                        material.Unit,
                        material.Width,
                        material.Depth,
                        material.Height,
                        material.UnitCost,
                        material.ImageUrl
                    ))
                    .AsNoTracking()
                    .ToListAsync()
        );

        // GET /materials/1
        group
            .MapGet(
                "/{id}",
                async (int id, MaterialCatalogContext dbContext) =>
                {
                    var material = await dbContext.Materials.FindAsync(id);

                    return material is null
                        ? Results.NotFound()
                        : Results.Ok(ToDetailsDto(material));
                }
            )
            .WithName(GetMaterialEndpointName);

        // POST /materials
        group.MapPost(
            "/",
            async (CreateMaterialDto newMaterial, MaterialCatalogContext dbContext) =>
            {
                Material material = new()
                {
                    Name = newMaterial.Name,
                    CategoryId = newMaterial.CategoryId,
                    Manufacturer = newMaterial.Manufacturer,
                    Unit = newMaterial.Unit,
                    Width = newMaterial.Width,
                    Depth = newMaterial.Depth,
                    Height = newMaterial.Height,
                    UnitCost = newMaterial.UnitCost,
                };

                dbContext.Materials.Add(material); // track data
                await dbContext.SaveChangesAsync(); // save to db

                var materialDto = ToDetailsDto(material);

                return Results.CreatedAtRoute(
                    GetMaterialEndpointName,
                    new { id = materialDto.Id },
                    materialDto
                );
            }
        );

        // PUT /materials/1
        group.MapPut(
            "/{id}",
            async (int id, UpdateMaterialDto updatedMaterial, MaterialCatalogContext dbContext) =>
            {
                var existingMaterial = await dbContext.Materials.FindAsync(id);
                if (existingMaterial is null)
                {
                    return Results.NotFound();
                }

                existingMaterial.Name = updatedMaterial.Name;
                existingMaterial.CategoryId = updatedMaterial.CategoryId;
                existingMaterial.Manufacturer = updatedMaterial.Manufacturer;
                existingMaterial.Unit = updatedMaterial.Unit;
                existingMaterial.Width = updatedMaterial.Width;
                existingMaterial.Depth = updatedMaterial.Depth;
                existingMaterial.Height = updatedMaterial.Height;
                existingMaterial.UnitCost = updatedMaterial.UnitCost;

                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            }
        );

        // DELETE /materials/1
        group.MapDelete(
            "/{id}",
            async (int id, MaterialCatalogContext dbContext, ImageStorage imageStorage) =>
            {
                var material = await dbContext.Materials.FindAsync(id);
                if (material is not null)
                {
                    dbContext.Materials.Remove(material);
                    await dbContext.SaveChangesAsync();

                    imageStorage.Delete(material.ImageUrl);
                }

                return Results.NoContent();
            }
        );

        // POST /materials/1/image (multipart/form-data, field "image")
        group
            .MapPost(
                "/{id}/image",
                async (
                    int id,
                    IFormFile image,
                    MaterialCatalogContext dbContext,
                    ImageStorage imageStorage
                ) =>
                {
                    var material = await dbContext.Materials.FindAsync(id);
                    if (material is null)
                    {
                        return Results.NotFound();
                    }

                    var error = ImageStorage.Validate(image);
                    if (error is not null)
                    {
                        return Results.ValidationProblem(
                            new Dictionary<string, string[]> { ["image"] = [error] }
                        );
                    }

                    // Save the new picture before removing the old one
                    var previousImageUrl = material.ImageUrl;
                    material.ImageUrl = await imageStorage.SaveAsync(image);
                    await dbContext.SaveChangesAsync();

                    imageStorage.Delete(previousImageUrl);

                    return Results.Ok(ToDetailsDto(material));
                }
            )
            // Called from a separate SPA, not a server-rendered form
            .DisableAntiforgery();

        // DELETE /materials/1/image
        group.MapDelete(
            "/{id}/image",
            async (int id, MaterialCatalogContext dbContext, ImageStorage imageStorage) =>
            {
                var material = await dbContext.Materials.FindAsync(id);
                if (material is null)
                {
                    return Results.NotFound();
                }

                var previousImageUrl = material.ImageUrl;
                material.ImageUrl = null;
                await dbContext.SaveChangesAsync();

                imageStorage.Delete(previousImageUrl);

                return Results.NoContent();
            }
        );
    }

    private static MaterialDetailsDto ToDetailsDto(Material material) =>
        new(
            material.Id,
            material.Name,
            material.CategoryId,
            material.Manufacturer,
            material.Unit,
            material.Width,
            material.Depth,
            material.Height,
            material.UnitCost,
            material.ImageUrl
        );
}
