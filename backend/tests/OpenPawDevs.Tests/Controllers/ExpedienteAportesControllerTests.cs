using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Aporte;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del ExpedienteAportesController (PBI 132 - Aporte de expediente para veterinarias
/// fuera de la plataforma). Se mockean los repositorios y se invocan los métodos del
/// controlador directamente.
/// </summary>
public class ExpedienteAportesControllerTests
{
    private readonly Mock<IAporteExpedienteRepository> _aportes = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();

    private ExpedienteAportesController CreateSut(int? usuarioAutenticadoId = null, params string[] roles)
    {
        var controller = new ExpedienteAportesController(_aportes.Object, _mascotas.Object);

        if (usuarioAutenticadoId.HasValue)
            SetAuthenticatedUser(controller, usuarioAutenticadoId.Value, roles);

        return controller;
    }

    private static void SetAuthenticatedUser(ControllerBase controller, int userId, params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var identity = new ClaimsIdentity(claims, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static Mascota MascotaDe(int mascotaId, int duenioId, int? veterinariaId = null) => new()
    {
        Id = mascotaId,
        DuenioId = duenioId,
        VeterinariaId = veterinariaId
    };

    private static CrearAporteExpedienteDto DtoValido(int mascotaId) => new()
    {
        MascotaId = mascotaId,
        VeterinariaNombre = "Clinica Externa",
        FechaAtencion = DateTime.UtcNow.AddDays(-1),
        TipoAtencion = TipoAtencion.Consulta,
        Descripcion = "Consulta de rutina"
    };

    // ─────────────────────────────────────────────────────────────
    // GET /api/expediente-aportes
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByMascota_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999).GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.GetByMascotaIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetByMascota_ConDuenio_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
    }

    [Fact]
    public async Task GetByMascota_ComoVeterinario_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(999, "2").GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
        _aportes.Verify(r => r.GetByMascotaIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetByMascota_ComoAdministrador_DebeRetornarListaDeAportes()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var aportes = new List<AporteExpediente> { new() { Id = 1, MascotaId = 1, PropietarioId = 5 } };
        _aportes.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(aportes);

        var result = await CreateSut(999, "1").GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(aportes);
        _aportes.Verify(r => r.GetByMascotaIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetByMascota_ComoClienteSinRelacion_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999, "4").GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.GetByMascotaIdAsync(It.IsAny<int>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/expediente-aportes
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ConDatosValidos_DebeRetornar201()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _aportes.Setup(r => r.AddAsync(It.IsAny<AporteExpediente>()))
            .Callback<AporteExpediente>(a => a.Id = 50)
            .ReturnsAsync((AporteExpediente a) => a);

        var dto = DtoValido(1);

        var result = await CreateSut(5).CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/expediente-aportes/50");
        _aportes.Verify(r => r.AddAsync(It.Is<AporteExpediente>(
            a => a.MascotaId == 1
                 && a.PropietarioId == 5
                 && a.VeterinariaNombre == "Clinica Externa"
                 && a.TipoAtencion == TipoAtencion.Consulta)), Times.Once);
    }

    [Fact]
    public async Task Create_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).CreateAsync(DtoValido(1));

        result.Should().BeOfType<NotFoundObjectResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var result = await CreateSut(999).CreateAsync(DtoValido(1));

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConFechaDeAtencionEnElFuturo_DebeRetornar400()
    {
        var mascota = MascotaDe(1, duenioId: 5);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var dto = DtoValido(1);
        dto.FechaAtencion = DateTime.UtcNow.AddDays(1);

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _aportes.Verify(r => r.AddAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/expediente-aportes/{id}
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ConAporteInexistente_DebeRetornar404()
    {
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((AporteExpediente?)null);

        var result = await CreateSut(5).DeleteAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_ConAporteDeOtroUsuario_DebeRetornar403()
    {
        var aporte = new AporteExpediente { Id = 1, MascotaId = 1, PropietarioId = 5 };
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var result = await CreateSut(999).DeleteAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _aportes.Verify(r => r.DeleteAsync(It.IsAny<AporteExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ConAporteDelPropietario_DebeEliminarYRetornar204()
    {
        var aporte = new AporteExpediente { Id = 1, MascotaId = 1, PropietarioId = 5 };
        _aportes.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(aporte);

        var result = await CreateSut(5).DeleteAsync(1);

        result.Should().BeOfType<NoContentResult>();
        _aportes.Verify(r => r.DeleteAsync(aporte), Times.Once);
    }
}
