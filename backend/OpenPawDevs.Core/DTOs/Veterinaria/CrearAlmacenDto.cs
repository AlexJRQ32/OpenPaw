using System.ComponentModel.DataAnnotations;
namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class CrearAlmacenDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    public int? VeterinariaId { get; set; }

    public string? Direccion { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    [Required]
    public string CedulaJuridica { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public int? Tipo { get; set; }

    public bool Activo { get; set; } = true;
}
