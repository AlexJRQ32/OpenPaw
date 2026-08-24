using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Emergencia;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
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

    /// <summary> Mapeo seguro a DTO: no se serializa la entidad cruda ni sus navegaciones (evita PII) </summary>
    private static EmergenciaDto MapToDto(Emergencia e) => new()
    {
        Id = e.Id,
        MascotaId = e.MascotaId,
        PropietarioId = e.PropietarioId,
        VeterinariaId = e.VeterinariaId,
        VeterinariaNombreExterna = e.VeterinariaNombreExterna,
        FechaAtencion = e.FechaAtencion,
        Motivo = e.Motivo,
        Sintomas = e.Sintomas,
        TratamientoAplicado = e.TratamientoAplicado,
        EsEnPlataforma = e.EsEnPlataforma,
        ArchivoAdjuntoUrl = e.ArchivoAdjuntoUrl,
        FechaRegistro = e.FechaRegistro,
        NivelSeveridad = e.NivelSeveridad,
        FrecuenciaCardiaca = e.FrecuenciaCardiaca,
        SaturacionO2 = e.SaturacionO2,
        Temperatura = e.Temperatura,
        EstadoPaciente = e.EstadoPaciente,
        MedicoACargo = e.MedicoACargo,
        Diagnostico = e.Diagnostico
    };

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
        return Ok(emergencias.Select(MapToDto));
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

        return Ok(MapToDto(emergencia));
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

        var nivelSeveridad = "Nivel1_Critico";
        if (crearDto.NivelSeveridad != null)
        {
            if (!Enum.TryParse<NivelSeveridadEmergencia>(crearDto.NivelSeveridad, true, out var nivel)
                || !Enum.IsDefined(typeof(NivelSeveridadEmergencia), nivel))
                return BadRequest(new { mensaje = "Nivel de severidad no valido (use Nivel1_Critico, Nivel2_Urgente o Resuelto)" });

            nivelSeveridad = nivel.ToString();
        }

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
            FechaRegistro = DateTime.UtcNow,
            NivelSeveridad = nivelSeveridad,
            FrecuenciaCardiaca = crearDto.FrecuenciaCardiaca,
            SaturacionO2 = crearDto.SaturacionO2,
            Temperatura = crearDto.Temperatura,
            EstadoPaciente = crearDto.EstadoPaciente,
            MedicoACargo = crearDto.MedicoACargo,
            Diagnostico = crearDto.Diagnostico
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
        return Created($"/api/emergencias/{created.Id}", MapToDto(created));
    }

    /// <summary>
    /// Actualizacion parcial: los campos null del DTO preservan el valor existente.
    /// MascotaId y EsEnPlataforma no se pueden modificar (se fijan al crear).
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarEmergenciaDto actualizarDto)
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

        if (actualizarDto.NivelSeveridad != null)
        {
            if (!Enum.TryParse<NivelSeveridadEmergencia>(actualizarDto.NivelSeveridad, true, out var nivel)
                || !Enum.IsDefined(typeof(NivelSeveridadEmergencia), nivel))
                return BadRequest(new { mensaje = "Nivel de severidad no valido (use Nivel1_Critico, Nivel2_Urgente o Resuelto)" });

            emergencia.NivelSeveridad = nivel.ToString();
        }

        if (actualizarDto.FechaAtencion != null)
            emergencia.FechaAtencion = actualizarDto.FechaAtencion.Value;

        if (actualizarDto.Motivo != null)
            emergencia.Motivo = actualizarDto.Motivo.Trim();

        if (actualizarDto.Sintomas != null)
            emergencia.Sintomas = actualizarDto.Sintomas;

        if (actualizarDto.TratamientoAplicado != null)
            emergencia.TratamientoAplicado = actualizarDto.TratamientoAplicado;

        if (actualizarDto.ArchivoAdjuntoUrl != null)
            emergencia.ArchivoAdjuntoUrl = actualizarDto.ArchivoAdjuntoUrl;

        if (actualizarDto.FrecuenciaCardiaca != null)
            emergencia.FrecuenciaCardiaca = actualizarDto.FrecuenciaCardiaca;

        if (actualizarDto.SaturacionO2 != null)
            emergencia.SaturacionO2 = actualizarDto.SaturacionO2;

        if (actualizarDto.Temperatura != null)
            emergencia.Temperatura = actualizarDto.Temperatura;

        if (actualizarDto.EstadoPaciente != null)
            emergencia.EstadoPaciente = actualizarDto.EstadoPaciente;

        if (actualizarDto.MedicoACargo != null)
            emergencia.MedicoACargo = actualizarDto.MedicoACargo;

        if (actualizarDto.Diagnostico != null)
            emergencia.Diagnostico = actualizarDto.Diagnostico;

        await _emergenciaRepository.UpdateAsync(emergencia);
        return NoContent();
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
