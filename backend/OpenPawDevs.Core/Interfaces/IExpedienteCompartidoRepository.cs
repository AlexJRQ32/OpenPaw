using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de expedientes compartidos entre veterinarias (Epic 6 - Compartir expedientes)
/// </summary>
public interface IExpedienteCompartidoRepository : IGenericRepository<ExpedienteCompartido>
{
    Task<IReadOnlyList<ExpedienteCompartido>> GetByDestinoAsync(int veterinariaDestinoId);
    Task<IReadOnlyList<ExpedienteCompartido>> GetByOrigenAsync(int veterinariaOrigenId);
}
