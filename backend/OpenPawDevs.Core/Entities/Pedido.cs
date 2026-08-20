namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 9 - Marketplace: Pedidos entre comercios </summary>
public class Pedido
{
    public int Id { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public int VeterinariaDestinoId { get; set; }
    public DateTime FechaPedido { get; set; } = DateTime.UtcNow;
    public DateTime? FechaEntregaEstimada { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? Comentario { get; set; }
    public decimal Total { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Veterinaria? VeterinariaOrigen { get; set; }
    public virtual Veterinaria? VeterinariaDestino { get; set; }
    public virtual ICollection<PedidoDetalle> Detalles { get; set; } = new List<PedidoDetalle>();
}
