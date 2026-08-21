using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAlmacenRegistroCampos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CapacidadAlmacenamiento",
                table: "Almacenes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ControlTemperatura",
                table: "Almacenes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitud",
                table: "Almacenes",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitud",
                table: "Almacenes",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreResponsable",
                table: "Almacenes",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoAlmacen",
                table: "Almacenes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapacidadAlmacenamiento",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "ControlTemperatura",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "Latitud",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "Longitud",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "NombreResponsable",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "TipoAlmacen",
                table: "Almacenes");
        }
    }
}
