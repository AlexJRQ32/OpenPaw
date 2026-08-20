using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Aporte;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

/// <summary> PBI 132 - Aporte de expediente para veterinarias fuera de la plataforma </summary>
[ApiController]
[Route("api/expediente-aportes")]
[Authorize]
public class ExpedienteAportesController : ControllerBase
{
    private readonly IAporteExpedienteRepository _aporteRepository;
    private readonly IMascotaRepository _mascotaRepository;

    public ExpedienteAportesController(
        IAporteExpedienteRepository aporteRepository,
        IMascotaRepository mascotaRepository)
    {
        _aporteRepository = aporteRepository;
        _mascotaRepository = mascotaRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetByMascotaAsync([FromQuery] int mascotaId)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(mascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {mascotaId} no encontrada" });

        // Solo el propietario de la mascota puede ver sus aportes
        if (mascota.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        var aportes = await _aporteRepository.GetByMascotaIdAsync(mascotaId);
        return Ok(aportes);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearAporteExpedienteDto crearDto)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(crearDto.MascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {crearDto.MascotaId} no encontrada" });

        // Solo el propietario de la mascota puede registrar aportes
        if (mascota.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        if (crearDto.FechaAtencion > DateTime.UtcNow)
            return BadRequest(new { mensaje = "La fecha de atencion no puede estar en el futuro" });

        var entity = new AporteExpediente
        {
            MascotaId = crearDto.MascotaId,
            PropietarioId = UsuarioAutenticadoId,
            VeterinariaNombre = crearDto.VeterinariaNombre.Trim(),
            FechaAtencion = crearDto.FechaAtencion,
            TipoAtencion = crearDto.TipoAtencion,
            Descripcion = crearDto.Descripcion.Trim(),
            Diagnostico = crearDto.Diagnostico,
            Medicamentos = crearDto.Medicamentos,
            ArchivoAdjuntoUrl = crearDto.ArchivoAdjuntoUrl,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _aporteRepository.AddAsync(entity);
        return Created($"/api/expediente-aportes/{created.Id}", created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _aporteRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Aporte de expediente con ID {id} no encontrado" });

        // Solo el propietario que lo registro puede eliminarlo
        if (entity.PropietarioId != UsuarioAutenticadoId)
            return Forbid();

        await _aporteRepository.DeleteAsync(entity);
        return NoContent();
    }
}
