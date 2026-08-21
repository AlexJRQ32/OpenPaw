using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

/// <summary>
/// Sprint 1 - Tarea 6: actualizacion parcial de veterinaria.
/// Todos los campos son opcionales: null en el DTO preserva el valor actual en la entidad
/// (ver <see cref="VeterinariaMapeo.AplicarActualizacion"/>); cadena vacia ("") si sobrescribe
/// el campo (lo borra/vacia).
/// Los [StringLength] estan alineados con VeterinariaConfiguration para que un valor excesivo
/// falle con 400 por validacion y no con DbUpdateException (500).
/// </summary>
public class ActualizarVeterinariaDto
{
    [StringLength(150, MinimumLength = 2)]
    public string? RazonSocial { get; set; }

    [StringLength(30, MinimumLength = 6)]
    [RegularExpression(@"^[A-Za-z0-9][A-Za-z0-9.\-]*$", ErrorMessage = "El NIT/RUC solo puede contener letras, números, puntos y guiones.")]
    public string? Nit { get; set; }

    [EmailAddress(ErrorMessage = "El correo oficial debe ser un correo electrónico válido.")]
    [StringLength(100)]
    public string? CorreoOficial { get; set; }

    [Range(-90d, 90d, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    public decimal? Latitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    public decimal? Longitud { get; set; }

    [StringLength(300)]
    public string? Direccion { get; set; }

    [StringLength(20)]
    public string? Telefono { get; set; }

    [StringLength(100)]
    public string? Email { get; set; }

    [StringLength(50)]
    public string? Horario { get; set; }

    [StringLength(500)]
    public string? LogoUrl { get; set; }

    [StringLength(1000)]
    public string? Descripcion { get; set; }
}