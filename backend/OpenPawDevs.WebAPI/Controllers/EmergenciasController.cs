using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Emergencia;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

/// <summary> PBI 133 - Atención de emergencias (veterinario no cabecera, dentro y fuera de la plataforma) </summary>
[ApiController]
[Route("api/emergencias")]
[Authorize]
public class EmergenciasController : ControllerBase
{
    private readonly IEmergenciaRepository _emergenciaRepository;
    private readonly IMascotaRepository _mascotaRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public EmergenciasController(
        IEmergenciaRepository emergenciaRepository,
        IMascotaRepository mascotaRepository,
        IUsuarioRepository usuarioRepository)
    {
        _emergenciaRepository = emergenciaRepository;
        _mascotaRepository = mascotaRepository;
        _usuarioRepository = usuarioRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetByMascotaAsync([FromQuery] int mascotaId)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(mascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {mascotaId} no encontrada" });

        var error = await ValidarAccesoMascotaAsync(mascota);
        if (error != null)
            return error;

        var emergencias = await _emergenciaRepository.GetByMascotaIdAsync(mascotaId);
        return Ok(emergencias);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var emergencia = await _emergenciaRepository.GetByIdAsync(id);
        if (emergencia == null)
            return NotFound(new { mensaje = $"Emergencia con ID {id} no encontrada" });

        var mascota = await _mascotaRepository.GetByIdAsync(emergencia.MascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {emergencia.MascotaId} no encontrada" });

        var error = await ValidarAccesoMascotaAsync(mascota);
        if (error != null)
            return error;

        return Ok(emergencia);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearEmergenciaDto crearDto)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(crearDto.MascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {crearDto.MascotaId} no encontrada" });

        var usuario = await _usuarioRepository.GetByIdAsync(UsuarioAutenticadoId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        var entity = new Emergencia
        {
            MascotaId = crearDto.MascotaId,
            PropietarioId = mascota.DuenioId,
            FechaAtencion = crearDto.FechaAtencion,
            Motivo = crearDto.Motivo.Trim(),
            Sintomas = crearDto.Sintomas,
            TratamientoAplicado = crearDto.TratamientoAplicado,
            ArchivoAdjuntoUrl = crearDto.ArchivoAdjuntoUrl,
            EsEnPlataforma = crearDto.EsEnPlataforma,
            FechaRegistro = DateTime.UtcNow
        };

        if (crearDto.EsEnPlataforma)
        {
            // Escenario A: el veterinario en plataforma registra la emergencia con su propia veterinaria
            if (usuario.RolId != 2 || !usuario.VeterinariaId.HasValue)
                return Forbid();

            entity.VeterinariaId = usuario.VeterinariaId.Value;
        }
        else
        {
            // Escenario B: el propietario aporta lo realizado por un veterinario externo
            if (mascota.DuenioId != UsuarioAutenticadoId)
                return Forbid();

            if (string.IsNullOrWhiteSpace(crearDto.VeterinariaNombreExterna))
                return BadRequest(new { mensaje = "VeterinariaNombreExterna es obligatorio cuando el veterinario no esta en la plataforma" });

            entity.VeterinariaNombreExterna = crearDto.VeterinariaNombreExterna.Trim();
        }

        var created = await _emergenciaRepository.AddAsync(entity);
        return Created($"/api/emergencias/{created.Id}", created);
    }

    /// <summary> Visible para el propietario de la mascota y la veterinaria de cabecera </summary>
    private async Task<IActionResult?> ValidarAccesoMascotaAsync(Mascota mascota)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(UsuarioAutenticadoId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        if (usuario.RolId == 1)
            return null;

        if (mascota.DuenioId == UsuarioAutenticadoId)
            return null;

        if (usuario.RolId == 2 && usuario.VeterinariaId.HasValue && usuario.VeterinariaId == mascota.VeterinariaId)
            return null;

        return Forbid();
    }
}
