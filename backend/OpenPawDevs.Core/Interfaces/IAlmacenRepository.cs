using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de almacenes veterinarios (PBI 51 - Solicitud de registro: Almacén Veterinario)
/// </summary>
public interface IAlmacenRepository : IGenericRepository<Almacen>
{
    Task<IReadOnlyList<Almacen>> GetByVeterinariaIdAsync(int veterinariaId);
    Task<IReadOnlyList<Almacen>> GetByUsuarioIdAsync(int usuarioId);
}
