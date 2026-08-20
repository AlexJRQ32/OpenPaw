using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class CrearVeterinariaDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    public string? Direccion { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    public string? Horario { get; set; }

    public string? LogoUrl { get; set; }

    [Required]
    public string CedulaJuridica { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}
