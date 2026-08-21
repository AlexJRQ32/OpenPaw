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

    // Sprint 1 - Tarea 7: campos del wireframe de Registro de Almacen.
    // Strings legibles (enum.ToString()) que el controller valida con Enum.TryParse+IsDefined
    // y rechaza con 400 si no pertenecen al enum.
    [StringLength(30)]
    public string? TipoAlmacen { get; set; }

    [StringLength(150, MinimumLength = 2)]
    public string? NombreResponsable { get; set; }

    [StringLength(30)]
    public string? CapacidadAlmacenamiento { get; set; }

    [StringLength(30)]
    public string? ControlTemperatura { get; set; }

    [Range(-90d, 90d, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    public decimal? Latitud { get; set; }

    [Range(-180d, 180d, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    public decimal? Longitud { get; set; }
}
