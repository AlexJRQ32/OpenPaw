using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Almacen;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.DTOs.Common;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
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
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Sprint 1 - Tarea 7: validacion de enums (strings legibles del wireframe).
        // Enum.TryParse("999", ...) devuelve true; sin IsDefined se persistiria un valor invalido.
        // M2: tras el TryParse exitoso + IsDefined se normaliza SIEMPRE a la forma canonica
        // (tipo.ToString()) para que la BD nunca reciba "2", "interno", "INTERNO", etc.
        if (crearDto.TipoAlmacen != null)
        {
            if (!Enum.TryParse<TipoAlmacen>(crearDto.TipoAlmacen, true, out var tipo)
                || !Enum.IsDefined(typeof(TipoAlmacen), tipo))
                return BadRequest(new { mensaje = "Tipo de almacen no valido (use Interno, Externo o CentroDistribucion)" });

            crearDto.TipoAlmacen = tipo.ToString();
        }

        if (crearDto.CapacidadAlmacenamiento != null)
        {
            if (!Enum.TryParse<CapacidadAlmacenamiento>(crearDto.CapacidadAlmacenamiento, true, out var capacidad)
                || !Enum.IsDefined(typeof(CapacidadAlmacenamiento), capacidad))
                return BadRequest(new { mensaje = "Capacidad de almacenamiento no valida (use Menos50, De50a150, De150a500 o Mas500)" });

            crearDto.CapacidadAlmacenamiento = capacidad.ToString();
        }

        if (crearDto.ControlTemperatura != null)
        {
            if (!Enum.TryParse<ControlTemperatura>(crearDto.ControlTemperatura, true, out var temperatura)
                || !Enum.IsDefined(typeof(ControlTemperatura), temperatura))
                return BadRequest(new { mensaje = "Control de temperatura no valido (use SinControl, Ambiente, CadenaFrio o Mixto)" });

            crearDto.ControlTemperatura = temperatura.ToString();
        }

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
            TipoAlmacen = crearDto.TipoAlmacen,
            NombreResponsable = crearDto.NombreResponsable,
            CapacidadAlmacenamiento = crearDto.CapacidadAlmacenamiento,
            ControlTemperatura = crearDto.ControlTemperatura,
            Latitud = crearDto.Latitud,
            Longitud = crearDto.Longitud,
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

        return Ok(AlmacenMapeo.ToDto(created));
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
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarAlmacenDto actualizarDto)
    {
        // Guard defensivo: el filtro [ApiController] normalmente valida antes del action,
        // pero garantiza que un DTO invalido (ej. latitud fuera de rango) devuelva 400
        // y nunca llegue a la BD (evita DbUpdateException -> 500).
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var entity = await _almacenRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Almacen con ID {id} no encontrado" });

        // Control de acceso (previene IDOR): el endpoint admite roles "1,2,3"
        // (admin, veterinaria, almacen), pero solo el dueno del almacen (UsuarioId)
        // o un administrador (rol "1") pueden modificarlo. Sin este guard, un rol
        // 2/3 autenticado podria editar almacenes ajenos (IDOR).
        if (!User.IsInRole("1") && entity.UsuarioId != GetAuthenticatedUserId())
            return Forbid();

        // Sprint 1 - Tarea 7: validacion de enums (strings legibles del wireframe).
        // M2: tras el TryParse exitoso + IsDefined se normaliza SIEMPRE a la forma
        // canonica (tipo.ToString()). Enum.TryParse acepta "2", "interno", "INTERNO";
        // sin la normalizacion la BD persistiria el string crudo con valores inconsistentes.
        if (actualizarDto.TipoAlmacen != null)
        {
            if (!Enum.TryParse<TipoAlmacen>(actualizarDto.TipoAlmacen, true, out var tipo)
                || !Enum.IsDefined(typeof(TipoAlmacen), tipo))
                return BadRequest(new { mensaje = "Tipo de almacen no valido (use Interno, Externo o CentroDistribucion)" });

            actualizarDto.TipoAlmacen = tipo.ToString();
        }

        if (actualizarDto.CapacidadAlmacenamiento != null)
        {
            if (!Enum.TryParse<CapacidadAlmacenamiento>(actualizarDto.CapacidadAlmacenamiento, true, out var capacidad)
                || !Enum.IsDefined(typeof(CapacidadAlmacenamiento), capacidad))
                return BadRequest(new { mensaje = "Capacidad de almacenamiento no valida (use Menos50, De50a150, De150a500 o Mas500)" });

            actualizarDto.CapacidadAlmacenamiento = capacidad.ToString();
        }

        if (actualizarDto.ControlTemperatura != null)
        {
            if (!Enum.TryParse<ControlTemperatura>(actualizarDto.ControlTemperatura, true, out var temperatura)
                || !Enum.IsDefined(typeof(ControlTemperatura), temperatura))
                return BadRequest(new { mensaje = "Control de temperatura no valido (use SinControl, Ambiente, CadenaFrio o Mixto)" });

            actualizarDto.ControlTemperatura = temperatura.ToString();
        }

        // Update parcial: null en el DTO preserva el valor actual (no borra campos no enviados);
        // cadena vacia ("") si sobrescribe el campo.
        AlmacenMapeo.AplicarActualizacion(entity, actualizarDto);
        await _almacenRepository.UpdateAsync(entity);

        return Ok(AlmacenMapeo.ToDto(entity));
    }

    private static AlmacenDto MapToDto(Almacen a) => AlmacenMapeo.ToDto(a);

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(idClaim!);
    }
}
