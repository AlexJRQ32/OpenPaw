namespace OpenPawDevs.Core.DTOs.Pedido;

public class PedidoDto
{
    public int Id { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public string VeterinariaOrigenNombre { get; set; } = string.Empty;
    public int VeterinariaDestinoId { get; set; }
    public string VeterinariaDestinoNombre { get; set; } = string.Empty;
    public DateTime FechaPedido { get; set; }
    public DateTime? FechaEntregaEstimada { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Comentario { get; set; }
    public decimal Total { get; set; }
}
