using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Usuario;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly INotificacionRepository _notificacionRepository;
    private readonly IVeterinariaRepository _veterinariaRepository;
    private readonly IAlmacenRepository _almacenRepository;
    private readonly IMascotaRepository _mascotaRepository;
    private readonly ICitaRepository _citaRepository;

    public UsuariosController(
        IUsuarioRepository usuarioRepository,
        INotificacionRepository notificacionRepository,
        IVeterinariaRepository veterinariaRepository,
        IAlmacenRepository almacenRepository,
        IMascotaRepository mascotaRepository,
        ICitaRepository citaRepository)
    {
        _usuarioRepository = usuarioRepository;
        _notificacionRepository = notificacionRepository;
        _veterinariaRepository = veterinariaRepository;
        _almacenRepository = almacenRepository;
        _mascotaRepository = mascotaRepository;
        _citaRepository = citaRepository;
    }

    [HttpGet]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetAllAsync([FromQuery] int? veterinariaId, [FromQuery] int? almacenId)
    {
        var usuarios = await _usuarioRepository.GetAllAsync();

        if (veterinariaId.HasValue)
            usuarios = usuarios.Where(u => u.VeterinariaId == veterinariaId.Value).ToList();
        if (almacenId.HasValue)
            usuarios = usuarios.Where(u => u.AlmacenId == almacenId.Value).ToList();

        return Ok(usuarios.Select(ToListadoDto));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { mensaje = $"Usuario con ID {id} no encontrado" });

        return Ok(ToDto(usuario));
    }

    /// <summary> PBI 49 - Perfil del Usuario: Obtener el perfil del usuario autenticado </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMeAsync()
    {
        var entity = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (entity == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        return Ok(ToDto(entity));
    }

    /// <summary> PBI 49 - Perfil del Usuario: Historial de registros del usuario autenticado </summary>
    [HttpGet("me/registros")]
    public async Task<IActionResult> GetMisRegistrosAsync()
    {
        var userId = GetAuthenticatedUserId();

        var registros = new List<RegistroDto>();

        var user = await _usuarioRepository.GetByIdAsync(userId);
        if (user != null)
        {
            registros.Add(new RegistroDto
            {
                Tipo = "Registro en OpenPaw",
                Fecha = user.FechaRegistro,
                Estado = "Activo",
                Detalle = "Cuenta de usuario creada"
            });
        }

        var veterinarias = await _veterinariaRepository.GetByUsuarioIdAsync(userId);
        foreach (var v in veterinarias)
        {
            var estado = v.Aprobada ? "Aprobada" : v.Rechazada ? "Rechazada" : "Pendiente";
            registros.Add(new RegistroDto
            {
                Tipo = "Solicitud de Veterinaria",
                Fecha = v.FechaRegistro,
                Estado = estado,
                Detalle = v.Nombre
            });
        }

        var almacenes = await _almacenRepository.GetByUsuarioIdAsync(userId);
        foreach (var a in almacenes)
        {
            var estado = a.Aprobada ? "Aprobado" : a.Rechazada ? "Rechazado" : "Pendiente";
            registros.Add(new RegistroDto
            {
                Tipo = "Solicitud de Almacen",
                Fecha = a.FechaRegistro,
                Estado = estado,
                Detalle = a.Nombre
            });
        }

        return Ok(registros.OrderByDescending(r => r.Fecha).ToList());
    }

    /// <summary> Perfil del Usuario: Rol del usuario y veterinarias vinculadas a sus mascotas </summary>
    [HttpGet("me/veterinaria-info")]
    public async Task<IActionResult> GetMiVeterinariaInfoAsync()
    {
        var userId = GetAuthenticatedUserId();

        var user = await _usuarioRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        var roleMap = new Dictionary<int, string>
        {
            { 1, "Administrador" },
            { 2, "Veterinaria" },
            { 3, "Almacen" },
            { 4, "Cliente" }
        };

        var mascotas = user.RolId == (int)RolTipo.Veterinaria && user.VeterinariaId.HasValue
            ? await _mascotaRepository.GetByVeterinariaIdAsync(user.VeterinariaId.Value)
            : await _mascotaRepository.GetByDuenioIdAsync(userId);
        var citas = await _citaRepository.GetByUsuarioIdAsync(userId);

        var ultimaCitaPorMascota = citas
            .GroupBy(c => c.MascotaId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.FechaHora).First());

        var mascotasDto = mascotas.Select(m =>
        {
            MascotaVeterinariaDto dto = new()
            {
                Id = m.Id,
                Nombre = m.Nombre,
                Especie = m.Especie,
                Raza = m.Raza,
            };

            if (ultimaCitaPorMascota.TryGetValue(m.Id, out var ultima))
            {
                dto.Veterinaria = ultima.Veterinaria?.Nombre;
                dto.UltimaCita = ultima.FechaHora.ToString("yyyy-MM-dd");
            }

            return dto;
        }).ToList();

        return Ok(new InfoPerfilDto
        {
            Rol = roleMap.GetValueOrDefault(user.RolId, "Desconocido"),
            VeterinariaId = user.VeterinariaId,
            AlmacenId = user.AlmacenId,
            Mascotas = mascotasDto
        });
    }

    /// <summary> Dashboard: Estadisticas segun el rol del usuario </summary>
    [HttpGet("me/stats")]
    public async Task<IActionResult> GetMisStatsAsync()
    {
        var userId = GetAuthenticatedUserId();
        var user = await _usuarioRepository.GetByIdAsync(userId);
        if (user == null) return NotFound();

        return user.RolId switch
        {
            1 => Ok(await GetAdminStatsAsync()),
            2 => Ok(await GetVetStatsAsync(userId)),
            3 => Ok(await GetAlmacenStatsAsync(userId)),
            _ => Ok(await GetClienteStatsAsync(userId)),
        };
    }

    private async Task<object> GetAdminStatsAsync()
    {
        var vets = await _veterinariaRepository.GetAllAsync();
        var alms = await _almacenRepository.GetAllAsync();
        var users = await _usuarioRepository.GetAllAsync();

        return new
        {
            vets = vets.Count(v => v.Aprobada),
            stores = alms.Count(a => a.Aprobada),
            pending = vets.Count(v => !v.Aprobada && !v.Rechazada) + alms.Count(a => !a.Aprobada && !a.Rechazada),
            users = users.Count(u => u.Activo),
        };
    }

    private async Task<object> GetVetStatsAsync(int userId)
    {
        var misVets = await _veterinariaRepository.GetByUsuarioIdAsync(userId);
        var vetsAprobadas = misVets.Where(v => v.Aprobada).ToList();
        var vetIds = vetsAprobadas.Select(v => v.Id).ToList();

        var citasCount = 0;
        foreach (var vid in vetIds)
        {
            var citas = await _citaRepository.GetByVeterinariaIdAsync(vid);
            citasCount += citas.Count;
        }

        return new
        {
            veterinarias = vetsAprobadas.Count,
            citas = citasCount,
            mascotas = citasCount,
            pendientes = misVets.Count(v => !v.Aprobada && !v.Rechazada),
        };
    }

    private async Task<object> GetAlmacenStatsAsync(int userId)
    {
        var alms = await _almacenRepository.GetByUsuarioIdAsync(userId);
        var almsAprobados = alms.Where(a => a.Aprobada).ToList();

        return new
        {
            almacenes = almsAprobados.Count,
            pendientes = alms.Count(a => !a.Aprobada && !a.Rechazada),
        };
    }

    private async Task<object> GetClienteStatsAsync(int userId)
    {
        var mascotas = await _mascotaRepository.GetByDuenioIdAsync(userId);
        var citas = await _citaRepository.GetByUsuarioIdAsync(userId);
        var vetsEnCitas = citas.Select(c => c.Veterinaria?.Nombre).Where(n => n != null).Distinct().Count();

        return new
        {
            mascotas = mascotas.Count,
            citas = citas.Count,
            veterinarias = vetsEnCitas,
        };
    }

    /// <summary> PBI 49 - Perfil del Usuario: Editar el perfil del usuario autenticado (nombre, teléfono, foto) </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMeAsync([FromBody] ActualizarUsuarioDto actualizarDto)
    {
        var entity = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (entity == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        AplicarActualizacion(entity, actualizarDto);
        await _usuarioRepository.UpdateAsync(entity);
        return Ok(ToDto(entity));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "1")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarUsuarioDto actualizarDto)
    {
        var entity = await _usuarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Usuario con ID {id} no encontrado" });

        AplicarActualizacion(entity, actualizarDto);
        await _usuarioRepository.UpdateAsync(entity);
        return NoContent();
    }

    /// <summary> PBI 53 - Gestión de funcionarios: listar usuarios por rol </summary>
    [HttpGet("rol/{rolId}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByRolAsync(int rolId)
    {
        var usuarios = await _usuarioRepository.GetByRolAsync(rolId);
        return Ok(usuarios.Select(ToListadoDto));
    }

    /// <summary>
    /// PBI 53 - Gestión de funcionarios: alta de un funcionario (Administrador, Veterinaria o Almacen).
    /// Todavía no existe un servicio de envío de correo: la contraseña temporal se devuelve una única
    /// vez en la respuesta para que el administrador se la comparta al funcionario.
    /// </summary>
    [HttpPost("funcionarios")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> CrearFuncionarioAsync([FromBody] CrearFuncionarioDto crearDto)
    {
        if (crearDto.RolId == (int)RolTipo.Cliente)
            return BadRequest(new { mensaje = "El rol de Cliente no aplica a funcionarios." });

        var existente = await _usuarioRepository.GetByEmailAsync(crearDto.Email);
        if (existente != null)
            return BadRequest(new { mensaje = "El email ya est� registrado." });

        var passwordTemporal = GenerarPasswordTemporal();
        var entity = new Usuario
        {
            Nombre = crearDto.Nombre,
            Email = crearDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordTemporal),
            RolId = crearDto.RolId,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        // Asignar comercio seg�n ComercioId o del usuario autenticado
        if (crearDto.ComercioId.HasValue)
        {
            var vet = await _veterinariaRepository.GetByIdAsync(crearDto.ComercioId.Value);
            if (vet != null)
                entity.VeterinariaId = vet.Id;
            else
            {
                var alm = await _almacenRepository.GetByIdAsync(crearDto.ComercioId.Value);
                if (alm != null)
                    entity.AlmacenId = alm.Id;
            }
        }
        else
        {
            var userId = GetAuthenticatedUserId();
            var userVets = await _veterinariaRepository.GetByUsuarioIdAsync(userId);
            var userVet = userVets.FirstOrDefault();
            if (userVet != null)
                entity.VeterinariaId = userVet.Id;

            var userAlms = await _almacenRepository.GetByUsuarioIdAsync(userId);
            var userAlm = userAlms.FirstOrDefault();
            if (userAlm != null)
                entity.AlmacenId = userAlm.Id;
        }

        var created = await _usuarioRepository.AddAsync(entity);

        await _notificacionRepository.AddAsync(new Notificacion
        {
            UsuarioId = created.Id,
            Mensaje = "Tu cuenta de funcionario fue creada. Usa la contraseña temporal que te compartió el administrador para iniciar sesión y cámbiala cuanto antes.",
            Tipo = (int)TipoNotificacion.Info,
            FechaEnvio = DateTime.UtcNow
        });

        return Ok(new FuncionarioCreadoDto
        {
            Usuario = ToDto(created),
            PasswordTemporal = passwordTemporal
        });
    }

    /// <summary>
    /// PBI 53 - Gestión de funcionarios: cambiar el rol de un funcionario.
    /// Endpoint separado de ActualizarUsuarioDto/PUT me a propósito: el rol nunca debe
    /// poder cambiarse a través del endpoint de autoedición de perfil.
    /// </summary>
    [HttpPut("{id}/rol")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> CambiarRolAsync(int id, [FromBody] CambiarRolDto cambiarRolDto)
    {
        var entity = await _usuarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Usuario con ID {id} no encontrado" });

        if (entity.RolId == (int)RolTipo.Administrador && cambiarRolDto.RolId != (int)RolTipo.Administrador)
        {
            var administradoresActivos = await _usuarioRepository.CountActivosByRolAsync((int)RolTipo.Administrador);
            if (administradoresActivos <= 1)
                return BadRequest(new { mensaje = "No se puede cambiar el rol del último administrador." });
        }

        entity.RolId = cambiarRolDto.RolId;
        await _usuarioRepository.UpdateAsync(entity);
        return Ok(ToDto(entity));
    }

    /// <summary> PBI 53 - Gestión de funcionarios: reactivar un funcionario desactivado </summary>
    [HttpPut("{id}/reactivar")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> ReactivarAsync(int id)
    {
        var entity = await _usuarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Usuario con ID {id} no encontrado" });

        entity.Activo = true;
        await _usuarioRepository.UpdateAsync(entity);
        return Ok(ToDto(entity));
    }

    /// <summary>
    /// PBI 53 - Gestión de funcionarios: desactivar (soft delete, mantiene historial).
    /// Nota: el modelo de datos actual no vincula un Usuario a un comercio específico
    /// (no existe VeterinariaId/AlmacenId en Usuario), así que la regla de "no eliminar
    /// al último administrador" se aplica a nivel de todo el sistema, no por comercio.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _usuarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Usuario con ID {id} no encontrado" });

        if (entity.RolId == (int)RolTipo.Administrador && entity.Activo)
        {
            var administradoresActivos = await _usuarioRepository.CountActivosByRolAsync((int)RolTipo.Administrador);
            if (administradoresActivos <= 1)
                return BadRequest(new { mensaje = "No se puede desactivar al último administrador." });
        }

        entity.Activo = false;
        await _usuarioRepository.UpdateAsync(entity);
        return NoContent();
    }

    private static string GenerarPasswordTemporal()
    {
        const string alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        var bytes = RandomNumberGenerator.GetBytes(16);
        var chars = new char[16];
        for (var i = 0; i < bytes.Length; i++)
        {
            chars[i] = alfabeto[bytes[i] % alfabeto.Length];
        }

        return new string(chars);
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.Parse(idClaim!);
    }

    private static void AplicarActualizacion(Usuario entity, ActualizarUsuarioDto actualizarDto)
    {
        entity.Nombre = actualizarDto.Nombre;
        entity.Telefono = actualizarDto.Telefono;
        entity.Direccion = actualizarDto.Direccion;
        entity.FotoUrl = actualizarDto.FotoUrl;

        // Campos nuevos del perfil extendido: actualizacion parcial para no borrar
        // valores guardados cuando el cliente no los envia (null en el DTO).
        if (actualizarDto.TelefonoEmergencia != null)
            entity.TelefonoEmergencia = actualizarDto.TelefonoEmergencia;
        if (actualizarDto.LicenciaMedica != null)
            entity.LicenciaMedica = actualizarDto.LicenciaMedica;
        if (actualizarDto.FechaIncorporacion.HasValue)
            entity.FechaIncorporacion = actualizarDto.FechaIncorporacion;
    }

    private static UsuarioDto ToDto(Usuario usuario) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email,
        Telefono = usuario.Telefono,
        TelefonoEmergencia = usuario.TelefonoEmergencia,
        Direccion = usuario.Direccion,
        LicenciaMedica = usuario.LicenciaMedica,
        FechaIncorporacion = usuario.FechaIncorporacion,
        RolId = usuario.RolId,
        RolNombre = usuario.Rol?.Nombre ?? string.Empty,
        Activo = usuario.Activo,
        FechaRegistro = usuario.FechaRegistro,
        FotoUrl = usuario.FotoUrl,
        RedesSociales = usuario.RedesSociales?.Select(r => new RedSocialDto { Id = r.Id, UsuarioId = r.UsuarioId, Plataforma = r.Plataforma, Url = r.Url }).ToList(),
        VeterinariaId = usuario.VeterinariaId,
        AlmacenId = usuario.AlmacenId,
        ComercioNombre = usuario.Veterinaria?.Nombre ?? usuario.Almacen?.Nombre
    };

    /// <summary>
    /// Mapeo de listado: excluye PII sensible (LicenciaMedica, TelefonoEmergencia).
    /// Usado en GET /api/usuarios y GET /api/usuarios/rol/{rolId}.
    /// </summary>
    private static UsuarioListadoDto ToListadoDto(Usuario usuario) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email,
        Telefono = usuario.Telefono,
        Direccion = usuario.Direccion,
        RolId = usuario.RolId,
        RolNombre = usuario.Rol?.Nombre ?? string.Empty,
        Activo = usuario.Activo,
        FechaRegistro = usuario.FechaRegistro,
        FotoUrl = usuario.FotoUrl,
        RedesSociales = usuario.RedesSociales?.Select(r => new RedSocialDto { Id = r.Id, UsuarioId = r.UsuarioId, Plataforma = r.Plataforma, Url = r.Url }).ToList(),
        VeterinariaId = usuario.VeterinariaId,
        AlmacenId = usuario.AlmacenId,
        ComercioNombre = usuario.Veterinaria?.Nombre ?? usuario.Almacen?.Nombre
    };
}
