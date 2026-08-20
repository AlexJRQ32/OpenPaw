using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de pedidos del marketplace (Epic 9 - Marketplace: Gestión de pedidos)
/// </summary>
public interface IPedidoRepository : IGenericRepository<Pedido>
{
    Task<IReadOnlyList<Pedido>> GetByVeterinariaIdAsync(int veterinariaId);
    Task<IReadOnlyList<Pedido>> GetByEstadoAsync(EstadoPedido estado);
}
