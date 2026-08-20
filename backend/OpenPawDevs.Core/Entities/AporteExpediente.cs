using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.Entities;

/// <summary> PBI 132 - Aporte de expediente para veterinarias fuera de la plataforma </summary>
public class AporteExpediente
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int PropietarioId { get; set; }
    public string VeterinariaNombre { get; set; } = string.Empty;
    public DateTime FechaAtencion { get; set; }
    public TipoAtencion TipoAtencion { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string? Diagnostico { get; set; }
    public string? Medicamentos { get; set; }
    public string? ArchivoAdjuntoUrl { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public virtual Mascota? Mascota { get; set; }
    public virtual Usuario? Propietario { get; set; }
}
