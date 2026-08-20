namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 6 - Compartir expedientes entre veterinarias </summary>
public class ExpedienteCompartido
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public int VeterinariaDestinoId { get; set; }
    public DateTime FechaCompartido { get; set; } = DateTime.UtcNow;
    public string Estado { get; set; } = "Pendiente";
    public string? TokenAcceso { get; set; }
    public DateTime? FechaExpiracion { get; set; }

    public virtual Expediente? Expediente { get; set; }
    public virtual Veterinaria? VeterinariaOrigen { get; set; }
    public virtual Veterinaria? VeterinariaDestino { get; set; }
}
