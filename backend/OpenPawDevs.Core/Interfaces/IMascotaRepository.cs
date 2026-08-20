using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de mascotas (Epic 4 - Registrar Mascota)
/// </summary>
public interface IMascotaRepository : IGenericRepository<Mascota>
{
    Task<IReadOnlyList<Mascota>> GetByDuenioIdAsync(int duenioId);

    /// <summary> Mascotas cuya veterinaria de cabecera es la indicada (PBI 133 - Emergencias) </summary>
    Task<IReadOnlyList<Mascota>> GetByVeterinariaIdAsync(int veterinariaId);
}

