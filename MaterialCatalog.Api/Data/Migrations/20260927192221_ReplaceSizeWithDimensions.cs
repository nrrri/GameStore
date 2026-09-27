using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MaterialCatalog.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceSizeWithDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Free-text sizes like "600 × 600 × 10 mm" cannot be converted to
            // numbers reliably, so the old column is dropped rather than renamed
            migrationBuilder.DropColumn(
                name: "Size",
                table: "Materials");

            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "Materials",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Depth",
                table: "Materials",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Height",
                table: "Materials",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Depth",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "Materials");

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "Materials",
                type: "TEXT",
                nullable: true);
        }
    }
}
