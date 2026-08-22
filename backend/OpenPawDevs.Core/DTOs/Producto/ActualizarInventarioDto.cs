using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Producto;

public class ActualizarInventarioDto
{
    // Fix M1 (Code Review QA): Cantidad anulable para que el update parcial la preserve
    // cuando el cliente no la envia (patron del resto de campos: null preserva).
    [Range(0, int.MaxValue)]
    public int? Cantidad { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockMinimo { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockMaximo { get; set; }

    // Sprint 1 - Tarea 8: campos del wireframe de Inventario (update parcial: null preserva).
    // Categoria validada en el controller con Enum.TryParse+IsDefined -> 400 y
    // normalizada a enum.ToString() (patron tarea 7).
    [StringLength(30)]
    public string? Categoria { get; set; }

    [StringLength(50)]
    public string? Lote { get; set; }

    [StringLength(50)]
    public string? Ubicacion { get; set; }

    [StringLength(20)]
    public string? UnidadMedida { get; set; }
}
