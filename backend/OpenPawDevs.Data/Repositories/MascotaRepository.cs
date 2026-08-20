using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 4 - Registrar Mascota: Acceso a datos de mascotas </summary>
public class MascotaRepository : GenericRepository<Mascota>, IMascotaRepository
{
    public MascotaRepository(AppDbContext context) : base(context) { }

    public override async Task<Mascota?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(m => m.Duenio)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IReadOnlyList<Mascota>> GetByDuenioIdAsync(int duenioId)
    {
        return await _context.Mascotas
            .AsNoTracking()
            .Where(m => m.DuenioId == duenioId && m.Activo)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Mascota>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _context.Mascotas
            .AsNoTracking()
            .Where(m => m.VeterinariaId == veterinariaId && m.Activo)
            .ToListAsync();
    }
}

