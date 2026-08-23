using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de veterinarias (PBI 50/PBI 52 - Solicitud y Aprobación de Veterinaria)
/// </summary>
public interface IVeterinariaRepository : IGenericRepository<Veterinaria>
{
    Task<IReadOnlyList<Veterinaria>> GetAprobadasAsync();
    Task<IReadOnlyList<Veterinaria>> GetPendientesAsync();
    Task<IReadOnlyList<Veterinaria>> GetByUsuarioIdAsync(int usuarioId);
    Task<Veterinaria?> GetByCedulaAsync(string cedulaJuridica);
}
