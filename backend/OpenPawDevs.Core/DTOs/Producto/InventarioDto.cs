namespace OpenPawDevs.Core.DTOs.Producto;

public class InventarioDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = string.Empty;
    public int AlmacenId { get; set; }
    public string AlmacenNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int StockMinimo { get; set; }
    public int StockMaximo { get; set; }
}
