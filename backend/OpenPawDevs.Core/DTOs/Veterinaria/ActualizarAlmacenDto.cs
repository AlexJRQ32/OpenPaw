using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

/// <summary>
/// Sprint 1 - Tarea 7: actualizacion parcial de almacen.
/// Todos los campos son opcionales: null en el DTO preserva el valor actual en la entidad
/// (ver <see cref="AlmacenMapeo.AplicarActualizacion"/>); cadena vacia ("") si sobrescribe
/// el campo (lo borra/vacia).
/// Los [StringLength] estan alineados con AlmacenConfiguration para que un valor excesivo
/// falle con 400 por validacion y no con DbUpdateException (500).
/// </summary>
public class ActualizarAlmacenDto
{
    public int Id { get; set; }

    [StringLength(150, MinimumLength = 2)]
    public string? Nombre { get; set; }

    public int? VeterinariaId { get; set; }

    [StringLength(30)]
    public string? CedulaJuridica { get; set; }

    [StringLength(20)]
    public string? Telefono { get; set; }

    [StringLength(100)]
    public string? Email { get; set; }

    [StringLength(300)]
    public string? Direccion { get; set; }

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [StringLength(500)]
    public string? MotivoRechazo { get; set; }

    public int? Tipo { get; set; }

    public bool? Activo { get; set; }

    public bool? Aprobada { get; set; }

    public bool? Rechazada { get; set; }

    public DateTime? FechaRegistro { get; set; }

    // Sprint 1 - Tarea 7: campos del wireframe de Registro de Almacen.
    // Strings legibles (enum.ToString()) validados con Enum.TryParse+IsDefined -> 400.
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