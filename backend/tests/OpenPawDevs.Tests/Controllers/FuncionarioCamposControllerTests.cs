using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Usuario;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Sprint 1 - Tarea 9: tests de los campos del wireframe de Funcionarios
/// (IdCorporativo, Especialidad, Sede, Estado).
/// Cubre: validacion de enum Estado (999 -> 400), normalizacion a forma canonica
/// ("2" -> "Vacaciones"), generacion de IdCorporativo por rol, round-trip de campos nuevos,
/// update parcial (null preserva), control de acceso del DELETE (dueno del comercio o admin; ajeno -> 403),
/// cambio de rol (guard A1 anti-escalada + guard de comercio + regeneracion de IdCorporativo M2),
/// alta de funcionario (A1b anti-escalada: rol 2/3 no crea admin ni en comercio ajeno -> 403)
/// y sincronizacion Estado &lt;-&gt; Activo en PUT (M3).
/// </summary>
public class FuncionarioCamposControllerTests
{
    private readonly Mock<IUsuarioRepository> _usuarios = new();
    private readonly Mock<INotificacionRepository> _notificaciones = new();
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();
    private readonly Mock<ICitaRepository> _citas = new();

    private UsuariosController CreateSut(int usuarioId, int rolId, int? almacenId = null, int? veterinariaId = null)
    {
        var controller = new UsuariosController(
            _usuarios.Object, _notificaciones.Object, _veterinarias.Object,
            _almacenes.Object, _mascotas.Object, _citas.Object);

        // "sub" lo lee GetAuthenticatedUserId(); "rol" como tipo de claim para User.IsInRole("1").
        var claims = new List<Claim>
        {
            new("sub", usuarioId.ToString()),
            new("rol", rolId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "test", ClaimTypes.NameIdentifier, "rol");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        _usuarios.Setup(r => r.GetByIdAsync(usuarioId)).ReturnsAsync(new Usuario
        {
            Id = usuarioId,
            RolId = rolId,
            AlmacenId = almacenId,
            VeterinariaId = veterinariaId
        });
        return controller;
    }

    private void SetupAltaFuncionarioExitosa(int rolId, int secuencia, int? veterinariaId = null, int? almacenId = null)
    {
        _usuarios.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((Usuario?)null);
        _usuarios.Setup(r => r.CountByRolAsync(rolId)).ReturnsAsync(secuencia);
        _usuarios.Setup(r => r.AddAsync(It.IsAny<Usuario>()))
            .Callback<Usuario>(u => u.Id = 1)
            .ReturnsAsync((Usuario u) => u);
        _notificaciones.Setup(r => r.AddAsync(It.IsAny<Notificacion>()))
            .ReturnsAsync((Notificacion n) => n);
        _veterinarias.Setup(r => r.GetByUsuarioIdAsync(It.IsAny<int>())).ReturnsAsync(new List<Veterinaria>());
        _almacenes.Setup(r => r.GetByUsuarioIdAsync(It.IsAny<int>())).ReturnsAsync(new List<Almacen>());
    }

    private static CrearFuncionarioDto CrearDtoValido() => new()
    {
        Nombre = "Dra. Ana Torres",
        Email = "ana.torres@openpaw.test",
        RolId = 2,
        Especialidad = "Cirugía General",
        Sede = "Sede Norte",
        Estado = "Activo"
    };

    // ---------- Create: validacion de enum Estado y round-trip ----------

    [Fact]
    public async Task CrearFuncionario_ConEstadoInvalido_DebeRetornar400()
    {
        var dto = CrearDtoValido();
        dto.Estado = "999";

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Theory]
    [InlineData("2", "Vacaciones")]
    [InlineData("vacaciones", "Vacaciones")]
    [InlineData("VACACIONES", "Vacaciones")]
    [InlineData("1", "Activo")]
    [InlineData("inactivo", "Inactivo")]
    public async Task CrearFuncionario_ConEstadoNoCanonico_DebePersistirFormaCanonica(string entrada, string esperado)
    {
        var dto = CrearDtoValido();
        dto.Estado = entrada;
        SetupAltaFuncionarioExitosa(rolId: 2, secuencia: 41);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.Estado == esperado)), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_ConEstadoNull_DebePersistirActivo()
    {
        var dto = CrearDtoValido();
        dto.Estado = null;
        SetupAltaFuncionarioExitosa(rolId: 2, secuencia: 41);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.Estado == "Activo")), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_GeneraIdCorporativoConPrefijoYSecuenciaPorRol()
    {
        var dto = CrearDtoValido();
        dto.Estado = "Vacaciones";
        SetupAltaFuncionarioExitosa(rolId: 2, secuencia: 41);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.CountByRolAsync(2), Times.Once);
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.IdCorporativo == "OP-VET-0042")), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_Administrador_DebeGenerarPrefijoOP_ADM()
    {
        var dto = CrearDtoValido();
        dto.RolId = 1;
        SetupAltaFuncionarioExitosa(rolId: 1, secuencia: 104);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.IdCorporativo == "OP-ADM-0105")), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_ConCamposWireframe_DebeMapearRoundTrip()
    {
        var dto = CrearDtoValido();
        dto.Estado = "Vacaciones";
        SetupAltaFuncionarioExitosa(rolId: 2, secuencia: 41);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtoRespuesta = ok.Value.Should().BeOfType<FuncionarioCreadoDto>().Subject;
        dtoRespuesta.Usuario.IdCorporativo.Should().Be("OP-VET-0042");
        dtoRespuesta.Usuario.Especialidad.Should().Be("Cirugía General");
        dtoRespuesta.Usuario.Sede.Should().Be("Sede Norte");
        dtoRespuesta.Usuario.Estado.Should().Be("Vacaciones");
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u =>
            u.IdCorporativo == "OP-VET-0042" &&
            u.Especialidad == "Cirugía General" &&
            u.Sede == "Sede Norte" &&
            u.Estado == "Vacaciones")), Times.Once);
    }

    // ---------- CrearFuncionario: A1b (anti-escalada de privilegios) + guard de comercio (IDOR) ----------

    [Fact]
    public async Task CrearFuncionario_Rol3CreaAdministrador_DebeRetornar403()
    {
        // A1b (QA, ALTO): rol 3 dueno del almacen 2 intenta crear un Administrador (RolId=1):
        // sin el guard recibiria la contrasena temporal en la respuesta (escalada de privilegios).
        var dto = CrearDtoValido();
        dto.RolId = 1;

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CrearFuncionario_Rol3EnComercioAjeno_DebeRetornar403()
    {
        // A1b (QA, ALTO): rol 3 del almacen 2 intenta crear un funcionario en el almacen 99 (IDOR).
        var dto = CrearDtoValido();
        dto.ComercioId = 99;

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CrearFuncionario_Rol3EnSuComercio_CreaFuncionarioNoAdmin_DebeRetornar200()
    {
        // A1b (QA): rol 3 dueno del almacen 2 crea un funcionario (rol 3) en SU almacen -> permitido.
        var dto = CrearDtoValido();
        dto.RolId = 3;
        dto.ComercioId = 2;
        SetupAltaFuncionarioExitosa(rolId: 3, secuencia: 10);
        _almacenes.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(new Almacen { Id = 2, Nombre = "Almacen Central" });

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.AlmacenId == 2)), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_AdministradorCreaEnCualquierComercio_DebeRetornar200()
    {
        // A1b (QA): el admin no tiene restriccion de comercio: crea rol 1 o rol 2/3 en cualquier lado.
        var dto = CrearDtoValido();
        dto.RolId = 2;
        dto.ComercioId = 5;
        SetupAltaFuncionarioExitosa(rolId: 2, secuencia: 41);
        _veterinarias.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(new Veterinaria { Id = 5, Nombre = "Vet Norte" });

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.VeterinariaId == 5)), Times.Once);
    }

    [Fact]
    public async Task CrearFuncionario_AdministradorCreaAdministrador_DebeRetornar200()
    {
        // A1b (QA): el admin SI puede crear un Administrador (cubre "admin crea cualquier rol").
        var dto = CrearDtoValido();
        dto.RolId = 1;
        SetupAltaFuncionarioExitosa(rolId: 1, secuencia: 104);

        var result = await CreateSut(usuarioId: 1, rolId: 1).CrearFuncionarioAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _usuarios.Verify(r => r.AddAsync(It.Is<Usuario>(u => u.RolId == 1)), Times.Once);
    }

    // ---------- Update: enum invalido, normalizacion y update parcial ----------

    [Fact]
    public async Task Update_ConEstadoInvalido_DebeRetornar400()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarUsuarioDto { Nombre = "Ana", Estado = "999" });

        result.Should().BeOfType<BadRequestObjectResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConEstadoNoCanonico_DebePersistirFormaCanonica()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana", Estado = "Activo" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarUsuarioDto { Nombre = "Ana", Estado = "2" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Estado.Should().Be("Vacaciones");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ConSoloEspecialidad_PreservaSedeYEstado()
    {
        // Update parcial: null en el DTO preserva el valor actual de la entidad.
        var entity = new Usuario
        {
            Id = 7,
            Nombre = "Dra. Ana Torres",
            IdCorporativo = "OP-VET-0042",
            Especialidad = "Medicina Interna",
            Sede = "Sede Centro",
            Estado = "Activo"
        };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarUsuarioDto { Nombre = "Dra. Ana Torres", Especialidad = "Cirugía General" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Especialidad.Should().Be("Cirugía General");
        entity.Sede.Should().Be("Sede Centro");
        entity.Estado.Should().Be("Activo");
        entity.IdCorporativo.Should().Be("OP-VET-0042");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- DELETE: control de acceso (dueno del comercio o admin; ajeno -> 403) ----------

    [Fact]
    public async Task Delete_FuncionarioDeOtroAlmacen_DebeRetornar403YNoDesactivar()
    {
        // Rol 3 con AlmacenId 99 intenta desactivar a un funcionario del almacen 2 (IDOR).
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99).DeleteAsync(7);

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task Delete_AlmacenDuenioPuedeDesactivarFuncionarioDeSuAlmacen_DebeRetornar204()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = true, Estado = "Activo" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).DeleteAsync(7);

        result.Should().BeOfType<NoContentResult>();
        entity.Activo.Should().BeFalse();
        entity.Estado.Should().Be("Inactivo");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Delete_AdministradorPuedeDesactivarFuncionarioAjeno_DebeRetornar204()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 2, VeterinariaId = 5, Activo = true, Estado = "Vacaciones" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1).DeleteAsync(7);

        result.Should().BeOfType<NoContentResult>();
        entity.Activo.Should().BeFalse();
        entity.Estado.Should().Be("Inactivo");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- Reactivar: sincroniza el estado del wireframe ----------

    [Fact]
    public async Task Reactivar_AlmacenDuenio_DebeSincronizarEstadoAActivo()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = false, Estado = "Inactivo" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).ReactivarAsync(7);

        result.Should().BeOfType<OkObjectResult>();
        entity.Activo.Should().BeTrue();
        entity.Estado.Should().Be("Activo");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Reactivar_FuncionarioAjeno_DebeRetornar403()
    {
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = false };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99).ReactivarAsync(7);

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    // ---------- CambiarRol: A1 (anti-escalada) + guard de comercio + M2 (regenera IdCorporativo) ----------

    [Fact]
    public async Task CambiarRol_Rol3IntentaAutopromoverseAAdmin_DebeRetornar403()
    {
        // A1 (Code Review): rol 3 dueno del almacen 2 intenta asignarse el rol Administrador (rolId 1) a si mismo.
        var entity = new Usuario { Id = 3, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2)
            .CambiarRolAsync(3, new CambiarRolDto { RolId = 1 });

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CambiarRol_Rol3IntentaAscenderAColegaAAdmin_DebeRetornar403()
    {
        // A1 (Code Review): rol 3 dueno del almacen 2 intenta ascender a un colega del MISMO almacen
        // a Administrador. Sin el fix, el guard de comercio (mismo AlmacenId) dejaria pasar la llamada.
        var entity = new Usuario { Id = 7, Nombre = "Luis", RolId = 3, AlmacenId = 2, Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2)
            .CambiarRolAsync(7, new CambiarRolDto { RolId = 1 });

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CambiarRol_AdministradorAsignaRolAdmin_DebeRetornar200()
    {
        // A1 (Code Review): solo un administrador puede asignar el rol Administrador; el admin si puede.
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 2, VeterinariaId = 5, Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .CambiarRolAsync(7, new CambiarRolDto { RolId = 1 });

        result.Should().BeOfType<OkObjectResult>();
        entity.RolId.Should().Be(1);
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task CambiarRol_Rol3DuenioDelComercio_CambiaRolNoAdmin_DebeRetornar200()
    {
        // Guard normal de CambiarRol: rol 3 del mismo almacen puede cambiar el rol de un funcionario (no admin).
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = true, IdCorporativo = "OP-ALM-0001" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);
        _usuarios.Setup(r => r.CountByRolAsync(2)).ReturnsAsync(3);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2)
            .CambiarRolAsync(7, new CambiarRolDto { RolId = 2 });

        result.Should().BeOfType<OkObjectResult>();
        entity.RolId.Should().Be(2);
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task CambiarRol_Rol3FuncionarioDeOtroComercio_DebeRetornar403()
    {
        // Guard de comercio: rol 3 del almacen 99 no puede cambiar el rol de un funcionario del almacen 2 (IDOR).
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 3, AlmacenId = 2, Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99)
            .CambiarRolAsync(7, new CambiarRolDto { RolId = 2 });

        result.Should().BeOfType<ForbidResult>();
        _usuarios.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CambiarRol_DeVeterinariaAAlmacen_DebeRegenerarIdCorporativoConNuevoPrefijo()
    {
        // M2 (Code Review): al cambiar de rol, el IdCorporativo se regenera con el prefijo y
        // secuencia del nuevo rol (OP-VET-0042 -> OP-ALM-0018).
        var entity = new Usuario { Id = 7, Nombre = "Ana", RolId = 2, VeterinariaId = 5, Activo = true, IdCorporativo = "OP-VET-0042" };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);
        _usuarios.Setup(r => r.CountByRolAsync(3)).ReturnsAsync(17);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .CambiarRolAsync(7, new CambiarRolDto { RolId = 3 });

        result.Should().BeOfType<OkObjectResult>();
        entity.RolId.Should().Be(3);
        entity.IdCorporativo.Should().Be("OP-ALM-0018");
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- M3: sincronizacion Estado <-> Activo via PUT ----------

    [Fact]
    public async Task Update_ConEstadoInactivo_DebeSincronizarActivoAFalse()
    {
        // M3 (Code Review): PUT con Estado "Inactivo" -> Activo=false (politica AplicarEstadoYActivo).
        var entity = new Usuario { Id = 7, Nombre = "Ana", Estado = "Activo", Activo = true };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarUsuarioDto { Nombre = "Ana", Estado = "Inactivo" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Estado.Should().Be("Inactivo");
        entity.Activo.Should().BeFalse();
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ConEstadoVacaciones_DebeSincronizarActivoATrue()
    {
        // M3 (Code Review): PUT con Estado "Vacaciones" -> Activo=true (reactiva un usuario inactivo).
        var entity = new Usuario { Id = 7, Nombre = "Ana", Estado = "Inactivo", Activo = false };
        _usuarios.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarUsuarioDto { Nombre = "Ana", Estado = "Vacaciones" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Estado.Should().Be("Vacaciones");
        entity.Activo.Should().BeTrue();
        _usuarios.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- GET listado: expone los campos del wireframe (sin PII) ----------

    [Fact]
    public async Task GetAll_DebeExponerCamposDelWireframeSinPii()
    {
        var usuarios = new List<Usuario>
        {
            new()
            {
                Id = 1,
                Nombre = "Dra. Ana Torres",
                Email = "ana@openpaw.test",
                RolId = 2,
                Rol = new Rol { Id = 2, Nombre = "Veterinaria" },
                IdCorporativo = "OP-VET-0042",
                Especialidad = "Cirugía General",
                Sede = "Sede Norte",
                Estado = "Activo"
            }
        };
        _usuarios.Setup(r => r.GetAllAsync()).ReturnsAsync(usuarios);

        var result = await CreateSut(usuarioId: 1, rolId: 1).GetAllAsync(null, null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<UsuarioListadoDto>>().Subject;
        var dto = dtos.Should().ContainSingle().Subject;
        dto.IdCorporativo.Should().Be("OP-VET-0042");
        dto.Especialidad.Should().Be("Cirugía General");
        dto.Sede.Should().Be("Sede Norte");
        dto.Estado.Should().Be("Activo");
        dto.RolNombre.Should().Be("Veterinaria");

        var json = System.Text.Json.JsonSerializer.Serialize(dto);
        json.Should().NotContain("TelefonoEmergencia");
        json.Should().NotContain("LicenciaMedica");
    }
}