using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Traslado;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

/// <summary> PBI 131 - Traslado de expediente entre veterinarias </summary>
[ApiController]
[Route("api/traslados-expediente")]
[Authorize]
public class TrasladosExpedienteController : ControllerBase
{
    private readonly ITrasladoExpedienteRepository _trasladoRepository;
    private readonly IMascotaRepository _mascotaRepository;
    private readonly IVeterinariaRepository _veterinariaRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public TrasladosExpedienteController(
        ITrasladoExpedienteRepository trasladoRepository,
        IMascotaRepository mascotaRepository,
        IVeterinariaRepository veterinariaRepository,
        IUsuarioRepository usuarioRepository)
    {
        _trasladoRepository = trasladoRepository;
        _mascotaRepository = mascotaRepository;
        _veterinariaRepository = veterinariaRepository;
        _usuarioRepository = usuarioRepository;
    }

    /// <summary> IDs de Rol (tabla Roles, seed en AppDbContext): 1=Administrador, 2=Veterinaria, 3=Almacen, 4=Cliente </summary>
    private static class RolId
    {
        public const int Administrador = 1;
        public const int Veterinaria = 2;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        var usuario = await _usuarioRepository.GetByIdAsync(UsuarioAutenticadoId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        if (usuario.RolId == RolId.Administrador)
            return Ok(await _trasladoRepository.GetAllAsync());

        if (usuario.RolId == RolId.Veterinaria && usuario.VeterinariaId.HasValue)
            return Ok(await _trasladoRepository.GetByVeterinariaDestinoAsync(usuario.VeterinariaId.Value));

        return Ok(await _trasladoRepository.GetByPropietarioAsync(UsuarioAutenticadoId));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearTrasladoExpedienteDto crearDto)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(crearDto.MascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {crearDto.MascotaId} no encontrada" });

        // Solo el propietario de la mascota puede solicitar el traslado
        if (mascota.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        if (!await _veterinariaRepository.ExistsAsync(crearDto.VeterinariaDestinoId))
            return BadRequest(new { mensaje = $"Veterinaria con ID {crearDto.VeterinariaDestinoId} no encontrada" });

        if (!mascota.VeterinariaId.HasValue)
            return BadRequest(new { mensaje = "La mascota no tiene una veterinaria de cabecera asignada" });

        if (mascota.VeterinariaId.Value == crearDto.VeterinariaDestinoId)
            return BadRequest(new { mensaje = "La veterinaria destino no puede ser la misma que la veterinaria actual de la mascota" });

        if (await _trasladoRepository.ExisteTrasladoActivoAsync(crearDto.MascotaId, crearDto.VeterinariaDestinoId))
            return BadRequest(new { mensaje = "Ya existe un traslado solicitado para esta mascota hacia esa veterinaria" });

        var entity = new TrasladoExpediente
        {
            MascotaId = crearDto.MascotaId,
            VeterinariaOrigenId = mascota.VeterinariaId.Value,
            VeterinariaDestinoId = crearDto.VeterinariaDestinoId,
            Estado = EstadoTraslado.Solicitado.ToString(),
            FechaSolicitud = DateTime.UtcNow,
            SolicitadoPorId = UsuarioAutenticadoId,
            Comentario = crearDto.Comentario
        };

        var created = await _trasladoRepository.AddAsync(entity);
        return Created($"/api/traslados-expediente/{created.Id}", created);
    }

    [HttpPut("{id}/aceptar")]
    public async Task<IActionResult> AceptarAsync(int id)
    {
        var traslado = await _trasladoRepository.GetByIdAsync(id);
        if (traslado == null)
            return NotFound(new { mensaje = $"Traslado con ID {id} no encontrado" });

        var error = await ValidarVeterinariaDestinoAsync(traslado.VeterinariaDestinoId);
        if (error != null)
            return error;

        if (traslado.Estado != EstadoTraslado.Solicitado.ToString())
            return BadRequest(new { mensaje = "Solo se pueden aceptar traslados en estado Solicitado" });

        traslado.Estado = EstadoTraslado.Aceptado.ToString();
        traslado.FechaRespuesta = DateTime.UtcNow;
        await _trasladoRepository.UpdateAsync(traslado);

        var mascota = await _mascotaRepository.GetByIdAsync(traslado.MascotaId);
        if (mascota != null)
        {
            mascota.VeterinariaId = traslado.VeterinariaDestinoId;
            await _mascotaRepository.UpdateAsync(mascota);
        }

        return NoContent();
    }

    [HttpPut("{id}/rechazar")]
    public async Task<IActionResult> RechazarAsync(int id, [FromBody] RechazarTrasladoDto rechazarDto)
    {
        var traslado = await _trasladoRepository.GetByIdAsync(id);
        if (traslado == null)
            return NotFound(new { mensaje = $"Traslado con ID {id} no encontrado" });

        var error = await ValidarVeterinariaDestinoAsync(traslado.VeterinariaDestinoId);
        if (error != null)
            return error;

        if (traslado.Estado != EstadoTraslado.Solicitado.ToString())
            return BadRequest(new { mensaje = "Solo se pueden rechazar traslados en estado Solicitado" });

        if (string.IsNullOrWhiteSpace(rechazarDto.MotivoRechazo))
            return BadRequest(new { mensaje = "El motivo de rechazo es obligatorio" });

        traslado.Estado = EstadoTraslado.Rechazado.ToString();
        traslado.FechaRespuesta = DateTime.UtcNow;
        traslado.MotivoRechazo = rechazarDto.MotivoRechazo;
        await _trasladoRepository.UpdateAsync(traslado);

        return NoContent();
    }

    /// <summary> Solo el personal de la veterinaria destino puede aceptar/rechazar el traslado </summary>
    private async Task<IActionResult?> ValidarVeterinariaDestinoAsync(int veterinariaDestinoId)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(UsuarioAutenticadoId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        if (usuario.RolId != RolId.Veterinaria || usuario.VeterinariaId != veterinariaDestinoId)
            return Forbid();

        return null;
    }
}
