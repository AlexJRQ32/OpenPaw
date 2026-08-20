using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 6 - Compartir expedientes: Acceso a expedientes compartidos </summary>
public class ExpedienteCompartidoRepository : GenericRepository<ExpedienteCompartido>, IExpedienteCompartidoRepository
{
    public ExpedienteCompartidoRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<ExpedienteCompartido>> GetByDestinoAsync(int veterinariaDestinoId)
    {
        return await _context.ExpedientesCompartidos
            .AsNoTracking()
            .Where(ec => ec.VeterinariaDestinoId == veterinariaDestinoId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ExpedienteCompartido>> GetByOrigenAsync(int veterinariaOrigenId)
    {
        return await _context.ExpedientesCompartidos
            .AsNoTracking()
            .Where(ec => ec.VeterinariaOrigenId == veterinariaOrigenId)
            .ToListAsync();
    }
}
