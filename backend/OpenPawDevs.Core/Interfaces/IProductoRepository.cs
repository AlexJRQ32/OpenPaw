using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de productos del marketplace (Epic 9 - Marketplace)
/// </summary>
public interface IProductoRepository : IGenericRepository<Producto>
{
    Task<IReadOnlyList<Producto>> GetByCategoriaAsync(string categoria);
    Task<IReadOnlyList<Producto>> SearchByNombreAsync(string termino);
}
