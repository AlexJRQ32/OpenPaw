using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMascotaCamposSalud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EstadoSalud",
                table: "Mascotas",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Saludable");

            migrationBuilder.AddColumn<string>(
                name: "MedicacionActual",
                table: "Mascotas",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProximaMedicacionFecha",
                table: "Mascotas",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProximaVacuna",
                table: "Mascotas",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProximaVacunaFecha",
                table: "Mascotas",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstadoSalud",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "MedicacionActual",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "ProximaMedicacionFecha",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "ProximaVacuna",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "ProximaVacunaFecha",
                table: "Mascotas");
        }
    }
}
