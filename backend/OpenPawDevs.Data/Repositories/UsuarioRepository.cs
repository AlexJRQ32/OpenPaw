using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> PBI 10/PBI 44/PBI 45 - Login / PBI 49 - Perfil: Acceso a datos de usuarios </summary>
public class UsuarioRepository : GenericRepository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(AppDbContext context) : base(context) { }

    public override async Task<Usuario?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(u => u.Rol)
            .Include(u => u.RedesSociales)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public override async Task<IReadOnlyList<Usuario>> GetAllAsync()
    {
        return await _dbSet
            .Include(u => u.Rol)
            .Include(u => u.Veterinaria)
            .Include(u => u.Almacen)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
    {
        return await _context.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<Usuario?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _context.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public async Task<IReadOnlyList<Usuario>> GetByRolAsync(int rolId)
    {
        return await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.RolId == rolId)
            .ToListAsync();
    }

    public async Task<int> CountActivosByRolAsync(int rolId)
    {
        return await _context.Usuarios
            .CountAsync(u => u.RolId == rolId && u.Activo);
    }

    public async Task<int> CountByRolAsync(int rolId)
    {
        return await _context.Usuarios
            .CountAsync(u => u.RolId == rolId);
    }
}
