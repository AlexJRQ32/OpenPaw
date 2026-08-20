using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Traslado;

public class CrearTrasladoExpedienteDto
{
    [Range(1, int.MaxValue)]
    public int MascotaId { get; set; }

    [Range(1, int.MaxValue)]
    public int VeterinariaDestinoId { get; set; }

    [StringLength(1000)]
    public string? Comentario { get; set; }
}
