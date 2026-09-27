namespace MaterialCatalog.Api.Storage;

// Stores uploaded material pictures on disk and serves them from /images
public class ImageStorage(IWebHostEnvironment environment)
{
    public const string RequestPath = "/images";
    public const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    // Allowed content types and the extension the file is saved with
    private static readonly Dictionary<string, string> AllowedTypes = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
    };

    public string RootPath { get; } = Path.Combine(environment.ContentRootPath, "uploads");

    public static string? Validate(IFormFile file)
    {
        if (file.Length == 0)
        {
            return "The image is empty.";
        }

        if (file.Length > MaxFileSize)
        {
            return "The image must be 5 MB or smaller.";
        }

        if (!AllowedTypes.ContainsKey(file.ContentType.ToLowerInvariant()))
        {
            return "The image must be a JPEG, PNG, WebP or GIF.";
        }

        return null;
    }

    public async Task<string> SaveAsync(IFormFile file)
    {
        Directory.CreateDirectory(RootPath);

        // Never trust the client's file name, generate our own
        var fileName = $"{Guid.NewGuid()}{AllowedTypes[file.ContentType.ToLowerInvariant()]}";

        await using var stream = File.Create(Path.Combine(RootPath, fileName));
        await file.CopyToAsync(stream);

        return $"{RequestPath}/{fileName}";
    }

    public void Delete(string? imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
        {
            return;
        }

        var path = Path.Combine(RootPath, Path.GetFileName(imageUrl));
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }
}
