namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 9 - Marketplace: Productos veterinarios </summary>
public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public string? Categoria { get; set; }
    public string? Proveedor { get; set; }
    public string? ImagenUrl { get; set; }
    public string? UnidadMedida { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Inventario>? Inventarios { get; set; }
    public virtual ICollection<PedidoDetalle>? PedidoDetalles { get; set; }
}
