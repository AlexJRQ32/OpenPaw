using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAporteExpediente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AportesExpediente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MascotaId = table.Column<int>(type: "int", nullable: false),
                    PropietarioId = table.Column<int>(type: "int", nullable: false),
                    VeterinariaNombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FechaAtencion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoAtencion = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Diagnostico = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Medicamentos = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ArchivoAdjuntoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AportesExpediente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AportesExpediente_Mascotas_MascotaId",
                        column: x => x.MascotaId,
                        principalTable: "Mascotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AportesExpediente_Usuarios_PropietarioId",
                        column: x => x.PropietarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AportesExpediente_MascotaId",
                table: "AportesExpediente",
                column: "MascotaId");

            migrationBuilder.CreateIndex(
                name: "IX_AportesExpediente_PropietarioId",
                table: "AportesExpediente",
                column: "PropietarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AportesExpediente");
        }
    }
}
