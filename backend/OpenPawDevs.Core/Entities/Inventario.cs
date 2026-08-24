namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 9 - Marketplace: Control de stock en almacenes </summary>
public class Inventario
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public int AlmacenId { get; set; }
    public int Cantidad { get; set; }
    public int StockMinimo { get; set; }
    public int? StockMaximo { get; set; }

    // Sprint 1 - Tarea 8: campos del wireframe de Inventario.
    // Categoria normalizada a enum.ToString() (patron establecido en tarea 7);
    // Lote/Ubicacion/UnidadMedida como strings legibles para el frontend.
    public string? Categoria { get; set; }
    public string? Lote { get; set; }
    public string? Ubicacion { get; set; }
    public string? UnidadMedida { get; set; }
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    public virtual Producto? Producto { get; set; }
    public virtual Almacen? Almacen { get; set; }
}
