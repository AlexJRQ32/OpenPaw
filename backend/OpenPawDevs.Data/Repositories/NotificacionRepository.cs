using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 3/Epic 31 - Notificaciones del sistema </summary>
public class NotificacionRepository : GenericRepository<Notificacion>, INotificacionRepository
{
    public NotificacionRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Notificacion>> GetByUsuarioIdAsync(int usuarioId)
    {
        return await _context.Notificaciones
            .AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Notificacion>> GetNoLeidasAsync(int usuarioId)
    {
        return await _context.Notificaciones
            .AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId && !n.Leido)
            .ToListAsync();
    }

    public async Task MarkAsLeidasAsync(int usuarioId)
    {
        var notificaciones = await _context.Notificaciones
            .Where(n => n.UsuarioId == usuarioId && !n.Leido)
            .ToListAsync();

        foreach (var notificacion in notificaciones)
        {
            notificacion.Leido = true;
        }

        await _context.SaveChangesAsync();
    }
}
