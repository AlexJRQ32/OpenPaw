using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Usuario;

public class ActualizarUsuarioDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [RegularExpression(@"^[0-9+\-\s]{8,15}$", ErrorMessage = "El teléfono debe tener entre 8 y 15 dígitos y solo puede contener números, espacios, '+' y '-'.")]
    public string? Telefono { get; set; }

    public string? Direccion { get; set; }

    [Url(ErrorMessage = "La foto de perfil debe ser una URL válida.")]
    [StringLength(500)]
    public string? FotoUrl { get; set; }

}
