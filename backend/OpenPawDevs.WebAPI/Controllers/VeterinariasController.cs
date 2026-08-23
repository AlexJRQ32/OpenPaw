using System.IdentityModel.Tokens.Jwt;
using System.Net;
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
        var dto = veterinarias.Select(VeterinariaMapeo.ToDto);
        return Ok(dto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var veterinaria = await _veterinariaRepository.GetByIdAsync(id);
        if (veterinaria == null)
            return NotFound(new { mensaje = $"Veterinaria con ID {id} no encontrada" });

        return Ok(VeterinariaMapeo.ToDto(veterinaria));
    }

    [HttpGet("pendientes")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetPendientesAsync()
    {
        var veterinarias = await _veterinariaRepository.GetPendientesAsync();
        var dto = veterinarias.Select(VeterinariaMapeo.ToDto);
        return Ok(dto);
    }

    [HttpGet("aprobadas")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAprobadasAsync()
    {
        var veterinarias = await _veterinariaRepository.GetAprobadasAsync();
        var dto = veterinarias.Select(VeterinariaMapeo.ToDto);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearVeterinariaDto crearDto)
    {
        // Deuda #89 (a): unicidad de cédula jurídica -> 409 si ya existe (el frontend ya maneja 409)
        if (!string.IsNullOrWhiteSpace(crearDto.CedulaJuridica))
        {
            var existente = await _veterinariaRepository.GetByCedulaAsync(crearDto.CedulaJuridica.Trim());
            if (existente != null)
                return Conflict(new { mensaje = $"Ya existe una veterinaria con la cédula jurídica {crearDto.CedulaJuridica}" });
        }

        // Deuda #89 (b): sanitización XSS almacenado -> HtmlEncode antes de persistir
        var entity = new Veterinaria
        {
            Nombre = Sanitize(crearDto.Nombre)!,
            CedulaJuridica = crearDto.CedulaJuridica?.Trim(),
            Direccion = Sanitize(crearDto.Direccion),
            Telefono = crearDto.Telefono,
            Email = crearDto.Email,
            Horario = crearDto.Horario,
            Descripcion = Sanitize(crearDto.Descripcion),
            LogoUrl = crearDto.LogoUrl,
            RazonSocial = Sanitize(crearDto.RazonSocial),
            Nit = crearDto.Nit,
            CorreoOficial = crearDto.CorreoOficial,
            Latitud = crearDto.Latitud,
            Longitud = crearDto.Longitud,
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

        return Ok(VeterinariaMapeo.ToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarVeterinariaDto actualizarDto)
    {
        // El filtro [ApiController] normalmente hace esto antes del action; el guard es defensivo
        // y garantiza que un DTO invalido (ej. Direccion > 300 chars) devuelva 400 y nunca llegue
        // a la BD (evita DbUpdateException -> 500).
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var entity = await _veterinariaRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Veterinaria con ID {id} no encontrada" });

        // Control de acceso (previene IDOR): solo el dueno de la veterinaria o un administrador
        // (rol "1") pueden modificarla. Un cliente autenticado no debe poder editar veterinarias
        // ajenas iterando IDs. Si la veterinaria no tiene dueno vinculado, solo el admin puede editarla.
        if (!User.IsInRole("1") && entity.UsuarioId != GetAuthenticatedUserId())
            return Forbid();

        // Deuda #89 (b): sanitizar campos de texto en actualización (XSS)
        if (actualizarDto.RazonSocial != null) actualizarDto.RazonSocial = Sanitize(actualizarDto.RazonSocial);
        if (actualizarDto.Direccion != null) actualizarDto.Direccion = Sanitize(actualizarDto.Direccion);
        if (actualizarDto.Descripcion != null) actualizarDto.Descripcion = Sanitize(actualizarDto.Descripcion);

        // Update parcial: null en el DTO preserva el valor actual (no borra campos no enviados);
        // cadena vacia ("") si sobrescribe el campo.
        VeterinariaMapeo.AplicarActualizacion(entity, actualizarDto);
        await _veterinariaRepository.UpdateAsync(entity);

        return Ok(VeterinariaMapeo.ToDto(entity));
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

    private static string? Sanitize(string? input) =>
        input == null ? null : WebUtility.HtmlEncode(input);

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(idClaim!);
    }
}
