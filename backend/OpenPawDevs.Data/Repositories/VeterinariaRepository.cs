using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 50/PBI 52 - Solicitud y Aprobación de Veterinaria </summary>
public class VeterinariaRepository : GenericRepository<Veterinaria>, IVeterinariaRepository
{
    public VeterinariaRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Veterinaria>> GetAprobadasAsync()
    {
        return await _context.Veterinarias
            .AsNoTracking()
            .Where(v => v.Aprobada)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Veterinaria>> GetPendientesAsync()
    {
        return await _context.Veterinarias
            .AsNoTracking()
            .Where(v => !v.Aprobada && !v.Rechazada)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Veterinaria>> GetByUsuarioIdAsync(int usuarioId)
    {
        return await _context.Veterinarias
            .AsNoTracking()
            .Where(v => v.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<Veterinaria?> GetByCedulaAsync(string cedulaJuridica)
    {
        return await _context.Veterinarias
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.CedulaJuridica == cedulaJuridica);
    }
}
