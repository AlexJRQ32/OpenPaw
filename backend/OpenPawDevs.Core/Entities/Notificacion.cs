namespace OpenPawDevs.Core.Entities;

/// <summary> Epic 3/Epic 31 - Notificaciones del sistema </summary>
public class Notificacion
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public int Tipo { get; set; }
    public string? ReferenciaUrl { get; set; }
    public bool Leido { get; set; }
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;

    public virtual Usuario? Usuario { get; set; }
}
