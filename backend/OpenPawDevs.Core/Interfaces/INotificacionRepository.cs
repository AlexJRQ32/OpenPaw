using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de notificaciones del sistema (Epic 3/Epic 31 - Notificaciones)
/// </summary>
public interface INotificacionRepository : IGenericRepository<Notificacion>
{
    Task<IReadOnlyList<Notificacion>> GetByUsuarioIdAsync(int usuarioId);
    Task<IReadOnlyList<Notificacion>> GetNoLeidasAsync(int usuarioId);
    Task MarkAsLeidasAsync(int usuarioId);
}
