namespace OpenPawDevs.Core.DTOs.Producto;

/// <summary>
/// Deuda #70: DTO público mínimo para marketplace.
/// Expone solo producto+precio+stock (sin datos internos como StockMinimo/Maximo, Lote, Ubicacion, AlmacenId sensible).
/// </summary>
public class InventarioPublicoDto
{
    public int InventarioId { get; set; }
    public int ProductoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public string? ImagenUrl { get; set; }
    public string? Categoria { get; set; }

    // Contexto mínimo para filtrar/agregar al carrito sin exponer datos sensibles.
    // AlmacenNombre / VeterinariaNombre son informativos, no exponen IDs internos sensibles más allá de lo necesario para UX.
    public string? AlmacenNombre { get; set; }
    public int? VeterinariaId { get; set; }
    public string? VeterinariaNombre { get; set; }
}
