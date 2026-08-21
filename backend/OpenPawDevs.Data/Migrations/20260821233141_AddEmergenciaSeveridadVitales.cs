using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmergenciaSeveridadVitales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Diagnostico",
                table: "Emergencias",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoPaciente",
                table: "Emergencias",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FrecuenciaCardiaca",
                table: "Emergencias",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicoACargo",
                table: "Emergencias",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NivelSeveridad",
                table: "Emergencias",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Nivel1_Critico");

            migrationBuilder.AddColumn<int>(
                name: "SaturacionO2",
                table: "Emergencias",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Temperatura",
                table: "Emergencias",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Diagnostico",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "EstadoPaciente",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "FrecuenciaCardiaca",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "MedicoACargo",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "NivelSeveridad",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "SaturacionO2",
                table: "Emergencias");

            migrationBuilder.DropColumn(
                name: "Temperatura",
                table: "Emergencias");
        }
    }
}
