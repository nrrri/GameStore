using Microsoft.EntityFrameworkCore;

namespace MaterialCatalog.Api.Data;

public static class DataExtensions
{
    public static void MigrateDb(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<MaterialCatalogContext>();
        dbContext.Database.Migrate();
    }

    public static void AddMaterialCatalogDb(this WebApplicationBuilder builder)
    {
        var connString = builder.Configuration.GetConnectionString("MaterialCatalog");
        
        // DbContext has a Scoped service lifetime because:
        // 1. It ensures that a new instance of DbContext is creates per request
        // 2. Db connections are a limited and expensive resource
        // 3. DbContext us not thread-safe. Scoped avoids to concurrency issues
        // 4. Makes it easier to manage transactions and ensure data consistency
        // 5. Reusing a DbContext instance can lead to increased memory usage
        
        // Categories are seeded in MaterialCatalogContext.OnModelCreating
        builder.Services.AddSqlite<MaterialCatalogContext>(connString);
    }
}
