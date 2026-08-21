using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Mascota;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MascotasController : ControllerBase
{
    private readonly IMascotaRepository _mascotaRepository;

    public MascotasController(IMascotaRepository mascotaRepository)
    {
        _mascotaRepository = mascotaRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool EsFuncionario =>
        User.IsInRole("1") || User.IsInRole("2") || User.IsInRole("3");

    private static MascotaDto MapToDto(Mascota m) => new()
    {
        Id = m.Id,
        Nombre = m.Nombre,
        Especie = m.Especie,
        Raza = m.Raza,
        Sexo = m.Sexo,
        FechaNacimiento = m.FechaNacimiento,
        Peso = m.Peso,
        Color = m.Color,
        Identificacion = m.Identificacion,
        FotoUrl = m.FotoUrl,
        EstadoSalud = m.EstadoSalud,
        ProximaVacuna = m.ProximaVacuna,
        ProximaVacunaFecha = m.ProximaVacunaFecha,
        MedicacionActual = m.MedicacionActual,
        ProximaMedicacionFecha = m.ProximaMedicacionFecha,
        DueñoId = m.DuenioId,
        DueñoNombre = m.Duenio?.Nombre ?? string.Empty,
        Activo = m.Activo,
        FechaRegistro = m.FechaRegistro,
        VeterinariaId = m.VeterinariaId
    };

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        // Cliente solo ve sus mascotas; funcionarios ven las del sistema (modo lectura)
        if (EsFuncionario)
        {
            var todas = await _mascotaRepository.GetAllAsync();
            return Ok(todas.Where(m => m.Activo).Select(MapToDto));
        }

        var propias = await _mascotaRepository.GetByDuenioIdAsync(UsuarioAutenticadoId);
        return Ok(propias.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(id);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {id} no encontrada" });

        if (!EsFuncionario && mascota.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        return Ok(MapToDto(mascota));
    }

    [HttpGet("duenio/{duenioId}")]
    public async Task<IActionResult> GetByDuenioAsync(int duenioId)
    {
        if (!EsFuncionario && duenioId != UsuarioAutenticadoId)
            return Forbid();

        var mascotas = await _mascotaRepository.GetByDuenioIdAsync(duenioId);
        return Ok(mascotas.Select(MapToDto));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearMascotaDto crearDto)
    {
        var estadoSalud = "Saludable";
        if (crearDto.EstadoSalud != null)
        {
            if (!Enum.TryParse<EstadoSaludMascota>(crearDto.EstadoSalud, true, out var parsed)
                || !Enum.IsDefined(typeof(EstadoSaludMascota), parsed))
                return BadRequest(new { mensaje = "Estado de salud no valido (use Saludable o Tratamiento)" });

            estadoSalud = parsed.ToString();
        }

        // El dueno siempre es el usuario autenticado (evita suplantacion de DuenioId)
        var entity = new Mascota
        {
            Nombre = crearDto.Nombre,
            Especie = crearDto.Especie,
            Raza = crearDto.Raza,
            Sexo = crearDto.Sexo,
            FechaNacimiento = crearDto.FechaNacimiento,
            Peso = crearDto.Peso,
            Color = crearDto.Color,
            Identificacion = crearDto.Identificacion,
            FotoUrl = crearDto.FotoUrl,
            EstadoSalud = estadoSalud,
            ProximaVacuna = crearDto.ProximaVacuna,
            ProximaVacunaFecha = crearDto.ProximaVacunaFecha,
            MedicacionActual = crearDto.MedicacionActual,
            ProximaMedicacionFecha = crearDto.ProximaMedicacionFecha,
            DuenioId = UsuarioAutenticadoId,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _mascotaRepository.AddAsync(entity);
        return Ok(MapToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarMascotaDto actualizarDto)
    {
        var entity = await _mascotaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Mascota con ID {id} no encontrada" });

        if (!EsFuncionario && entity.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        if (actualizarDto.EstadoSalud != null)
        {
            if (!Enum.TryParse<EstadoSaludMascota>(actualizarDto.EstadoSalud, true, out var estadoSalud)
                || !Enum.IsDefined(typeof(EstadoSaludMascota), estadoSalud))
                return BadRequest(new { mensaje = "Estado de salud no valido (use Saludable o Tratamiento)" });

            entity.EstadoSalud = estadoSalud.ToString();
        }

        entity.Nombre = actualizarDto.Nombre;
        entity.Especie = actualizarDto.Especie;
        entity.Raza = actualizarDto.Raza;
        entity.Sexo = actualizarDto.Sexo;
        entity.FechaNacimiento = actualizarDto.FechaNacimiento;
        entity.Peso = actualizarDto.Peso;
        entity.Color = actualizarDto.Color;
        entity.Identificacion = actualizarDto.Identificacion;
        entity.FotoUrl = actualizarDto.FotoUrl;

        // Update parcial para los campos nuevos de salud: si el DTO trae null, se preserva
        // el valor existente (consistente con la semantica de EstadoSalud y la tarea #2).
        if (actualizarDto.ProximaVacuna != null)
            entity.ProximaVacuna = actualizarDto.ProximaVacuna;

        if (actualizarDto.ProximaVacunaFecha != null)
            entity.ProximaVacunaFecha = actualizarDto.ProximaVacunaFecha;

        if (actualizarDto.MedicacionActual != null)
            entity.MedicacionActual = actualizarDto.MedicacionActual;

        if (actualizarDto.ProximaMedicacionFecha != null)
            entity.ProximaMedicacionFecha = actualizarDto.ProximaMedicacionFecha;

        await _mascotaRepository.UpdateAsync(entity);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _mascotaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Mascota con ID {id} no encontrada" });

        if (!EsFuncionario && entity.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        entity.Activo = false;
        await _mascotaRepository.UpdateAsync(entity);
        return NoContent();
    }
}
