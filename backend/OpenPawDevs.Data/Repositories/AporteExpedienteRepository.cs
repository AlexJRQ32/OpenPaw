using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 132 - Aporte de expediente para veterinarias fuera de la plataforma </summary>
public class AporteExpedienteRepository : GenericRepository<AporteExpediente>, IAporteExpedienteRepository
{
    public AporteExpedienteRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<AporteExpediente>> GetByMascotaIdAsync(int mascotaId)
    {
        return await _context.AportesExpediente
            .AsNoTracking()
            .Where(a => a.MascotaId == mascotaId)
            .OrderByDescending(a => a.FechaAtencion)
            .ToListAsync();
    }
}
