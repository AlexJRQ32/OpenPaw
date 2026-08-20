using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Cita;

public class ReprogramarCitaDto
{
    [Required]
    public DateTime FechaHora { get; set; }
}
