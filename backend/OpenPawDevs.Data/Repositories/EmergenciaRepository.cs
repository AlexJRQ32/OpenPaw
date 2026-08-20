using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 133 - Atención de emergencias (veterinario no cabecera, dentro y fuera de la plataforma) </summary>
public class EmergenciaRepository : GenericRepository<Emergencia>, IEmergenciaRepository
{
    public EmergenciaRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Emergencia>> GetByMascotaIdAsync(int mascotaId)
    {
        return await _context.Emergencias
            .AsNoTracking()
            .Where(e => e.MascotaId == mascotaId)
            .ToListAsync();
    }
}
