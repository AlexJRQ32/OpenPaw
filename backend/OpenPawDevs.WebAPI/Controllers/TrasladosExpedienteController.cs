using System.Linq;
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
            return Ok((await _trasladoRepository.GetAllAsync()).Select(TrasladoExpedienteMapeo.ToDto));

        if (usuario.RolId == RolId.Veterinaria && usuario.VeterinariaId.HasValue)
            return Ok((await _trasladoRepository.GetByVeterinariaDestinoAsync(usuario.VeterinariaId.Value))
                .Select(TrasladoExpedienteMapeo.ToDto));

        return Ok((await _trasladoRepository.GetByPropietarioAsync(UsuarioAutenticadoId))
            .Select(TrasladoExpedienteMapeo.ToDto));
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

        // Sprint 1 - Tarea 10: normalizacion del estado logistico del wireframe
        // (Programado/EnTransito/Completado). Enum.TryParse("999", ...) devuelve true;
        // sin IsDefined se persistiria un valor invalido. Tras el TryParse exitoso + IsDefined
        // se normaliza SIEMPRE a la forma canonica (enum.ToString()). null -> default "Programado".
        var estadoLogistica = EstadoTrasladoLogistica.Programado.ToString();
        if (crearDto.EstadoLogistica != null)
        {
            var errorEstado = ValidarNormalizarEstadoLogistica(crearDto.EstadoLogistica, out var normalizado);
            if (errorEstado != null)
                return BadRequest(new { mensaje = errorEstado });

            estadoLogistica = normalizado!;
        }

        var entity = new TrasladoExpediente
        {
            MascotaId = crearDto.MascotaId,
            VeterinariaOrigenId = mascota.VeterinariaId.Value,
            VeterinariaDestinoId = crearDto.VeterinariaDestinoId,
            Estado = EstadoTraslado.Solicitado.ToString(),
            FechaSolicitud = DateTime.UtcNow,
            SolicitadoPorId = UsuarioAutenticadoId,
            Comentario = crearDto.Comentario,
            EstadoLogistica = estadoLogistica,
            OrigenLatitud = crearDto.OrigenLatitud,
            OrigenLongitud = crearDto.OrigenLongitud,
            DestinoLatitud = crearDto.DestinoLatitud,
            DestinoLongitud = crearDto.DestinoLongitud,
            EtaLlegada = crearDto.EtaLlegada,
            Salida = crearDto.Salida
        };

        var created = await _trasladoRepository.AddAsync(entity);
        return Created($"/api/traslados-expediente/{created.Id}", TrasladoExpedienteMapeo.ToDto(created));
    }

    /// <summary>
    /// Sprint 1 - Tarea 10: actualizacion parcial de los campos de logistica del wireframe
    /// (coordenadas, ETA, estado logístico, salida). El ciclo de aprobación
    /// (Estado/FechaRespuesta/MotivoRechazo) NO se toca aquí: solo aceptar/rechazar lo modifican.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarTrasladoExpedienteDto actualizarDto)
    {
        // El filtro [ApiController] normalmente valida antes del action; el guard es defensivo
        // y garantiza que un DTO invalido (ej. coords fuera de rango) devuelva 400.
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var traslado = await _trasladoRepository.GetByIdAsync(id);
        if (traslado == null)
            return NotFound(new { mensaje = $"Traslado con ID {id} no encontrado" });

        // Control de acceso (previene IDOR): administrador (rol 1) o el propietario que
        // solicitó el traslado (SolicitadoPorId). Cualquier otro usuario autenticado -> Forbid.
        var usuario = await _usuarioRepository.GetByIdAsync(UsuarioAutenticadoId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        if (usuario.RolId != RolId.Administrador && traslado.SolicitadoPorId != UsuarioAutenticadoId)
            return Forbid();

        // Normalizacion del estado logistico (null preserva el valor actual).
        if (actualizarDto.EstadoLogistica != null)
        {
            var errorEstado = ValidarNormalizarEstadoLogistica(actualizarDto.EstadoLogistica, out var normalizado);
            if (errorEstado != null)
                return BadRequest(new { mensaje = errorEstado });

            actualizarDto.EstadoLogistica = normalizado;
        }

        // Update parcial: null en el DTO preserva el valor actual (no borra campos no enviados).
        TrasladoExpedienteMapeo.AplicarActualizacion(traslado, actualizarDto);
        await _trasladoRepository.UpdateAsync(traslado);

        return Ok(TrasladoExpedienteMapeo.ToDto(traslado));
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

    /// <summary>
    /// Sprint 1 - Tarea 10: valida EstadoLogistica contra los NOMBRES canonicos del enum
    /// EstadoTrasladoLogistica (case-insensitive, tolera espacios con Trim) y devuelve el
    /// nombre canonico exacto. Rechaza numericos ("1"), combinaciones con coma
    /// ("Programado,EnTransito") y cualquier forma que no sea un nombre puro.
    /// null es valido (campo opcional / update parcial lo preserva).
    /// </summary>
    private static string? ValidarNormalizarEstadoLogistica(string? estado, out string? estadoNormalizado)
    {
        estadoNormalizado = null;
        if (estado == null)
            return null;

        var sinEspacios = estado.Trim();
        var canonico = Enum.GetNames<EstadoTrasladoLogistica>()
            .FirstOrDefault(n => n.Equals(sinEspacios, StringComparison.OrdinalIgnoreCase));
        if (canonico == null)
            return "EstadoLogistica no valido (use Programado, EnTransito o Completado)";

        estadoNormalizado = canonico;
        return null;
    }
}
