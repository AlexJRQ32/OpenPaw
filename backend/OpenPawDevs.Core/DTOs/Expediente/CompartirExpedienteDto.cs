using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Expediente;

public class CompartirExpedienteDto
{
    [Required]
    public int ExpedienteId { get; set; }

    [Required]
    public int VeterinariaDestinoId { get; set; }
}
