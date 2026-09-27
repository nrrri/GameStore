using MaterialCatalog.Api.Data;
using MaterialCatalog.Api.Endpoints;
using MaterialCatalog.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddValidation();
builder.AddMaterialCatalogDb();
builder.AddImageStorage();

var app = builder.Build();

app.UseImageStorage();

app.MapMaterialsEndpoints();
app.MapCategoriesEndpoints();

app.MigrateDb();

app.Run();
