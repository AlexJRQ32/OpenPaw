using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.Interfaces;

public interface IServicioVeterinarioRepository : IGenericRepository<ServicioVeterinario>
{
    Task<IReadOnlyList<ServicioVeterinario>> GetByVeterinariaIdAsync(int veterinariaId);
    Task<IReadOnlyList<ServicioVeterinario>> GetByCategoriaAsync(CategoriaServicioVeterinario categoria);
}
