namespace OpenPawDevs.Core.Entities;

/// <summary> PBI 50/PBI 52 - Gestión de Veterinarias y Aprobación </summary>
public class Veterinaria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Horario { get; set; }
    public string? LogoUrl { get; set; }
    public bool Activo { get; set; } = true;
    public bool Aprobada { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public string? CedulaJuridica { get; set; }
    public string? Descripcion { get; set; }
    public string? DocumentoPersoneriaJuridica { get; set; }

    // Sprint 1 - Tarea 6: Registro de veterinaria segun wireframe (Identidad Comercial + Ubicacion Fisica).
    // Campos nuevos alineados al wireframe; los existentes (Nombre/CedulaJuridica/Email) se conservan
    // porque el frontend actual los consume (no romper contrato).
    public string? RazonSocial { get; set; }
    public string? Nit { get; set; }
    public string? CorreoOficial { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public int UsuarioId { get; set; }
    public bool Rechazada { get; set; }
    public string? MotivoRechazo { get; set; }

    public virtual ICollection<Expediente>? Expedientes { get; set; }
    public virtual ICollection<Cita>? Citas { get; set; }
    public virtual ICollection<Almacen>? Almacenes { get; set; }
    public virtual ICollection<ServicioVeterinario>? Servicios { get; set; }
}
