using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MaterialCatalog.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialSize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "Materials",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Size",
                table: "Materials");
        }
    }
}
