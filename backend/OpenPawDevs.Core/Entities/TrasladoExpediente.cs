namespace OpenPawDevs.Core.Entities;

/// <summary> PBI 131 - Traslado de expediente entre veterinarias </summary>
public class TrasladoExpediente
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public int VeterinariaDestinoId { get; set; }
    public string Estado { get; set; } = "Solicitado";
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    public DateTime? FechaRespuesta { get; set; }
    public int SolicitadoPorId { get; set; }
    public string? Comentario { get; set; }
    public string? MotivoRechazo { get; set; }

    public virtual Mascota? Mascota { get; set; }
    public virtual Veterinaria? VeterinariaOrigen { get; set; }
    public virtual Veterinaria? VeterinariaDestino { get; set; }
    public virtual Usuario? SolicitadoPor { get; set; }
}
