using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Producto;

public class ActualizarInventarioDto
{
    [Range(0, int.MaxValue)]
    public int Cantidad { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockMinimo { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockMaximo { get; set; }
}
