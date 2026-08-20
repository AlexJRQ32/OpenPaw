using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de expedientes (Epic 6 - Atender Consulta)
/// </summary>
public interface IExpedienteRepository : IGenericRepository<Expediente>
{
    Task<IReadOnlyList<Expediente>> GetByMascotaIdAsync(int mascotaId);
    Task<IReadOnlyList<Expediente>> GetByVeterinariaIdAsync(int veterinariaId);
}
