using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 9 - Marketplace: Control de inventario </summary>
public class InventarioRepository : GenericRepository<Inventario>, IInventarioRepository
{
    public InventarioRepository(AppDbContext context) : base(context) { }

    public override async Task<IReadOnlyList<Inventario>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
                .ThenInclude(a => a.Veterinaria)
            .ToListAsync();
    }

    public override async Task<Inventario?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<IReadOnlyList<Inventario>> GetByAlmacenIdAsync(int almacenId)
    {
        return await _context.Inventarios
            .AsNoTracking()
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
            .Where(i => i.AlmacenId == almacenId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Inventario>> GetByAlmacenesAsync(IReadOnlyCollection<int> almacenIds)
    {
        if (almacenIds == null || almacenIds.Count == 0)
            return new List<Inventario>();

        return await _context.Inventarios
            .AsNoTracking()
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
            .Where(i => almacenIds.Contains(i.AlmacenId))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Inventario>> GetByProductoIdAsync(int productoId)
    {
        return await _context.Inventarios
            .AsNoTracking()
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
            .Where(i => i.ProductoId == productoId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Inventario>> GetLowStockAsync()
    {
        return await _context.Inventarios
            .AsNoTracking()
            .Include(i => i.Producto)
            .Include(i => i.Almacen)
            .Where(i => i.Cantidad <= i.StockMinimo)
            .ToListAsync();
    }

    public async Task<Inventario?> GetByProductoYAlmacenAsync(int productoId, int almacenId)
    {
        return await _context.Inventarios
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.ProductoId == productoId && i.AlmacenId == almacenId);
    }
}
