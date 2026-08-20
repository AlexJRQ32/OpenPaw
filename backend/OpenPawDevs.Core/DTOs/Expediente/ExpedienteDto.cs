namespace OpenPawDevs.Core.DTOs.Expediente;

public class ExpedienteDto
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public string MascotaNombre { get; set; } = string.Empty;
    public int VeterinariaId { get; set; }
    public string VeterinariaNombre { get; set; } = string.Empty;
    public DateTime FechaConsulta { get; set; }
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
    public string? Observaciones { get; set; }
    public string? RecetaUrl { get; set; }
    public string? ArchivoUrl { get; set; }
}
