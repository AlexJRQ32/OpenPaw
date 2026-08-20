using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Expediente;

public class CrearExpedienteDto
{
    [Required]
    public int MascotaId { get; set; }

    [Required]
    public int VeterinariaId { get; set; }

    public string? Diagnostico { get; set; }

    public string? Tratamiento { get; set; }

    public string? Observaciones { get; set; }

    public string? RecetaUrl { get; set; }

    public string? ArchivoUrl { get; set; }
}
