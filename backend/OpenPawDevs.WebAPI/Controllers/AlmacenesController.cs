using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Almacen;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.DTOs.Common;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlmacenesController : ControllerBase
{
    private readonly IAlmacenRepository _almacenRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public AlmacenesController(IAlmacenRepository almacenRepository, IUsuarioRepository usuarioRepository)
    {
        _almacenRepository = almacenRepository;
        _usuarioRepository = usuarioRepository;
    }

    [HttpGet]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetAllAsync()
    {
        var almacenes = await _almacenRepository.GetAllAsync();
        var dto = almacenes.Select(a => MapToDto(a));
        return Ok(dto);
    }

    /// <summary>
    /// Almacenes que el usuario autenticado puede gestionar segun su rol y comercio vinculado.
    /// - Administrador: todos los almacenes
    /// - Veterinaria: los almacenes de su veterinaria
    /// - Almacen: su propio almacen
    /// </summary>
    [HttpGet("mios")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetMiosAsync()
    {
        var userId = GetAuthenticatedUserId();
        var usuario = await _usuarioRepository.GetByIdAsync(userId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        IReadOnlyList<Almacen> almacenes;
        if (usuario.RolId == 1)
        {
            almacenes = await _almacenRepository.GetAllAsync();
        }
        else if (usuario.RolId == 3 && usuario.AlmacenId.HasValue)
        {
            var propio = await _almacenRepository.GetByIdAsync(usuario.AlmacenId.Value);
            almacenes = propio != null
                ? new List<Almacen> { propio }
                : new List<Almacen>();
        }
        else if (usuario.VeterinariaId.HasValue)
        {
            almacenes = await _almacenRepository.GetByVeterinariaIdAsync(usuario.VeterinariaId.Value);
        }
        else
        {
            almacenes = await _almacenRepository.GetByUsuarioIdAsync(userId);
        }

        return Ok(almacenes.Select(a => MapToDto(a)));
    }

    [HttpGet("veterinaria/{veterinariaId}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetByVeterinariaAsync(int veterinariaId)
    {
        var almacenes = await _almacenRepository.GetByVeterinariaIdAsync(veterinariaId);
        var dto = almacenes.Select(a => MapToDto(a));
        return Ok(dto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var almacen = await _almacenRepository.GetByIdAsync(id);
        if (almacen == null)
            return NotFound(new { mensaje = $"Almacen con ID {id} no encontrado" });

        return Ok(MapToDto(almacen));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearAlmacenDto crearDto)
    {
        var entity = new Almacen
        {
            Nombre = crearDto.Nombre,
            CedulaJuridica = crearDto.CedulaJuridica,
            Telefono = crearDto.Telefono,
            Email = crearDto.Email,
            VeterinariaId = crearDto.VeterinariaId,
            Direccion = crearDto.Direccion,
            Descripcion = crearDto.Descripcion,
            Tipo = crearDto.Tipo ?? 0,
            UsuarioId = GetAuthenticatedUserId(),
            Activo = true,
            Aprobada = false,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _almacenRepository.AddAsync(entity);

        var usuario = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuario != null)
        {
            usuario.AlmacenId = created.Id;
            await _usuarioRepository.UpdateAsync(usuario);
        }

        return Ok(MapToDto(created));
    }

    [HttpPut("{id}/aprobar")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> AprobarAsync(int id)
    {
        var entity = await _almacenRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Almacen con ID {id} no encontrado" });

        entity.Aprobada = true;
        entity.Rechazada = false;
        await _almacenRepository.UpdateAsync(entity);

        // Asignar rol Almacen al usuario que solicitó el registro
        var usuario = await _usuarioRepository.GetByIdAsync(entity.UsuarioId);
        if (usuario != null && usuario.RolId == (int)Core.Enums.RolTipo.Cliente)
        {
            usuario.RolId = (int)Core.Enums.RolTipo.Almacen;
            await _usuarioRepository.UpdateAsync(usuario);
        }

        return NoContent();
    }

    [HttpPut("{id}/rechazar")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> RechazarAsync(int id, [FromBody] MotivoRechazoDto motivoDto)
    {
        var entity = await _almacenRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Almacen con ID {id} no encontrado" });

        entity.Rechazada = true;
        entity.Aprobada = false;
        entity.MotivoRechazo = motivoDto?.MotivoRechazo;
        await _almacenRepository.UpdateAsync(entity);
        return NoContent();
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarAlmacenDto actualizarDto)
    {
        var entity = await _almacenRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Almacen con ID {id} no encontrado" });

        entity.Nombre = actualizarDto.Nombre;
        entity.VeterinariaId = actualizarDto.VeterinariaId;
        entity.Direccion = actualizarDto.Direccion;
        entity.Tipo = actualizarDto.Tipo;
        entity.Activo = actualizarDto.Activo;

        await _almacenRepository.UpdateAsync(entity);
        return NoContent();
    }

    private static AlmacenDto MapToDto(Almacen a)
    {
        return new AlmacenDto
        {
            Id = a.Id,
            Nombre = a.Nombre,
            CedulaJuridica = a.CedulaJuridica,
            Direccion = a.Direccion,
            Telefono = a.Telefono,
            Email = a.Email,
            Descripcion = a.Descripcion,
            Aprobada = a.Aprobada,
            Rechazada = a.Rechazada,
            MotivoRechazo = a.MotivoRechazo,
            FechaRegistro = a.FechaRegistro
        };
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(idClaim!);
    }
}
