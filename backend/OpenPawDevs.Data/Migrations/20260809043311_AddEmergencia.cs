using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmergencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VeterinariaId",
                table: "Mascotas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Emergencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MascotaId = table.Column<int>(type: "int", nullable: false),
                    PropietarioId = table.Column<int>(type: "int", nullable: false),
                    VeterinariaId = table.Column<int>(type: "int", nullable: true),
                    VeterinariaNombreExterna = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    FechaAtencion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Sintomas = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    TratamientoAplicado = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EsEnPlataforma = table.Column<bool>(type: "bit", nullable: false),
                    ArchivoAdjuntoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Emergencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Emergencias_Mascotas_MascotaId",
                        column: x => x.MascotaId,
                        principalTable: "Mascotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Emergencias_Usuarios_PropietarioId",
                        column: x => x.PropietarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Emergencias_Veterinarias_VeterinariaId",
                        column: x => x.VeterinariaId,
                        principalTable: "Veterinarias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Mascotas_VeterinariaId",
                table: "Mascotas",
                column: "VeterinariaId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencias_MascotaId",
                table: "Emergencias",
                column: "MascotaId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencias_PropietarioId",
                table: "Emergencias",
                column: "PropietarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencias_VeterinariaId",
                table: "Emergencias",
                column: "VeterinariaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Mascotas_Veterinarias_VeterinariaId",
                table: "Mascotas",
                column: "VeterinariaId",
                principalTable: "Veterinarias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mascotas_Veterinarias_VeterinariaId",
                table: "Mascotas");

            migrationBuilder.DropTable(
                name: "Emergencias");

            migrationBuilder.DropIndex(
                name: "IX_Mascotas_VeterinariaId",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "VeterinariaId",
                table: "Mascotas");
        }
    }
}
