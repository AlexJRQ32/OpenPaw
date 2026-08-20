using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Usuario;

public class CrearFuncionarioDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Range(1, 3)]
    public int RolId { get; set; }

    public int? ComercioId { get; set; }
}
