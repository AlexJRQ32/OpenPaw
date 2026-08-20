using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 131 - Traslado de expediente entre veterinarias </summary>
public class TrasladoExpedienteRepository : GenericRepository<TrasladoExpediente>, ITrasladoExpedienteRepository
{
    public TrasladoExpedienteRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<TrasladoExpediente>> GetByPropietarioAsync(int propietarioId)
    {
        return await _context.TrasladosExpediente
            .AsNoTracking()
            .Where(t => t.Mascota != null && t.Mascota.DuenioId == propietarioId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TrasladoExpediente>> GetByVeterinariaDestinoAsync(int veterinariaDestinoId)
    {
        return await _context.TrasladosExpediente
            .AsNoTracking()
            .Where(t => t.VeterinariaDestinoId == veterinariaDestinoId)
            .ToListAsync();
    }

    public async Task<bool> ExisteTrasladoActivoAsync(int mascotaId, int veterinariaDestinoId)
    {
        return await _context.TrasladosExpediente
            .AnyAsync(t => t.MascotaId == mascotaId
                && t.VeterinariaDestinoId == veterinariaDestinoId
                && t.Estado == nameof(EstadoTraslado.Solicitado));
    }
}
