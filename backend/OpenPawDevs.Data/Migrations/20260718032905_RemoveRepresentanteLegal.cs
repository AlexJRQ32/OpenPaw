using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRepresentanteLegal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RepresentanteLegalIdentificacion",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "RepresentanteLegalNombre",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "RepresentanteLegalRol",
                table: "Veterinarias");

            migrationBuilder.DropColumn(
                name: "RepresentanteLegalIdentificacion",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "RepresentanteLegalNombre",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "RepresentanteLegalRol",
                table: "Almacenes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalIdentificacion",
                table: "Veterinarias",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalNombre",
                table: "Veterinarias",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalRol",
                table: "Veterinarias",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalIdentificacion",
                table: "Almacenes",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalNombre",
                table: "Almacenes",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepresentanteLegalRol",
                table: "Almacenes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
