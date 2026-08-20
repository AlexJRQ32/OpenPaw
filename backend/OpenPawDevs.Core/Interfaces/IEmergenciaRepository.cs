using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de emergencias (PBI 133 - Atención de emergencias)
/// </summary>
public interface IEmergenciaRepository : IGenericRepository<Emergencia>
{
    Task<IReadOnlyList<Emergencia>> GetByMascotaIdAsync(int mascotaId);
}
