using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de inventario de almacén (Epic 9 - Marketplace: Control de stock)
/// </summary>
public interface IInventarioRepository : IGenericRepository<Inventario>
{
    Task<IReadOnlyList<Inventario>> GetByAlmacenIdAsync(int almacenId);
    Task<IReadOnlyList<Inventario>> GetByAlmacenesAsync(IReadOnlyCollection<int> almacenIds);
    Task<IReadOnlyList<Inventario>> GetByProductoIdAsync(int productoId);
    Task<IReadOnlyList<Inventario>> GetLowStockAsync();
    Task<Inventario?> GetByProductoYAlmacenAsync(int productoId, int almacenId);
}
