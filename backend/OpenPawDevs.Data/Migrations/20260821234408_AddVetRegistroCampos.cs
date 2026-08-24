using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVetRegistroCampos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CorreoOficial",
                table: "Veterinarias",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitud",
                table: "Veterinarias",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitud",
                table: "Veterinarias",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nit",
                table: "Veterinarias",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RazonSocial",
                table: "Veterinarias",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CorreoOficial",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "Latitud",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "Longitud",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "Nit",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "RazonSocial",
                table: "Veterinarias");
        }
    }
}
