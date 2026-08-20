using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Cita;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CitasController : ControllerBase
{
    private readonly ICitaRepository _citaRepository;
    private readonly IMascotaRepository _mascotaRepository;
    private readonly IVeterinariaRepository _veterinariaRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public CitasController(
        ICitaRepository citaRepository,
        IMascotaRepository mascotaRepository,
        IVeterinariaRepository veterinariaRepository,
        IUsuarioRepository usuarioRepository)
    {
        _citaRepository = citaRepository;
        _mascotaRepository = mascotaRepository;
        _veterinariaRepository = veterinariaRepository;
        _usuarioRepository = usuarioRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool EsFuncionario =>
        User.IsInRole("1") || User.IsInRole("2") || User.IsInRole("3");

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        if (!EsFuncionario)
            return Forbid();

        var citas = await _citaRepository.GetAllAsync();
        return Ok(citas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var cita = await _citaRepository.GetByIdAsync(id);
        if (cita == null)
            return NotFound(new { mensaje = $"Cita con ID {id} no encontrada" });

        if (!EsFuncionario && cita.UsuarioId != UsuarioAutenticadoId)
            return Forbid();

        return Ok(cita);
    }

    [HttpGet("mascota/{mascotaId}")]
    public async Task<IActionResult> GetByMascotaAsync(int mascotaId)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(mascotaId);
        if (!EsFuncionario && (mascota == null || mascota.DuenioId != UsuarioAutenticadoId))
            return Forbid();

        var citas = await _citaRepository.GetByMascotaIdAsync(mascotaId);
        return Ok(citas);
    }

    [HttpGet("veterinaria/{veterinariaId}")]
    public async Task<IActionResult> GetByVeterinariaAsync(int veterinariaId)
    {
        if (!EsFuncionario)
            return Forbid();

        var citas = await _citaRepository.GetByVeterinariaIdAsync(veterinariaId);
        return Ok(citas);
    }

    [HttpGet("usuario/{usuarioId}")]
    public async Task<IActionResult> GetByUsuarioAsync(int usuarioId)
    {
        if (!EsFuncionario && usuarioId != UsuarioAutenticadoId)
            return Forbid();

        var citas = await _citaRepository.GetByUsuarioIdAsync(usuarioId);
        return Ok(citas);
    }

    [HttpGet("rango")]
    public async Task<IActionResult> GetByFechaRangeAsync([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
    {
        if (!EsFuncionario)
            return Forbid();

        var citas = await _citaRepository.GetByFechaRangeAsync(desde, hasta);
        return Ok(citas);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearCitaDto crearDto)
    {
        // Cliente solo agenda para si mismo; funcionarios pueden agendar para otros
        if (!EsFuncionario && crearDto.UsuarioId != UsuarioAutenticadoId)
            return Forbid();

        var error = await ValidarEntidadesAsync(
            crearDto.MascotaId,
            crearDto.VeterinariaId,
            crearDto.UsuarioId);
        if (error != null)
            return BadRequest(new { mensaje = error });

        if (crearDto.FechaHora <= DateTime.UtcNow)
            return BadRequest(new { mensaje = "La fecha de la cita debe estar en el futuro" });

        var entity = new Cita
        {
            MascotaId = crearDto.MascotaId,
            VeterinariaId = crearDto.VeterinariaId,
            UsuarioId = crearDto.UsuarioId,
            FechaHora = crearDto.FechaHora,
            Servicio = crearDto.Servicio,
            Categoria = crearDto.Categoria,
            Notas = crearDto.Notas,
            Costo = crearDto.Costo,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _citaRepository.CrearConValidacionAsync(entity);
        if (created == null)
            return BadRequest(new { mensaje = "La veterinaria ya tiene una cita programada en ese rango de horario" });

        return Created($"/api/citas/{created.Id}", created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarCitaDto actualizarDto)
    {
        var entity = await _citaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Cita con ID {id} no encontrada" });

        if (!EsFuncionario && entity.UsuarioId != UsuarioAutenticadoId)
            return Forbid();

        if (actualizarDto.FechaHora.HasValue)
        {
            var errorFecha = await ValidarFechaAsync(
                entity.VeterinariaId, actualizarDto.FechaHora.Value, entity.Id);
            if (errorFecha != null)
                return BadRequest(new { mensaje = errorFecha });

            entity.FechaHora = actualizarDto.FechaHora.Value;
        }

        if (actualizarDto.Estado != null)
        {
            if (!Enum.TryParse<EstadoCita>(actualizarDto.Estado, true, out var estado))
                return BadRequest(new { mensaje = "Estado de cita no valido" });

            entity.Estado = estado.ToString();
        }
        if (actualizarDto.Servicio != null) entity.Servicio = actualizarDto.Servicio;
        if (actualizarDto.Categoria.HasValue) entity.Categoria = actualizarDto.Categoria;
        if (actualizarDto.Notas != null) entity.Notas = actualizarDto.Notas;
        if (actualizarDto.Costo.HasValue) entity.Costo = actualizarDto.Costo;

        await _citaRepository.UpdateAsync(entity);
        return NoContent();
    }

    [HttpPatch("{id}/reprogramar")]
    public async Task<IActionResult> ReprogramarAsync(int id, [FromBody] ReprogramarCitaDto reprogramarDto)
    {
        var entity = await _citaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Cita con ID {id} no encontrada" });

        if (!EsFuncionario && entity.UsuarioId != UsuarioAutenticadoId)
            return Forbid();

        if (entity.Estado == EstadoCita.Cancelada.ToString())
            return Conflict(new { mensaje = "No se puede reprogramar una cita cancelada" });

        if (reprogramarDto.FechaHora <= DateTime.UtcNow)
            return BadRequest(new { mensaje = "La fecha de la cita debe estar en el futuro" });

        entity.Estado = EstadoCita.Pendiente.ToString();
        var reprogramada = await _citaRepository.ReprogramarConValidacionAsync(
            entity, reprogramarDto.FechaHora);
        if (!reprogramada)
            return BadRequest(new { mensaje = "La veterinaria ya tiene una cita programada en ese rango de horario" });

        return NoContent();
    }

    [HttpPatch("{id}/cancelar")]
    public Task<IActionResult> CancelarAsync(int id) => CancelarCitaAsync(id);

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelAsync(int id)
        => await CancelarCitaAsync(id);

    private async Task<IActionResult> CancelarCitaAsync(int id)
    {
        var entity = await _citaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Cita con ID {id} no encontrada" });

        if (!EsFuncionario && entity.UsuarioId != UsuarioAutenticadoId)
            return Forbid();

        if (entity.Estado == EstadoCita.Cancelada.ToString())
            return NoContent();

        entity.Estado = EstadoCita.Cancelada.ToString();
        await _citaRepository.UpdateAsync(entity);
        return NoContent();
    }

    private async Task<string?> ValidarEntidadesAsync(
        int mascotaId, int veterinariaId, int usuarioId)
    {
        if (!await _mascotaRepository.ExistsAsync(mascotaId))
            return $"Mascota con ID {mascotaId} no encontrada";

        if (!await _veterinariaRepository.ExistsAsync(veterinariaId))
            return $"Veterinaria con ID {veterinariaId} no encontrada";

        if (!await _usuarioRepository.ExistsAsync(usuarioId))
            return $"Usuario con ID {usuarioId} no encontrado";

        return null;
    }

    private async Task<string?> ValidarFechaAsync(
        int veterinariaId, DateTime fechaHora, int? excluirCitaId = null)
    {
        if (fechaHora <= DateTime.UtcNow)
            return "La fecha de la cita debe estar en el futuro";

        if (await _citaRepository.ExisteConflictoAsync(veterinariaId, fechaHora, excluirCitaId))
            return "La veterinaria ya tiene una cita programada en ese rango de horario";

        return null;
    }
}
