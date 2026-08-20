namespace OpenPawDevs.Core.DTOs.Pedido;

/// <summary> Epic 9 - Marketplace: Detalle de producto en un pedido </summary>
public class PedidoDetalleDto
{
    public int ProductoId { get; set; }
    public string? ProductoNombre { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
