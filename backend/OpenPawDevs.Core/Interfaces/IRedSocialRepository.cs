using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

public interface IRedSocialRepository : IGenericRepository<RedSocial>
{
    Task<IReadOnlyList<RedSocial>> GetByUsuarioIdAsync(int usuarioId);
}
