using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MaterialCatalog.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceEmbodiedCarbonWithImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmbodiedCarbon",
                table: "Materials");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Materials",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Materials");

            migrationBuilder.AddColumn<decimal>(
                name: "EmbodiedCarbon",
                table: "Materials",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
