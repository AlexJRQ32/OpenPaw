using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

public class ServicioVeterinarioRepository
    : GenericRepository<ServicioVeterinario>, IServicioVeterinarioRepository
{
    public ServicioVeterinarioRepository(AppDbContext context) : base(context) { }

    public override Task<ServicioVeterinario?> GetByIdAsync(int id)
    {
        return _dbSet
            .AsNoTracking()
            .Include(s => s.Veterinaria)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public override async Task<IReadOnlyList<ServicioVeterinario>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Veterinaria)
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ServicioVeterinario>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Veterinaria)
            .Where(s => s.VeterinariaId == veterinariaId && s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ServicioVeterinario>> GetByCategoriaAsync(
        CategoriaServicioVeterinario categoria)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Veterinaria)
            .Where(s => s.Categoria == categoria && s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();
    }
}
