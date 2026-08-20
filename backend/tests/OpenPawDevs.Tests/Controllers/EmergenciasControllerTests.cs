using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Emergencia;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del EmergenciasController (PBI 133 - Atención de emergencias con veterinario no
/// cabecera, dentro y fuera de la plataforma). Se mockean los repositorios y se invocan
/// los métodos del controlador directamente.
/// </summary>
public class EmergenciasControllerTests
{
    private readonly Mock<IEmergenciaRepository> _emergencias = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private EmergenciasController CreateSut(int? usuarioAutenticadoId = null)
    {
        var controller = new EmergenciasController(_emergencias.Object, _mascotas.Object, _usuarios.Object);

        if (usuarioAutenticadoId.HasValue)
            SetAuthenticatedUser(controller, usuarioAutenticadoId.Value);

        return controller;
    }

    private static void SetAuthenticatedUser(ControllerBase controller, int userId)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static Mascota MascotaConVeterinaria(int mascotaId, int duenioId, int? veterinariaId) => new()
    {
        Id = mascotaId,
        DuenioId = duenioId,
        VeterinariaId = veterinariaId
    };

    private static CrearEmergenciaDto DtoEnPlataforma(int mascotaId) => new()
    {
        MascotaId = mascotaId,
        EsEnPlataforma = true,
        FechaAtencion = DateTime.UtcNow,
        Motivo = "Convulsiones"
    };

    private static CrearEmergenciaDto DtoExterna(int mascotaId, string? veterinariaExterna = "Clinica 24h") => new()
    {
        MascotaId = mascotaId,
        EsEnPlataforma = false,
        VeterinariaNombreExterna = veterinariaExterna,
        FechaAtencion = DateTime.UtcNow,
        Motivo = "Convulsiones"
    };

    // ─────────────────────────────────────────────────────────────
    // GET /api/emergencias?mascotaId=
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByMascota_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ConUsuarioAutenticadoInexistente_DebeRetornar404()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _usuarios.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Usuario?)null);

        var result = await CreateSut(999).GetByMascotaAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ComoAdministrador_DebeRetornarLasEmergencias()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var admin = new Usuario { Id = 1, RolId = 1 };
        _usuarios.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);
        var emergencias = new List<Emergencia> { new() { Id = 1, MascotaId = 1 } };
        _emergencias.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(emergencias);

        var result = await CreateSut(1).GetByMascotaAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(emergencias);
    }

    [Fact]
    public async Task GetByMascota_ComoDuenio_DebeRetornarLasEmergencias()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var duenio = new Usuario { Id = 5, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(duenio);
        var emergencias = new List<Emergencia> { new() { Id = 1, MascotaId = 1 } };
        _emergencias.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(emergencias);

        var result = await CreateSut(5).GetByMascotaAsync(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ComoVeterinariaDeCabecera_DebeRetornarLasEmergencias()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var veterinario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 10 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinario);
        var emergencias = new List<Emergencia> { new() { Id = 1, MascotaId = 1 } };
        _emergencias.Setup(r => r.GetByMascotaIdAsync(1)).ReturnsAsync(emergencias);

        var result = await CreateSut(3).GetByMascotaAsync(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetByMascota_ConVeterinarioQueNoAtiendeLaMascota_DebeRetornar403()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var otroVeterinario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 999 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(otroVeterinario);

        var result = await CreateSut(3).GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetByMascota_ConUsuarioSinRelacionConLaMascota_DebeRetornar403()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var otroCliente = new Usuario { Id = 8, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(otroCliente);

        var result = await CreateSut(8).GetByMascotaAsync(1);

        result.Should().BeOfType<ForbidResult>();
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/emergencias/{id}
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ConEmergenciaInexistente_DebeRetornar404()
    {
        _emergencias.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Emergencia?)null);

        var result = await CreateSut(5).GetByIdAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetById_ConMascotaAsociadaInexistente_DebeRetornar404()
    {
        var emergencia = new Emergencia { Id = 1, MascotaId = 1 };
        _emergencias.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(emergencia);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).GetByIdAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetById_ConAccesoValido_DebeRetornarLaEmergencia()
    {
        var emergencia = new Emergencia { Id = 1, MascotaId = 1 };
        _emergencias.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(emergencia);
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var duenio = new Usuario { Id = 5, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(duenio);

        var result = await CreateSut(5).GetByIdAsync(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(emergencia);
    }

    [Fact]
    public async Task GetById_SinAcceso_DebeRetornar403()
    {
        var emergencia = new Emergencia { Id = 1, MascotaId = 1 };
        _emergencias.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(emergencia);
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var otroCliente = new Usuario { Id = 8, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(otroCliente);

        var result = await CreateSut(8).GetByIdAsync(1);

        result.Should().BeOfType<ForbidResult>();
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/emergencias - Escenario A: veterinario en plataforma
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_EnPlataforma_ConVeterinarioValido_DebeRetornar201YAsignarSuVeterinaria()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var veterinario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 10 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinario);
        _emergencias.Setup(r => r.AddAsync(It.IsAny<Emergencia>()))
            .Callback<Emergencia>(e => e.Id = 77)
            .ReturnsAsync((Emergencia e) => e);

        var result = await CreateSut(3).CreateAsync(DtoEnPlataforma(1));

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/emergencias/77");
        _emergencias.Verify(r => r.AddAsync(It.Is<Emergencia>(
            e => e.MascotaId == 1
                 && e.PropietarioId == 5
                 && e.EsEnPlataforma
                 && e.VeterinariaId == 10)), Times.Once);
    }

    [Fact]
    public async Task Create_EnPlataforma_ConVeterinarioQueNoAtiendeLaMascota_DebePermitirElRegistro()
    {
        // El PBI 133 es justamente "veterinario no cabecera": cualquier veterinario en
        // plataforma puede registrar la emergencia, sin importar si atiende a la mascota.
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var veterinarioDeOtraClinica = new Usuario { Id = 3, RolId = 2, VeterinariaId = 999 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinarioDeOtraClinica);
        _emergencias.Setup(r => r.AddAsync(It.IsAny<Emergencia>()))
            .Callback<Emergencia>(e => e.Id = 79)
            .ReturnsAsync((Emergencia e) => e);

        var result = await CreateSut(3).CreateAsync(DtoEnPlataforma(1));

        result.Should().BeOfType<CreatedResult>();
        _emergencias.Verify(r => r.AddAsync(It.Is<Emergencia>(
            e => e.MascotaId == 1 && e.VeterinariaId == 999)), Times.Once);
    }

    [Fact]
    public async Task Create_EnPlataforma_ConUsuarioQueNoEsVeterinario_DebeRetornar403()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var cliente = new Usuario { Id = 8, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(cliente);

        var result = await CreateSut(8).CreateAsync(DtoEnPlataforma(1));

        result.Should().BeOfType<ForbidResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }

    [Fact]
    public async Task Create_EnPlataforma_ConVeterinarioSinVeterinariaAsignada_DebeRetornar403()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var veterinarioSinVeterinaria = new Usuario { Id = 3, RolId = 2, VeterinariaId = null };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(veterinarioSinVeterinaria);

        var result = await CreateSut(3).CreateAsync(DtoEnPlataforma(1));

        result.Should().BeOfType<ForbidResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/emergencias - Escenario B: veterinario externo
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Externa_ConDuenioYNombreExterno_DebeRetornar201()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var duenio = new Usuario { Id = 5, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(duenio);
        _emergencias.Setup(r => r.AddAsync(It.IsAny<Emergencia>()))
            .Callback<Emergencia>(e => e.Id = 78)
            .ReturnsAsync((Emergencia e) => e);

        var result = await CreateSut(5).CreateAsync(DtoExterna(1, "Clinica 24h"));

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/emergencias/78");
        _emergencias.Verify(r => r.AddAsync(It.Is<Emergencia>(
            e => e.MascotaId == 1
                 && e.PropietarioId == 5
                 && !e.EsEnPlataforma
                 && e.VeterinariaNombreExterna == "Clinica 24h")), Times.Once);
    }

    [Fact]
    public async Task Create_Externa_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var otroCliente = new Usuario { Id = 8, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(otroCliente);

        var result = await CreateSut(8).CreateAsync(DtoExterna(1, "Clinica 24h"));

        result.Should().BeOfType<ForbidResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }

    [Fact]
    public async Task Create_Externa_SinNombreDeVeterinariaExterna_DebeRetornar400()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        var duenio = new Usuario { Id = 5, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(duenio);

        var result = await CreateSut(5).CreateAsync(DtoExterna(1, veterinariaExterna: null));

        result.Should().BeOfType<BadRequestObjectResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var result = await CreateSut(5).CreateAsync(DtoExterna(1));

        result.Should().BeOfType<NotFoundObjectResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConUsuarioAutenticadoInexistente_DebeRetornar404()
    {
        var mascota = MascotaConVeterinaria(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _usuarios.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Usuario?)null);

        var result = await CreateSut(999).CreateAsync(DtoExterna(1));

        result.Should().BeOfType<NotFoundObjectResult>();
        _emergencias.Verify(r => r.AddAsync(It.IsAny<Emergencia>()), Times.Never);
    }
}
