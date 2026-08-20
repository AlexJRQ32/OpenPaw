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
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    public virtual Producto? Producto { get; set; }
    public virtual Almacen? Almacen { get; set; }
}
