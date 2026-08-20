using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Traslado;

public class RechazarTrasladoDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string MotivoRechazo { get; set; } = string.Empty;
}
