using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MaterialCatalog.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CladdingCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Databases created before this migration already hold rows 1-7 (the old
            // MasterFormat categories seeded at startup), so a plain InsertData would hit
            // a primary key conflict. Upsert instead: existing rows are renamed, missing
            // rows are inserted, and materials keep their CategoryId.
            migrationBuilder.Sql(
                """
                INSERT INTO "Categories" ("Id", "Name") VALUES
                    (1, 'Ceramic Tile'),
                    (2, 'Porcelain Tile'),
                    (3, 'Natural Stone'),
                    (4, 'Brick'),
                    (5, 'Terracotta'),
                    (6, 'Timber Cladding'),
                    (7, 'Metal Cladding'),
                    (8, 'Fibre Cement'),
                    (9, 'Composite Panel'),
                    (10, 'Glass'),
                    (11, 'Render & Plaster')
                ON CONFLICT ("Id") DO UPDATE SET "Name" = excluded."Name";
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 11);
        }
    }
}
