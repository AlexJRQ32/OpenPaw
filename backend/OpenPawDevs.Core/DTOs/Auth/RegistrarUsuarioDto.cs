using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Auth;

public class RegistrarUsuarioDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? Telefono { get; set; }

    public string? Direccion { get; set; }
}
