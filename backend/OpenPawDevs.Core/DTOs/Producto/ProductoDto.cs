namespace OpenPawDevs.Core.DTOs.Producto;

public class ProductoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public string? Categoria { get; set; }
    public string? Proveedor { get; set; }
    public string? ImagenUrl { get; set; }
    public string? UnidadMedida { get; set; }
    public bool Activo { get; set; }
}
