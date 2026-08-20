using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Producto;

public class CrearProductoDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    [Required]
    public decimal Precio { get; set; }

    public string? Categoria { get; set; }

    public string? Proveedor { get; set; }

    public string? ImagenUrl { get; set; }

    public string? UnidadMedida { get; set; }
}
