namespace OpenPawDevs.Core.DTOs.Cita;

public class CitaDto
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public string MascotaNombre { get; set; } = string.Empty;
    public int VeterinariaId { get; set; }
    public string VeterinariaNombre { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Servicio { get; set; }
    public string? Notas { get; set; }
    public decimal? Costo { get; set; }
}
