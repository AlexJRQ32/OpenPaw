namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 9 - Marketplace: Detalle de productos en un pedido </summary>
public class PedidoDetalle
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }

    public virtual Pedido? Pedido { get; set; }
    public virtual Producto? Producto { get; set; }
}
