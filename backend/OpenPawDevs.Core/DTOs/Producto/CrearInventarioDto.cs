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
}
