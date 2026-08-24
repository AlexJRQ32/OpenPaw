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
        // IDOR fix (#81): rol Veterinaria (2) solo puede crear servicios para su propia veterinaria.
        // Admin (rol 1) puede crear para cualquier veterinaria.
        var usuario = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuario != null && usuario.RolId == 2)
        {
            if (!usuario.VeterinariaId.HasValue || usuario.VeterinariaId.Value != crearDto.VeterinariaId)
                return Forbid();
        }

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

        // IDOR fix (#81): rol Veterinaria (2) solo puede modificar servicios de su propia veterinaria.
        var usuario = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuario != null && usuario.RolId == 2)
        {
            if (!usuario.VeterinariaId.HasValue || entity.VeterinariaId != usuario.VeterinariaId.Value)
                return Forbid();
        }

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

        // IDOR fix (#81): rol Veterinaria (2) solo puede eliminar servicios de su propia veterinaria.
        var usuarioDelete = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuarioDelete != null && usuarioDelete.RolId == 2)
        {
            if (!usuarioDelete.VeterinariaId.HasValue || entity.VeterinariaId != usuarioDelete.VeterinariaId.Value)
                return Forbid();
        }

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
        if (User == null) return 0;
        try
        {
            var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (idClaim == null) return 0;
            return int.TryParse(idClaim, out var id) ? id : 0;
        }
        catch
        {
            return 0;
        }
    }
}
