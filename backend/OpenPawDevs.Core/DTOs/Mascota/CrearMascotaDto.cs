using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Mascota;

public class CrearMascotaDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    public string Especie { get; set; } = string.Empty;

    public string? Raza { get; set; }

    [Required]
    public int Sexo { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    public decimal? Peso { get; set; }

    public string? Color { get; set; }

    public string? Identificacion { get; set; }

    public string? FotoUrl { get; set; }
}
