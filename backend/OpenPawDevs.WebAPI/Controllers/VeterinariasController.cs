using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.DTOs.Common;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VeterinariasController : ControllerBase
{
    private readonly IVeterinariaRepository _veterinariaRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public VeterinariasController(IVeterinariaRepository veterinariaRepository, IUsuarioRepository usuarioRepository)
    {
        _veterinariaRepository = veterinariaRepository;
        _usuarioRepository = usuarioRepository;
    }

    [HttpGet]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetAllAsync()
    {
        var veterinarias = await _veterinariaRepository.GetAllAsync();
        var dto = veterinarias.Select(v => MapToDto(v));
        return Ok(dto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var veterinaria = await _veterinariaRepository.GetByIdAsync(id);
        if (veterinaria == null)
            return NotFound(new { mensaje = $"Veterinaria con ID {id} no encontrada" });

        return Ok(MapToDto(veterinaria));
    }

    [HttpGet("pendientes")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetPendientesAsync()
    {
        var veterinarias = await _veterinariaRepository.GetPendientesAsync();
        var dto = veterinarias.Select(v => MapToDto(v));
        return Ok(dto);
    }

    [HttpGet("aprobadas")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAprobadasAsync()
    {
        var veterinarias = await _veterinariaRepository.GetAprobadasAsync();
        var dto = veterinarias.Select(v => MapToDto(v));
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearVeterinariaDto crearDto)
    {
        var entity = new Veterinaria
        {
            Nombre = crearDto.Nombre,
            CedulaJuridica = crearDto.CedulaJuridica,
            Direccion = crearDto.Direccion,
            Telefono = crearDto.Telefono,
            Email = crearDto.Email,
            Horario = crearDto.Horario,
            Descripcion = crearDto.Descripcion,
            LogoUrl = crearDto.LogoUrl,
            UsuarioId = GetAuthenticatedUserId(),
            Activo = true,
            Aprobada = false,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _veterinariaRepository.AddAsync(entity);

        var usuario = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuario != null)
        {
            usuario.VeterinariaId = created.Id;
            await _usuarioRepository.UpdateAsync(usuario);
        }

        return Ok(MapToDto(created));
    }

    [HttpPut("{id}/aprobar")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> AprobarAsync(int id)
    {
        var entity = await _veterinariaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Veterinaria con ID {id} no encontrada" });

        entity.Aprobada = true;
        entity.Rechazada = false;
        await _veterinariaRepository.UpdateAsync(entity);

        // Asignar rol Veterinaria al usuario que solicitó el registro
        var usuario = await _usuarioRepository.GetByIdAsync(entity.UsuarioId);
        if (usuario != null && usuario.RolId == (int)Core.Enums.RolTipo.Cliente)
        {
            usuario.RolId = (int)Core.Enums.RolTipo.Veterinaria;
            await _usuarioRepository.UpdateAsync(usuario);
        }

        return NoContent();
    }

    [HttpPut("{id}/rechazar")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> RechazarAsync(int id, [FromBody] MotivoRechazoDto motivoDto)
    {
        var entity = await _veterinariaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Veterinaria con ID {id} no encontrada" });

        entity.Rechazada = true;
        entity.Aprobada = false;
        entity.MotivoRechazo = motivoDto?.MotivoRechazo;
        await _veterinariaRepository.UpdateAsync(entity);
        return NoContent();
    }

    private static VeterinariaDto MapToDto(Veterinaria v)
    {
        return new VeterinariaDto
        {
            Id = v.Id,
            Nombre = v.Nombre,
            CedulaJuridica = v.CedulaJuridica,
            Direccion = v.Direccion,
            Telefono = v.Telefono,
            Email = v.Email,
            Descripcion = v.Descripcion,
            Horario = v.Horario,
            LogoUrl = v.LogoUrl,
            Activo = v.Activo,
            Aprobada = v.Aprobada,
            Rechazada = v.Rechazada,
            MotivoRechazo = v.MotivoRechazo,
            DocumentoPersoneriaJuridica = v.DocumentoPersoneriaJuridica,
            FechaRegistro = v.FechaRegistro,
            UsuarioId = v.UsuarioId
        };
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(idClaim!);
    }
}
