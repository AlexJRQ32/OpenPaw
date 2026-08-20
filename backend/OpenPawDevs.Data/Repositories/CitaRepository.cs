using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Data;
using System.Data;

namespace OpenPawDevs.Data.Repositories;

/// <summary> Epic 5 - Agendar Cita: Acceso a citas </summary>
public class CitaRepository : GenericRepository<Cita>, ICitaRepository
{
    private const int DuracionBloqueMinutos = 30;

    public CitaRepository(AppDbContext context) : base(context) { }

    public override async Task<Cita?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Mascota)
            .Include(c => c.Veterinaria)
            .Include(c => c.Usuario)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IReadOnlyList<Cita>> GetByMascotaIdAsync(int mascotaId)
    {
        return await _context.Citas
            .AsNoTracking()
            .Include(c => c.Mascota)
            .Include(c => c.Veterinaria)
            .Include(c => c.Usuario)
            .Where(c => c.MascotaId == mascotaId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Cita>> GetByVeterinariaIdAsync(int veterinariaId)
    {
        return await _context.Citas
            .AsNoTracking()
            .Include(c => c.Mascota)
            .Include(c => c.Veterinaria)
            .Include(c => c.Usuario)
            .Where(c => c.VeterinariaId == veterinariaId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Cita>> GetByUsuarioIdAsync(int usuarioId)
    {
        return await _context.Citas
            .AsNoTracking()
            .Include(c => c.Mascota)
            .Include(c => c.Veterinaria)
            .Include(c => c.Usuario)
            .Where(c => c.UsuarioId == usuarioId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Cita>> GetByFechaRangeAsync(DateTime desde, DateTime hasta)
    {
        return await _context.Citas
            .AsNoTracking()
            .Include(c => c.Mascota)
            .Include(c => c.Veterinaria)
            .Include(c => c.Usuario)
            .Where(c => c.FechaHora >= desde && c.FechaHora <= hasta)
            .ToListAsync();
    }

    public Task<bool> ExisteConflictoAsync(int veterinariaId, DateTime fechaHora, int? excluirCitaId = null)
    {
        var inicioRango = fechaHora.AddMinutes(-DuracionBloqueMinutos);
        var finRango = fechaHora.AddMinutes(DuracionBloqueMinutos);

        return _context.Citas.AnyAsync(c =>
            c.VeterinariaId == veterinariaId
            && c.FechaHora > inicioRango
            && c.FechaHora < finRango
            && c.Estado != "Cancelada"
            && (!excluirCitaId.HasValue || c.Id != excluirCitaId.Value));
    }

    /// <summary>
    /// Check-then-insert atomico: valida el conflicto de horario y crea la cita
    /// dentro de una transaccion serializable para evitar TOCTOU (Bug #125).
    /// Devuelve null si hay conflicto de horario.
    /// </summary>
    public async Task<Cita?> CrearConValidacionAsync(Cita cita)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);

        var hayConflicto = await ExisteConflictoAsync(cita.VeterinariaId, cita.FechaHora);
        if (hayConflicto)
        {
            await transaction.RollbackAsync();
            return null;
        }

        await _dbSet.AddAsync(cita);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return cita;
    }

    /// <summary>
    /// Check-then-update atomico: valida el conflicto de horario (excluyendo la
    /// propia cita) y reprograma dentro de una transaccion serializable (Bug #125).
    /// Devuelve false si el nuevo horario esta ocupado.
    /// </summary>
    public async Task<bool> ReprogramarConValidacionAsync(Cita cita, DateTime nuevaFechaHora)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);

        var hayConflicto = await ExisteConflictoAsync(
            cita.VeterinariaId, nuevaFechaHora, cita.Id);
        if (hayConflicto)
        {
            await transaction.RollbackAsync();
            return false;
        }

        cita.FechaHora = nuevaFechaHora;
        _dbSet.Update(cita);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return true;
    }
}
