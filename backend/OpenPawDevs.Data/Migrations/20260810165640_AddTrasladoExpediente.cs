using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTrasladoExpediente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrasladosExpediente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MascotaId = table.Column<int>(type: "int", nullable: false),
                    VeterinariaOrigenId = table.Column<int>(type: "int", nullable: false),
                    VeterinariaDestinoId = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaRespuesta = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SolicitadoPorId = table.Column<int>(type: "int", nullable: false),
                    Comentario = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    MotivoRechazo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrasladosExpediente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrasladosExpediente_Mascotas_MascotaId",
                        column: x => x.MascotaId,
                        principalTable: "Mascotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrasladosExpediente_Usuarios_SolicitadoPorId",
                        column: x => x.SolicitadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrasladosExpediente_Veterinarias_VeterinariaDestinoId",
                        column: x => x.VeterinariaDestinoId,
                        principalTable: "Veterinarias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrasladosExpediente_Veterinarias_VeterinariaOrigenId",
                        column: x => x.VeterinariaOrigenId,
                        principalTable: "Veterinarias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrasladosExpediente_MascotaId",
                table: "TrasladosExpediente",
                column: "MascotaId");

            migrationBuilder.CreateIndex(
                name: "IX_TrasladosExpediente_SolicitadoPorId",
                table: "TrasladosExpediente",
                column: "SolicitadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_TrasladosExpediente_VeterinariaDestinoId",
                table: "TrasladosExpediente",
                column: "VeterinariaDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_TrasladosExpediente_VeterinariaOrigenId",
                table: "TrasladosExpediente",
                column: "VeterinariaOrigenId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrasladosExpediente");
        }
    }
}
