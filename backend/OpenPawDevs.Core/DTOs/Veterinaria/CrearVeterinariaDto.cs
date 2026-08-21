using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class CrearVeterinariaDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

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

    [Required]
    public string CedulaJuridica { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    // Sprint 1 - Tarea 6: campos del wireframe de Registro de Veterinaria.
    // Opcionales para no romper el contrato actual del frontend (envia nombre/cedulaJuridica/email);
    // se validan cuando vienen presentes.
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
}
