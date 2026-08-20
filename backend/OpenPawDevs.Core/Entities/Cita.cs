using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 5 - Agendar Cita: Reserva de consulta veterinaria </summary>
public class Cita
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int VeterinariaId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? Servicio { get; set; }
    public CategoriaServicioVeterinario? Categoria { get; set; }
    public string? Notas { get; set; }
    public decimal? Costo { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Mascota? Mascota { get; set; }
    public virtual Veterinaria? Veterinaria { get; set; }
    public virtual Usuario? Usuario { get; set; }
}
