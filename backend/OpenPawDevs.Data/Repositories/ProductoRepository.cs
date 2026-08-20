using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 9 - Marketplace: Acceso a productos </summary>
public class ProductoRepository : GenericRepository<Producto>, IProductoRepository
{
    public ProductoRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Producto>> GetByCategoriaAsync(string categoria)
    {
        return await _context.Productos
            .AsNoTracking()
            .Where(p => p.Categoria == categoria)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Producto>> SearchByNombreAsync(string termino)
    {
        return await _context.Productos
            .AsNoTracking()
            .Where(p => EF.Functions.Like(p.Nombre, $"%{termino}%"))
            .ToListAsync();
    }
}
