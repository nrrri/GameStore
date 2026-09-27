using MaterialCatalog.Api.Data;
using MaterialCatalog.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace MaterialCatalog.Api.Endpoints;

public static class CategoriesEndpoints
{
    public static void MapCategoriesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/categories");

        // GET /categories
        group.MapGet(
            "/",
            async (MaterialCatalogContext dbContext) =>
                await dbContext
                    .Categories.Select(category => new CategoryDto(category.Id, category.Name))
                    .AsNoTracking()
                    .ToListAsync()
        );
    }
}
