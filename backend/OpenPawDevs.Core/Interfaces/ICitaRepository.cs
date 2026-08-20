using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.Interfaces;

/// <summary>
/// Repositorio de citas (Epic 5 - Agendar Cita)
/// </summary>
public interface ICitaRepository : IGenericRepository<Cita>
{
    Task<IReadOnlyList<Cita>> GetByMascotaIdAsync(int mascotaId);
    Task<IReadOnlyList<Cita>> GetByVeterinariaIdAsync(int veterinariaId);
    Task<IReadOnlyList<Cita>> GetByUsuarioIdAsync(int usuarioId);
    Task<IReadOnlyList<Cita>> GetByFechaRangeAsync(DateTime desde, DateTime hasta);
    Task<bool> ExisteConflictoAsync(int veterinariaId, DateTime fechaHora, int? excluirCitaId = null);
    Task<Cita?> CrearConValidacionAsync(Cita cita);
    Task<bool> ReprogramarConValidacionAsync(Cita cita, DateTime nuevaFechaHora);
}
