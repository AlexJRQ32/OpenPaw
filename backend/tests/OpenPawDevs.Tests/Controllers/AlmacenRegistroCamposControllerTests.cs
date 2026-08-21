using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Sprint 1 - Tarea 7: tests del registro de almacen con los campos del wireframe
/// (TipoAlmacen, NombreResponsable, CapacidadAlmacenamiento, ControlTemperatura, Latitud, Longitud).
/// Cubre: validacion de enums (999 -> 400), lat/lng fuera de rango -> 400, round-trip de campos
/// nuevos y control de acceso del PUT (dueno o admin; no-dueno -> 403, previene IDOR).
/// </summary>
public class AlmacenRegistroCamposControllerTests
{
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private AlmacenesController CreateSut(int usuarioId, int rolId, int? veterinariaId = null, int? almacenId = null)
    {
        var controller = new AlmacenesController(_almacenes.Object, _usuarios.Object);

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
            VeterinariaId = veterinariaId,
            AlmacenId = almacenId
        });
        return controller;
    }

    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearAlmacenDto CrearDtoValido() => new()
    {
        Nombre = "Almacén Central",
        CedulaJuridica = "3-101-123456",
        TipoAlmacen = "Interno",
        NombreResponsable = "Dr. David Chen",
        CapacidadAlmacenamiento = "De50a150",
        ControlTemperatura = "CadenaFrio",
        Latitud = 9.934739m,
        Longitud = -84.087502m
    };

    // ---------- Create: validacion de enums y round-trip ----------

    [Fact]
    public async Task Create_ConTipoAlmacenInvalido_DebeRetornar400()
    {
        var dto = CrearDtoValido();
        dto.TipoAlmacen = "999";

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _almacenes.Verify(r => r.AddAsync(It.IsAny<Almacen>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConCapacidadInvalida_DebeRetornar400()
    {
        var dto = CrearDtoValido();
        dto.CapacidadAlmacenamiento = "999";

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _almacenes.Verify(r => r.AddAsync(It.IsAny<Almacen>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConControlTemperaturaInvalido_DebeRetornar400()
    {
        var dto = CrearDtoValido();
        dto.ControlTemperatura = "999";

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _almacenes.Verify(r => r.AddAsync(It.IsAny<Almacen>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConCamposRegistro_DebeMapearRoundTrip()
    {
        var dto = CrearDtoValido();
        var created = new Almacen
        {
            Id = 1,
            Nombre = dto.Nombre,
            CedulaJuridica = dto.CedulaJuridica,
            TipoAlmacen = dto.TipoAlmacen,
            NombreResponsable = dto.NombreResponsable,
            CapacidadAlmacenamiento = dto.CapacidadAlmacenamiento,
            ControlTemperatura = dto.ControlTemperatura,
            Latitud = dto.Latitud,
            Longitud = dto.Longitud,
            UsuarioId = 3,
            Activo = true
        };
        _almacenes.Setup(r => r.AddAsync(It.IsAny<Almacen>()))
            .ReturnsAsync((Almacen a) => { a.Id = 1; return a; });

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<Core.DTOs.Almacen.AlmacenDto>();
        _almacenes.Verify(r => r.AddAsync(It.Is<Almacen>(a =>
            a.TipoAlmacen == "Interno" &&
            a.NombreResponsable == "Dr. David Chen" &&
            a.CapacidadAlmacenamiento == "De50a150" &&
            a.ControlTemperatura == "CadenaFrio" &&
            a.Latitud == 9.934739m &&
            a.Longitud == -84.087502m)), Times.Once);
    }

    // ---------- Create: M2 normalizacion de enums a forma canonica ----------

    [Theory]
    [InlineData("2", "Externo")]
    [InlineData("interno", "Interno")]
    public async Task Create_ConTipoAlmacenNoCanonico_DebePersistirFormaCanonica(string entrada, string esperado)
    {
        var dto = CrearDtoValido();
        dto.TipoAlmacen = entrada;
        _almacenes.Setup(r => r.AddAsync(It.IsAny<Almacen>()))
            .ReturnsAsync((Almacen a) => { a.Id = 1; return a; });

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _almacenes.Verify(r => r.AddAsync(It.Is<Almacen>(a => a.TipoAlmacen == esperado)), Times.Once);
    }

    [Fact]
    public async Task Create_ConEnumsNoCanonicos_DebePersistirFormaCanonicaEnLosTres()
    {
        var dto = CrearDtoValido();
        dto.TipoAlmacen = "2";
        dto.CapacidadAlmacenamiento = "menos50";
        dto.ControlTemperatura = "CADENAFRIO";
        _almacenes.Setup(r => r.AddAsync(It.IsAny<Almacen>()))
            .ReturnsAsync((Almacen a) => { a.Id = 1; return a; });

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        _almacenes.Verify(r => r.AddAsync(It.Is<Almacen>(a =>
            a.TipoAlmacen == "Externo" &&
            a.CapacidadAlmacenamiento == "Menos50" &&
            a.ControlTemperatura == "CadenaFrio")), Times.Once);
    }

    // ---------- Update: enum invalido y lat/lng fuera de rango ----------

    [Fact]
    public async Task Update_ConEnumInvalido_DebeRetornar400()
    {
        var entity = new Almacen { Id = 5, UsuarioId = 3, Nombre = "Almacén Ajena" };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3)
            .UpdateAsync(5, new ActualizarAlmacenDto { ControlTemperatura = "999" });

        result.Should().BeOfType<BadRequestObjectResult>();
        _almacenes.Verify(r => r.UpdateAsync(It.IsAny<Almacen>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConLatitudFueraDeRango_DebeRetornar400No500()
    {
        var entity = new Almacen { Id = 5, UsuarioId = 3, Latitud = 9.9m };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var sut = CreateSut(usuarioId: 3, rolId: 3);
        var dto = new ActualizarAlmacenDto { Latitud = 91m };

        // La BD limita Latitud a decimal(10,7); sin [Range] un PUT con 91 llegaria a la BD
        // y lanzaria DbUpdateException -> 500. Ahora la validacion lo rechaza con 400 sin persistir.
        var errores = Validate(dto);
        errores.Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarAlmacenDto.Latitud)));
        foreach (var error in errores)
            sut.ModelState.AddModelError(string.Join(",", error.MemberNames), error.ErrorMessage ?? "Invalido");

        var result = await sut.UpdateAsync(5, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _almacenes.Verify(r => r.UpdateAsync(It.IsAny<Almacen>()), Times.Never);
    }

    // ---------- Update: control de acceso (dueno o admin; no-dueno -> 403) ----------

    [Fact]
    public async Task Update_DuenioPuedeActualizarSuAlmacen_DebeRetornar200()
    {
        var entity = new Almacen
        {
            Id = 5,
            UsuarioId = 3,
            Nombre = "Almacén Original",
            TipoAlmacen = "Interno",
            NombreResponsable = "Dr. Original",
            CapacidadAlmacenamiento = "Menos50",
            ControlTemperatura = "SinControl",
            Latitud = 9.934739m,
            Longitud = -84.087502m
        };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3)
            .UpdateAsync(5, new ActualizarAlmacenDto
            {
                TipoAlmacen = "CentroDistribucion",
                NombreResponsable = "Dr. Actualizado"
            });

        result.Should().BeOfType<OkObjectResult>();
        // Update parcial: solo los campos enviados cambian; el resto se preserva.
        entity.TipoAlmacen.Should().Be("CentroDistribucion");
        entity.NombreResponsable.Should().Be("Dr. Actualizado");
        entity.CapacidadAlmacenamiento.Should().Be("Menos50");
        entity.ControlTemperatura.Should().Be("SinControl");
        entity.Latitud.Should().Be(9.934739m);
        entity.Longitud.Should().Be(-84.087502m);
        _almacenes.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ClienteQueNoEsDuenio_DebeRetornar403()
    {
        var entity = new Almacen { Id = 5, UsuarioId = 3, Nombre = "Almacén Ajena" };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 99, rolId: 4)
            .UpdateAsync(5, new ActualizarAlmacenDto { NombreResponsable = "Intruso" });

        result.Should().BeOfType<ForbidResult>();
        _almacenes.Verify(r => r.UpdateAsync(It.IsAny<Almacen>()), Times.Never);
    }

    [Fact]
    public async Task Update_AdministradorPuedeActualizarAlmacenAjena_DebeRetornar200()
    {
        var entity = new Almacen { Id = 5, UsuarioId = 3, Nombre = "Almacén Ajena" };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(5, new ActualizarAlmacenDto { ControlTemperatura = "Mixto" });

        result.Should().BeOfType<OkObjectResult>();
        entity.ControlTemperatura.Should().Be("Mixto");
        _almacenes.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_VeterinariaDueniaPuedeActualizarSuAlmacen_DebeRetornar200()
    {
        // M1: con [Authorize(Roles = "1,2,3")] el guard anti-IDOR cobra sentido real:
        // un rol 2 (veterinaria) que ES dueno (UsuarioId) pasa el guard y edita.
        var entity = new Almacen { Id = 5, UsuarioId = 3, Nombre = "Almacén Veterinaria" };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 2)
            .UpdateAsync(5, new ActualizarAlmacenDto { NombreResponsable = "Dra. Veterinaria" });

        result.Should().BeOfType<OkObjectResult>();
        entity.NombreResponsable.Should().Be("Dra. Veterinaria");
        _almacenes.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ConEnumNoCanonico_DebePersistirFormaCanonica()
    {
        // M2: "2" -> "Externo", "menos50" -> "Menos50", "sincontrol" -> "SinControl".
        var entity = new Almacen { Id = 5, UsuarioId = 3, Nombre = "Almacén" };
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3)
            .UpdateAsync(5, new ActualizarAlmacenDto
            {
                TipoAlmacen = "2",
                CapacidadAlmacenamiento = "menos50",
                ControlTemperatura = "sincontrol"
            });

        result.Should().BeOfType<OkObjectResult>();
        entity.TipoAlmacen.Should().Be("Externo");
        entity.CapacidadAlmacenamiento.Should().Be("Menos50");
        entity.ControlTemperatura.Should().Be("SinControl");
        _almacenes.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_IdInexistente_DebeRetornar404()
    {
        _almacenes.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Almacen?)null);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(999, new ActualizarAlmacenDto { NombreResponsable = "X" });

        result.Should().BeOfType<NotFoundObjectResult>();
        _almacenes.Verify(r => r.UpdateAsync(It.IsAny<Almacen>()), Times.Never);
    }
}