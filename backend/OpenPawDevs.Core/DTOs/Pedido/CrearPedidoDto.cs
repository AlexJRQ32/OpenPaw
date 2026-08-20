using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Pedido;

public class CrearPedidoDto
{
    [Required]
    public int VeterinariaOrigenId { get; set; }

    [Required]
    public int VeterinariaDestinoId { get; set; }

    public string? Comentario { get; set; }

    public List<PedidoDetalleDto> Detalles { get; set; } = new();
}
