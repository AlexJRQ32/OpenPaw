using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Producto;

public class CrearInventarioDto
{
    [Range(1, int.MaxValue)]
    public int ProductoId { get; set; }

    [Range(1, int.MaxValue)]
    public int AlmacenId { get; set; }

    [Range(0, int.MaxValue)]
    public int Cantidad { get; set; }

    [Range(0, int.MaxValue)]
    public int StockMinimo { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockMaximo { get; set; }

    // Sprint 1 - Tarea 8: campos del wireframe de Inventario.
    // Categoria es un string legible validado en el controller con Enum.TryParse+IsDefined
    // (Antibiotico | Biologicos | Quirurgico | Consumibles) y normalizado a enum.ToString().
    // Opcionales para no romper el contrato del frontend actual (patron tarea 7).
    [StringLength(30)]
    public string? Categoria { get; set; }

    [StringLength(50)]
    public string? Lote { get; set; }

    [StringLength(50)]
    public string? Ubicacion { get; set; }

    [StringLength(20)]
    public string? UnidadMedida { get; set; }
}
