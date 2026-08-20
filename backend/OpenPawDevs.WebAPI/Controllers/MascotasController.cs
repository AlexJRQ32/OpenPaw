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

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        // Cliente solo ve sus mascotas; funcionarios ven las del sistema (modo lectura)
        if (EsFuncionario)
        {
            var todas = await _mascotaRepository.GetAllAsync();
            return Ok(todas.Where(m => m.Activo));
        }

        var propias = await _mascotaRepository.GetByDuenioIdAsync(UsuarioAutenticadoId);
        return Ok(propias);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(id);
        if (mascota == null)
            return NotFound(new { mensaje = $"Mascota con ID {id} no encontrada" });

        if (!EsFuncionario && mascota.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        return Ok(mascota);
    }

    [HttpGet("duenio/{duenioId}")]
    public async Task<IActionResult> GetByDuenioAsync(int duenioId)
    {
        if (!EsFuncionario && duenioId != UsuarioAutenticadoId)
            return Forbid();

        var mascotas = await _mascotaRepository.GetByDuenioIdAsync(duenioId);
        return Ok(mascotas);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearMascotaDto crearDto)
    {
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
            DuenioId = UsuarioAutenticadoId,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _mascotaRepository.AddAsync(entity);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarMascotaDto actualizarDto)
    {
        var entity = await _mascotaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Mascota con ID {id} no encontrada" });

        if (!EsFuncionario && entity.DuenioId != UsuarioAutenticadoId)
            return Forbid();

        entity.Nombre = actualizarDto.Nombre;
        entity.Especie = actualizarDto.Especie;
        entity.Raza = actualizarDto.Raza;
        entity.Sexo = actualizarDto.Sexo;
        entity.FechaNacimiento = actualizarDto.FechaNacimiento;
        entity.Peso = actualizarDto.Peso;
        entity.Color = actualizarDto.Color;
        entity.Identificacion = actualizarDto.Identificacion;
        entity.FotoUrl = actualizarDto.FotoUrl;

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
