using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de aportes de expediente (PBI 132 - Aporte de expediente externo)
/// </summary>
public interface IAporteExpedienteRepository : IGenericRepository<AporteExpediente>
{
    Task<IReadOnlyList<AporteExpediente>> GetByMascotaIdAsync(int mascotaId);
}
