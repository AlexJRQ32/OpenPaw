using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

public class RedSocialRepository : GenericRepository<RedSocial>, IRedSocialRepository
{
    public RedSocialRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<RedSocial>> GetByUsuarioIdAsync(int usuarioId)
    {
        return await _dbSet
            .Where(r => r.UsuarioId == usuarioId)
            .AsNoTracking()
            .ToListAsync();
    }
}
