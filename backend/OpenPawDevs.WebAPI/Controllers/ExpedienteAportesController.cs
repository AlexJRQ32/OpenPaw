using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Aporte;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
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

    private bool EsFuncionario =>
        User.IsInRole("1") || User.IsInRole("2") || User.IsInRole("3");

    /// <summary> ID de Rol 1 = Administrador (tabla Roles, seed en AppDbContext) </summary>
    private bool EsAdministrador => User.IsInRole("1");

    [HttpGet]
    public async Task<IActionResult> GetByMascotaAsync([FromQuery] int mascotaId)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(mascotaId);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {mascotaId} no encontrada" });

        // Visible para el dueno de la mascota y para funcionarios (admin/vet/almacen)
        if (!EsFuncionario && mascota.DuenioId != UsuarioAutenticadoId)
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

        // Misma validacion que en Update: solo direcciones http/https absolutas (evita
        // esquemas como javascript: / data: / ftp:). Null es opcional en el POST.
        if (crearDto.ArchivoAdjuntoUrl != null)
        {
            if (!Uri.TryCreate(crearDto.ArchivoAdjuntoUrl, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return BadRequest(new { mensaje = "El ArchivoAdjuntoUrl debe ser una direccion http/https valida" });
        }

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

    /// <summary>
    /// Sprint 2 - Tarea 36: actualizacion parcial del aporte (rediseño UI). Null en el DTO
    /// preserva el valor actual. MascotaId y PropietarioId no son modificables.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarAporteExpedienteDto actualizarDto)
    {
        // El filtro [ApiController] normalmente valida antes del action; el guard es defensivo
        // y garantiza que un DTO invalido devuelva 400.
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var entity = await _aporteRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Aporte de expediente con ID {id} no encontrado" });

        // Control de acceso (previene IDOR): administrador (rol 1) o el propietario que
        // registro el aporte (PropietarioId). Cualquier otro usuario autenticado -> Forbid.
        if (!EsAdministrador && entity.PropietarioId != UsuarioAutenticadoId)
            return Forbid();

        if (actualizarDto.FechaAtencion.HasValue
            && actualizarDto.FechaAtencion.Value > DateTime.UtcNow)
            return BadRequest(new { mensaje = "La fecha de atencion no puede estar en el futuro" });

        // Enum.TryParse + IsDefined -> 400 y normalizacion a enum.ToString() (patron tarea 7).
        if (actualizarDto.TipoAtencion != null)
        {
            if (!Enum.TryParse<TipoAtencion>(actualizarDto.TipoAtencion, true, out var tipo)
                || !Enum.IsDefined(typeof(TipoAtencion), tipo))
                return BadRequest(new { mensaje = "TipoAtencion no valido (use Consulta, Tratamiento, Vacuna o Emergencia)" });

            actualizarDto.TipoAtencion = tipo.ToString();
        }

        if (actualizarDto.ArchivoAdjuntoUrl != null)
        {
            if (!Uri.TryCreate(actualizarDto.ArchivoAdjuntoUrl, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return BadRequest(new { mensaje = "El ArchivoAdjuntoUrl debe ser una direccion http/https valida" });
        }

        // Update parcial: null en el DTO preserva el valor actual (no borra campos no enviados).
        if (actualizarDto.VeterinariaNombre != null)
            entity.VeterinariaNombre = actualizarDto.VeterinariaNombre.Trim();
        if (actualizarDto.FechaAtencion.HasValue)
            entity.FechaAtencion = actualizarDto.FechaAtencion.Value;
        if (actualizarDto.TipoAtencion != null)
            entity.TipoAtencion = Enum.Parse<TipoAtencion>(actualizarDto.TipoAtencion, true);
        if (actualizarDto.Descripcion != null)
            entity.Descripcion = actualizarDto.Descripcion.Trim();
        if (actualizarDto.Diagnostico != null)
            entity.Diagnostico = actualizarDto.Diagnostico;
        if (actualizarDto.Medicamentos != null)
            entity.Medicamentos = actualizarDto.Medicamentos;
        if (actualizarDto.ArchivoAdjuntoUrl != null)
            entity.ArchivoAdjuntoUrl = actualizarDto.ArchivoAdjuntoUrl;

        await _aporteRepository.UpdateAsync(entity);

        return NoContent();
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
