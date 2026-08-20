using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiciosVeterinariosController : ControllerBase
{
    private readonly IServicioVeterinarioRepository _servicioRepository;
    private readonly IVeterinariaRepository _veterinariaRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public ServiciosVeterinariosController(
        IServicioVeterinarioRepository servicioRepository,
        IVeterinariaRepository veterinariaRepository,
        IUsuarioRepository usuarioRepository)
    {
        _servicioRepository = servicioRepository;
        _veterinariaRepository = veterinariaRepository;
        _usuarioRepository = usuarioRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllAsync()
    {
        var servicios = await _servicioRepository.GetAllAsync();
        return Ok(servicios.Select(MapToDto));
    }

    /// <summary>
    /// Servicios que el usuario autenticado puede gestionar segun su rol y comercio vinculado.
    /// - Administrador: todos los servicios
    /// - Veterinaria: solo los servicios de su veterinaria
    /// </summary>
    [HttpGet("mios")]
    [Authorize(Roles = "1,2")]
    public async Task<IActionResult> GetMiosAsync()
    {
        var userId = GetAuthenticatedUserId();
        var usuario = await _usuarioRepository.GetByIdAsync(userId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        IReadOnlyList<ServicioVeterinario> servicios;
        if (usuario.RolId == 1)
        {
            servicios = await _servicioRepository.GetAllAsync();
        }
        else if (usuario.VeterinariaId.HasValue)
        {
            servicios = await _servicioRepository.GetByVeterinariaIdAsync(usuario.VeterinariaId.Value);
        }
        else
        {
            servicios = new List<ServicioVeterinario>();
        }

        return Ok(servicios.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var servicio = await _servicioRepository.GetByIdAsync(id);
        if (servicio == null)
            return NotFound(new { mensaje = $"Servicio veterinario con ID {id} no encontrado" });

        return Ok(MapToDto(servicio));
    }

    [HttpGet("veterinaria/{veterinariaId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByVeterinariaAsync(int veterinariaId)
    {
        var servicios = await _servicioRepository.GetByVeterinariaIdAsync(veterinariaId);
        return Ok(servicios.Select(MapToDto));
    }

    [HttpGet("categoria/{categoria}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCategoriaAsync(CategoriaServicioVeterinario categoria)
    {
        var servicios = await _servicioRepository.GetByCategoriaAsync(categoria);
        return Ok(servicios.Select(MapToDto));
    }

    [HttpPost]
    [Authorize(Roles = "1,2")]
    public async Task<IActionResult> CreateAsync([FromBody] CrearServicioVeterinarioDto crearDto)
    {
        if (!await _veterinariaRepository.ExistsAsync(crearDto.VeterinariaId))
            return BadRequest(new { mensaje = $"Veterinaria con ID {crearDto.VeterinariaId} no encontrada" });

        var entity = new ServicioVeterinario
        {
            VeterinariaId = crearDto.VeterinariaId,
            Nombre = crearDto.Nombre.Trim(),
            Descripcion = crearDto.Descripcion,
            Categoria = crearDto.Categoria,
            Precio = crearDto.Precio,
            DuracionMinutos = crearDto.DuracionMinutos,
            Activo = true,
            FechaRegistro = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        };

        var created = await _servicioRepository.AddAsync(entity);
        return Created($"/api/serviciosveterinarios/{created.Id}", MapToDto(created));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "1,2")]
    public async Task<IActionResult> UpdateAsync(
        int id, [FromBody] ActualizarServicioVeterinarioDto actualizarDto)
    {
        var entity = await _servicioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Servicio veterinario con ID {id} no encontrado" });

        entity.Nombre = actualizarDto.Nombre.Trim();
        entity.Descripcion = actualizarDto.Descripcion;
        entity.Categoria = actualizarDto.Categoria;
        entity.Precio = actualizarDto.Precio;
        entity.DuracionMinutos = actualizarDto.DuracionMinutos;
        entity.Activo = actualizarDto.Activo;
        entity.FechaActualizacion = DateTime.UtcNow;

        await _servicioRepository.UpdateAsync(entity);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "1,2")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _servicioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Servicio veterinario con ID {id} no encontrado" });

        await _servicioRepository.DeleteAsync(entity);
        return NoContent();
    }

    private static ServicioVeterinarioDto MapToDto(ServicioVeterinario servicio)
    {
        return new ServicioVeterinarioDto
        {
            Id = servicio.Id,
            VeterinariaId = servicio.VeterinariaId,
            VeterinariaNombre = servicio.Veterinaria?.Nombre,
            Nombre = servicio.Nombre,
            Descripcion = servicio.Descripcion,
            Categoria = servicio.Categoria,
            Precio = servicio.Precio,
            DuracionMinutos = servicio.DuracionMinutos,
            Activo = servicio.Activo
        };
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.Parse(idClaim!);
    }
}
