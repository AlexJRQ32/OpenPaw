using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Traslado;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del TrasladosExpedienteController (PBI 131 - Traslado de expediente entre veterinarias).
/// Se mockean los repositorios y se invocan los métodos del controlador directamente.
/// </summary>
public class TrasladosExpedienteControllerTests
{
    private readonly Mock<ITrasladoExpedienteRepository> _traslados = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private TrasladosExpedienteController CreateSut(int? usuarioAutenticadoId = null)
    {
        var controller = new TrasladosExpedienteController(
            _traslados.Object, _mascotas.Object, _veterinarias.Object, _usuarios.Object);

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

    // ─────────────────────────────────────────────────────────────
    // GET /api/traslados-expediente
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ComoAdministrador_DebeRetornarTodosLosTraslados()
    {
        var usuario = new Usuario { Id = 1, RolId = 1 };
        _usuarios.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(usuario);
        var todos = new List<TrasladoExpediente> { new() { Id = 1 } };
        _traslados.Setup(r => r.GetAllAsync()).ReturnsAsync(todos);

        var result = await CreateSut(1).GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(todos);
    }

    [Fact]
    public async Task GetAll_ComoVeterinaria_DebeRetornarSoloLosDeSuVeterinariaDestino()
    {
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 7 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        var propios = new List<TrasladoExpediente> { new() { Id = 5, VeterinariaDestinoId = 7 } };
        _traslados.Setup(r => r.GetByVeterinariaDestinoAsync(7)).ReturnsAsync(propios);

        var result = await CreateSut(3).GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(propios);
        _traslados.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetAll_ComoCliente_DebeRetornarSoloSusTraslados()
    {
        var usuario = new Usuario { Id = 9, RolId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(9)).ReturnsAsync(usuario);
        var propios = new List<TrasladoExpediente> { new() { Id = 2, SolicitadoPorId = 9 } };
        _traslados.Setup(r => r.GetByPropietarioAsync(9)).ReturnsAsync(propios);

        var result = await CreateSut(9).GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(propios);
    }

    [Fact]
    public async Task GetAll_ComoVeterinariaSinVeterinariaAsignada_DebeCaerAPropietario()
    {
        // Un usuario con RolId Veterinaria pero sin VeterinariaId asignado no cumple la
        // condición del branch de veterinaria, así que cae al branch de propietario.
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = null };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        var propios = new List<TrasladoExpediente> { new() { Id = 8, SolicitadoPorId = 3 } };
        _traslados.Setup(r => r.GetByPropietarioAsync(3)).ReturnsAsync(propios);

        var result = await CreateSut(3).GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(propios);
        _traslados.Verify(r => r.GetByVeterinariaDestinoAsync(It.IsAny<int>()), Times.Never);
        _traslados.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetAll_ConUsuarioAutenticadoInexistente_DebeRetornar404()
    {
        _usuarios.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Usuario?)null);

        var result = await CreateSut(99).GetAllAsync();

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/traslados-expediente
    // ─────────────────────────────────────────────────────────────

    private static Mascota MascotaConDuenio(int mascotaId, int duenioId, int? veterinariaId) => new()
    {
        Id = mascotaId,
        DuenioId = duenioId,
        VeterinariaId = veterinariaId
    };

    [Fact]
    public async Task Create_ConDatosValidos_DebeRetornar201()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _veterinarias.Setup(r => r.ExistsAsync(20)).ReturnsAsync(true);
        _traslados.Setup(r => r.ExisteTrasladoActivoAsync(1, 20)).ReturnsAsync(false);
        _traslados.Setup(r => r.AddAsync(It.IsAny<TrasladoExpediente>()))
            .Callback<TrasladoExpediente>(t => t.Id = 100)
            .ReturnsAsync((TrasladoExpediente t) => t);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 20 };

        var result = await CreateSut(5).CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/traslados-expediente/100");
        _traslados.Verify(r => r.AddAsync(It.Is<TrasladoExpediente>(
            t => t.MascotaId == 1
                 && t.VeterinariaOrigenId == 10
                 && t.VeterinariaDestinoId == 20
                 && t.Estado == EstadoTraslado.Solicitado.ToString()
                 && t.SolicitadoPorId == 5)), Times.Once);
    }

    [Fact]
    public async Task Create_ConMascotaInexistente_DebeRetornar404()
    {
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Mascota?)null);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 20 };

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<NotFoundObjectResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConUsuarioQueNoEsDuenio_DebeRetornar403()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 20 };

        var result = await CreateSut(999).CreateAsync(dto);

        result.Should().BeOfType<ForbidResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConVeterinariaDestinoInexistente_DebeRetornar400()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _veterinarias.Setup(r => r.ExistsAsync(999)).ReturnsAsync(false);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 999 };

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConMascotaSinVeterinariaDeCabecera_DebeRetornar400()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: null);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _veterinarias.Setup(r => r.ExistsAsync(20)).ReturnsAsync(true);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 20 };

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConVeterinariaDestinoIgualALaActual_DebeRetornar400()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _veterinarias.Setup(r => r.ExistsAsync(10)).ReturnsAsync(true);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 10 };

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConTrasladoDuplicadoActivo_DebeRetornar400()
    {
        var mascota = MascotaConDuenio(1, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(mascota);
        _veterinarias.Setup(r => r.ExistsAsync(20)).ReturnsAsync(true);
        _traslados.Setup(r => r.ExisteTrasladoActivoAsync(1, 20)).ReturnsAsync(true);

        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 20 };

        var result = await CreateSut(5).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.AddAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/traslados-expediente/{id}/aceptar
    // ─────────────────────────────────────────────────────────────

    private static TrasladoExpediente TrasladoSolicitado(int id, int mascotaId, int destinoId) => new()
    {
        Id = id,
        MascotaId = mascotaId,
        VeterinariaOrigenId = 10,
        VeterinariaDestinoId = destinoId,
        Estado = EstadoTraslado.Solicitado.ToString()
    };

    [Fact]
    public async Task Aceptar_ConTrasladoInexistente_DebeRetornar404()
    {
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((TrasladoExpediente?)null);

        var result = await CreateSut(3).AceptarAsync(1);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Aceptar_ConUsuarioQueNoEsDeLaVeterinariaDestino_DebeRetornar403()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 999 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).AceptarAsync(1);

        result.Should().BeOfType<ForbidResult>();
        _traslados.Verify(r => r.UpdateAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Aceptar_ConRolNoVeterinaria_DebeRetornar403()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 4, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).AceptarAsync(1);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Aceptar_ConEstadoDistintoASolicitado_DebeRetornar400()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        traslado.Estado = EstadoTraslado.Rechazado.ToString();
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).AceptarAsync(1);

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.UpdateAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Aceptar_ConDatosValidos_DebeActualizarEstadoYVeterinariaDeLaMascotaYRetornar204()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        var mascota = MascotaConDuenio(4, duenioId: 5, veterinariaId: 10);
        _mascotas.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(mascota);
        _traslados.Setup(r => r.UpdateAsync(It.IsAny<TrasladoExpediente>())).Returns(Task.CompletedTask);
        _mascotas.Setup(r => r.UpdateAsync(It.IsAny<Mascota>())).Returns(Task.CompletedTask);

        var result = await CreateSut(3).AceptarAsync(1);

        result.Should().BeOfType<NoContentResult>();
        traslado.Estado.Should().Be(EstadoTraslado.Aceptado.ToString());
        traslado.FechaRespuesta.Should().NotBeNull();
        mascota.VeterinariaId.Should().Be(20);
        _traslados.Verify(r => r.UpdateAsync(traslado), Times.Once);
        _mascotas.Verify(r => r.UpdateAsync(mascota), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/traslados-expediente/{id}/rechazar
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Rechazar_ConTrasladoInexistente_DebeRetornar404()
    {
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((TrasladoExpediente?)null);

        var result = await CreateSut(3).RechazarAsync(1, new RechazarTrasladoDto { MotivoRechazo = "No aplica" });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Rechazar_ConUsuarioQueNoEsDeLaVeterinariaDestino_DebeRetornar403()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 999 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).RechazarAsync(1, new RechazarTrasladoDto { MotivoRechazo = "No aplica" });

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Rechazar_ConEstadoDistintoASolicitado_DebeRetornar400()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        traslado.Estado = EstadoTraslado.Aceptado.ToString();
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).RechazarAsync(1, new RechazarTrasladoDto { MotivoRechazo = "No aplica" });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Rechazar_ConMotivoVacio_DebeRetornar400()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);

        var result = await CreateSut(3).RechazarAsync(1, new RechazarTrasladoDto { MotivoRechazo = "   " });

        result.Should().BeOfType<BadRequestObjectResult>();
        _traslados.Verify(r => r.UpdateAsync(It.IsAny<TrasladoExpediente>()), Times.Never);
    }

    [Fact]
    public async Task Rechazar_ConDatosValidos_DebeActualizarEstadoYRetornar204()
    {
        var traslado = TrasladoSolicitado(1, mascotaId: 4, destinoId: 20);
        _traslados.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(traslado);
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 20 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        _traslados.Setup(r => r.UpdateAsync(It.IsAny<TrasladoExpediente>())).Returns(Task.CompletedTask);

        var result = await CreateSut(3).RechazarAsync(1, new RechazarTrasladoDto { MotivoRechazo = "Sin cupo" });

        result.Should().BeOfType<NoContentResult>();
        traslado.Estado.Should().Be(EstadoTraslado.Rechazado.ToString());
        traslado.MotivoRechazo.Should().Be("Sin cupo");
        traslado.FechaRespuesta.Should().NotBeNull();
        _traslados.Verify(r => r.UpdateAsync(traslado), Times.Once);
    }
}
