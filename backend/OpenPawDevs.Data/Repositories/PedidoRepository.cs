using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 9 - Marketplace: Gestión de pedidos </summary>
public class PedidoRepository : GenericRepository<Pedido>, IPedidoRepository
{
    public PedidoRepository(AppDbContext context) : base(context) { }

    public override async Task<Pedido?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(p => p.VeterinariaOrigen)
            .Include(p => p.VeterinariaDestino)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IReadOnlyList<Pedido>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.VeterinariaOrigen)
            .Include(p => p.VeterinariaDestino)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(p => p.VeterinariaOrigenId == veterinariaId || p.VeterinariaDestinoId == veterinariaId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Pedido>> GetByEstadoAsync(EstadoPedido estado)
    {
        return await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.VeterinariaOrigen)
            .Include(p => p.VeterinariaDestino)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(p => p.Estado == estado.ToString())
            .ToListAsync();
    }
}
