using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 6 - Atender Consulta: Acceso a expedientes clínicos </summary>
public class ExpedienteRepository : GenericRepository<Expediente>, IExpedienteRepository
{
    public ExpedienteRepository(AppDbContext context) : base(context) { }

    public override async Task<Expediente?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(e => e.Mascota)
            .Include(e => e.Veterinaria)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<IReadOnlyList<Expediente>> GetByMascotaIdAsync(int mascotaId)
    {
        return await _context.Expedientes
            .AsNoTracking()
            .Include(e => e.Mascota)
            .Include(e => e.Veterinaria)
            .Where(e => e.MascotaId == mascotaId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Expediente>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _context.Expedientes
            .AsNoTracking()
            .Include(e => e.Mascota)
            .Include(e => e.Veterinaria)
            .Where(e => e.VeterinariaId == veterinariaId)
            .ToListAsync();
    }
}
