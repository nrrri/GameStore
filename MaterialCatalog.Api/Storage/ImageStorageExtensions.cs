using Microsoft.Extensions.FileProviders;

namespace MaterialCatalog.Api.Storage;

public static class ImageStorageExtensions
{
    public static void AddImageStorage(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<ImageStorage>();
    }

    public static void UseImageStorage(this WebApplication app)
    {
        var imageStorage = app.Services.GetRequiredService<ImageStorage>();
        Directory.CreateDirectory(imageStorage.RootPath);

        app.UseStaticFiles(
            new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(imageStorage.RootPath),
                RequestPath = ImageStorage.RequestPath,
            }
        );
    }
}
