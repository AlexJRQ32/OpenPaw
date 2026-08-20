using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Cita;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using System.Security.Claims;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

public class CitasControllerTests
{
    private readonly Mock<ICitaRepository> _citas = new();
    private readonly Mock<IMascotaRepository> _mascotas = new();
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private CitasController CreateSut(int? usuarioId = 3, int rolId = 2)
    {
        var controller = new CitasController(
            _citas.Object, _mascotas.Object, _veterinarias.Object, _usuarios.Object);

        var claims = new List<Claim>();
        if (usuarioId.HasValue)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, usuarioId.Value.ToString()));
        claims.Add(new Claim("rol", rolId.ToString()));

        var user = new ClaimsPrincipal(new ClaimsIdentity(
            claims, "test", ClaimTypes.NameIdentifier, "rol"));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeRetornar201()
    {
        var fecha = DateTime.UtcNow.AddDays(2);
        var dto = new CrearCitaDto
        {
            MascotaId = 1,
            VeterinariaId = 2,
            UsuarioId = 3,
            FechaHora = fecha,
            Servicio = "Consulta general"
        };
        _mascotas.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _veterinarias.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _usuarios.Setup(r => r.ExistsAsync(3)).ReturnsAsync(true);
        _citas.Setup(r => r.CrearConValidacionAsync(It.IsAny<Cita>()))
            .Callback<Cita>(c => c.Id = 12)
            .ReturnsAsync((Cita c) => c);

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<CreatedResult>();
    }

    [Fact]
    public async Task Reprogramar_ConHorarioOcupado_DebeRetornar400()
    {
        var fecha = DateTime.UtcNow.AddDays(3);
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(new Cita
        {
            Id = 5,
            VeterinariaId = 2,
            Estado = "Pendiente"
        });
        _citas.Setup(r => r.ReprogramarConValidacionAsync(It.IsAny<Cita>(), fecha))
            .ReturnsAsync(false);

        var result = await CreateSut().ReprogramarAsync(
            5, new ReprogramarCitaDto { FechaHora = fecha });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ConHorarioOcupado_DebeRetornar400()
    {
        var fecha = DateTime.UtcNow.AddDays(2);
        var dto = new CrearCitaDto
        {
            MascotaId = 1,
            VeterinariaId = 2,
            UsuarioId = 3,
            FechaHora = fecha,
            Servicio = "Consulta general"
        };
        _mascotas.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _veterinarias.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _usuarios.Setup(r => r.ExistsAsync(3)).ReturnsAsync(true);
        _citas.Setup(r => r.CrearConValidacionAsync(It.IsAny<Cita>()))
            .ReturnsAsync((Cita?)null);

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Reprogramar_ConHorarioDisponible_DebeActualizarYRetornar204()
    {
        var fechaNueva = DateTime.UtcNow.AddDays(4);
        var cita = new Cita
        {
            Id = 5,
            VeterinariaId = 2,
            FechaHora = DateTime.UtcNow.AddDays(2),
            Estado = EstadoCita.Confirmada.ToString()
        };
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cita);
        _citas.Setup(r => r.ReprogramarConValidacionAsync(cita, fechaNueva))
            .ReturnsAsync(true);

        var result = await CreateSut().ReprogramarAsync(
            5, new ReprogramarCitaDto { FechaHora = fechaNueva });

        result.Should().BeOfType<NoContentResult>();
        cita.Estado.Should().Be(EstadoCita.Pendiente.ToString());
    }

    [Fact]
    public async Task Reprogramar_CitaCancelada_DebeRetornar409()
    {
        var cita = new Cita
        {
            Id = 5,
            VeterinariaId = 2,
            Estado = EstadoCita.Cancelada.ToString()
        };
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cita);

        var result = await CreateSut().ReprogramarAsync(
            5, new ReprogramarCitaDto { FechaHora = DateTime.UtcNow.AddDays(4) });

        result.Should().BeOfType<ConflictObjectResult>();
        _citas.Verify(r => r.ReprogramarConValidacionAsync(
            It.IsAny<Cita>(), It.IsAny<DateTime>()), Times.Never);
        _citas.Verify(r => r.UpdateAsync(It.IsAny<Cita>()), Times.Never);
    }

    [Fact]
    public async Task Cancelar_CitaActiva_DebeCambiarEstadoYRetornar204()
    {
        var cita = new Cita { Id = 5, Estado = EstadoCita.Confirmada.ToString() };
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cita);

        var result = await CreateSut().CancelarAsync(5);

        result.Should().BeOfType<NoContentResult>();
        cita.Estado.Should().Be(EstadoCita.Cancelada.ToString());
        _citas.Verify(r => r.UpdateAsync(cita), Times.Once);
    }

    [Fact]
    public async Task Cancelar_CitaYaCancelada_DebeSerIdempotente()
    {
        var cita = new Cita { Id = 5, Estado = EstadoCita.Cancelada.ToString() };
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cita);

        var result = await CreateSut().CancelarAsync(5);

        result.Should().BeOfType<NoContentResult>();
        _citas.Verify(r => r.UpdateAsync(It.IsAny<Cita>()), Times.Never);
    }

    [Fact]
    public async Task GetByUsuario_ClienteNoPuedeVerCitasDeOtro_DebeRetornar403()
    {
        var result = await CreateSut(usuarioId: 3, rolId: 4).GetByUsuarioAsync(99);

        result.Should().BeOfType<ForbidResult>();
        _citas.Verify(r => r.GetByUsuarioIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetByUsuario_ClientePuedeVerSusPropiasCitas_DebeRetornar200()
    {
        _citas.Setup(r => r.GetByUsuarioIdAsync(3)).ReturnsAsync(new List<Cita>());

        var result = await CreateSut(usuarioId: 3, rolId: 4).GetByUsuarioAsync(3);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Create_ClienteNoPuedeAgendarParaOtroUsuario_DebeRetornar403()
    {
        var dto = new CrearCitaDto
        {
            MascotaId = 1,
            VeterinariaId = 2,
            UsuarioId = 99,
            FechaHora = DateTime.UtcNow.AddDays(2),
            Servicio = "Consulta"
        };

        var result = await CreateSut(usuarioId: 3, rolId: 4).CreateAsync(dto);

        result.Should().BeOfType<ForbidResult>();
        _citas.Verify(r => r.AddAsync(It.IsAny<Cita>()), Times.Never);
    }

    [Fact]
    public async Task Cancelar_ClienteNoPuedeCancelarCitaAjena_DebeRetornar403()
    {
        var cita = new Cita { Id = 5, UsuarioId = 99, Estado = EstadoCita.Confirmada.ToString() };
        _citas.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(cita);

        var result = await CreateSut(usuarioId: 3, rolId: 4).CancelarAsync(5);

        result.Should().BeOfType<ForbidResult>();
        _citas.Verify(r => r.UpdateAsync(It.IsAny<Cita>()), Times.Never);
    }
}
