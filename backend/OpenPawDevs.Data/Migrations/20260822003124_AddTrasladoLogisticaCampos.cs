using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTrasladoLogisticaCampos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DestinoLatitud",
                table: "TrasladosExpediente",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DestinoLongitud",
                table: "TrasladosExpediente",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoLogistica",
                table: "TrasladosExpediente",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Programado");

            migrationBuilder.AddColumn<DateTime>(
                name: "EtaLlegada",
                table: "TrasladosExpediente",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OrigenLatitud",
                table: "TrasladosExpediente",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OrigenLongitud",
                table: "TrasladosExpediente",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Salida",
                table: "TrasladosExpediente",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinoLatitud",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "DestinoLongitud",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "EstadoLogistica",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "EtaLlegada",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "OrigenLatitud",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "OrigenLongitud",
                table: "TrasladosExpediente");

            migrationBuilder.DropColumn(
                name: "Salida",
                table: "TrasladosExpediente");
        }
    }
}
