using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenPawDevs.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexIdCorporativo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // M1 (Code Review): limpieza previa de duplicados de IdCorporativo antes de crear el
            // indice unico. Se verifico con query que la BD local (OpenPawDevs) tiene 0 duplicados,
            // pero se incluye la limpieza como defensa para ambientes con datos existentes:
            // a cada duplicado (todos excepto el de menor Id por grupo) se le asigna un sufijo
            // "-NNNN" unico dentro del grupo (ej OP-VET-0042 -> OP-VET-0042-0002).
            migrationBuilder.Sql("""
                WITH Duplicados AS (
                    SELECT Id, IdCorporativo,
                           ROW_NUMBER() OVER (PARTITION BY IdCorporativo ORDER BY Id) AS rn
                    FROM Usuarios
                    WHERE IdCorporativo IS NOT NULL
                )
                UPDATE u
                SET u.IdCorporativo = LEFT(u.IdCorporativo + '-' + RIGHT('0000' + CAST(d.rn AS NVARCHAR(10)), 4), 20)
                FROM Usuarios u
                INNER JOIN Duplicados d ON u.Id = d.Id
                WHERE d.rn > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_IdCorporativo",
                table: "Usuarios",
                column: "IdCorporativo",
                unique: true,
                filter: "[IdCorporativo] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Usuarios_IdCorporativo",
                table: "Usuarios");
        }
    }
}
