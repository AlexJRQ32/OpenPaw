using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de usuarios (PBI 10/PBI 44/PBI 45 - Login / PBI 49 - Perfil)
/// </summary>
public interface IUsuarioRepository : IGenericRepository<Usuario>
{
    Task<Usuario?> GetByEmailAsync(string email);

    Task<Usuario?> GetByRefreshTokenAsync(string refreshToken);

    /// <summary> PBI 53 - Gestión de funcionarios: usuarios filtrados por rol </summary>
    Task<IReadOnlyList<Usuario>> GetByRolAsync(int rolId);

    /// <summary> PBI 53 - Gestión de funcionarios: cantidad de usuarios activos con un rol dado </summary>
    Task<int> CountActivosByRolAsync(int rolId);
}
