using MaterialCatalog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MaterialCatalog.Api.Data;

public class MaterialCatalogContext(DbContextOptions<MaterialCatalogContext> options): DbContext(options)
{
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Cladding and surface material categories. Seeded through migrations, so
        // adding or renaming one here needs a new migration (dotnet ef migrations add ...).
        // Keep existing Ids stable: materials reference categories by Id.
        modelBuilder
            .Entity<Category>()
            .HasData(
                new Category { Id = 1, Name = "Ceramic Tile" },
                new Category { Id = 2, Name = "Porcelain Tile" },
                new Category { Id = 3, Name = "Natural Stone" },
                new Category { Id = 4, Name = "Brick" },
                new Category { Id = 5, Name = "Terracotta" },
                new Category { Id = 6, Name = "Timber Cladding" },
                new Category { Id = 7, Name = "Metal Cladding" },
                new Category { Id = 8, Name = "Fibre Cement" },
                new Category { Id = 9, Name = "Composite Panel" },
                new Category { Id = 10, Name = "Glass" },
                new Category { Id = 11, Name = "Render & Plaster" }
            );
    }
}
