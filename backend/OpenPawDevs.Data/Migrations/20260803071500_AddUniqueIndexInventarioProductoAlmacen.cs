using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexInventarioProductoAlmacen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inventarios_ProductoId",
                table: "Inventarios");

            migrationBuilder.CreateIndex(
                name: "IX_Inventarios_ProductoId_AlmacenId",
                table: "Inventarios",
                columns: new[] { "ProductoId", "AlmacenId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inventarios_ProductoId_AlmacenId",
                table: "Inventarios");

            migrationBuilder.CreateIndex(
                name: "IX_Inventarios_ProductoId",
                table: "Inventarios",
                column: "ProductoId");
        }
    }
}
