using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de traslados de expediente (PBI 131 - Traslado de expediente entre veterinarias)
/// </summary>
public interface ITrasladoExpedienteRepository : IGenericRepository<TrasladoExpediente>
{
    Task<IReadOnlyList<TrasladoExpediente>> GetByPropietarioAsync(int propietarioId);
    Task<IReadOnlyList<TrasladoExpediente>> GetByVeterinariaDestinoAsync(int veterinariaDestinoId);
    Task<bool> ExisteTrasladoActivoAsync(int mascotaId, int veterinariaDestinoId);
}
