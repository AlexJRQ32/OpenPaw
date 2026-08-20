using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 51 - Solicitud de registro: Almacén Veterinario </summary>
public class AlmacenRepository : GenericRepository<Almacen>, IAlmacenRepository
{
    public AlmacenRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Almacen>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _context.Almacenes
            .AsNoTracking()
            .Where(a => a.VeterinariaId == veterinariaId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Almacen>> GetByUsuarioIdAsync(int usuarioId)
    {
        return await _context.Almacenes
            .AsNoTracking()
            .Where(a => a.UsuarioId == usuarioId)
            .ToListAsync();
    }
}
