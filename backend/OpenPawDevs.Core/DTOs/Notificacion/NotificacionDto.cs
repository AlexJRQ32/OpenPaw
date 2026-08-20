namespace OpenPawDevs.Core.DTOs.Notificacion;

public class NotificacionDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string? ReferenciaUrl { get; set; }
    public bool Leido { get; set; }
    public DateTime FechaEnvio { get; set; }
}
