using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Mascota;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using System.Security.Claims;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests del mapeo de campos de salud (Sprint 1 - Mascotas: foto, estado salud,
/// proxima vacuna/medicacion). Cubre el round-trip de los campos nuevos en
/// create/update y la validacion de EstadoSalud.
/// </summary>
public class MascotasControllerTests
{
    private readonly Mock<IMascotaRepository> _mascotas = new();

    private MascotasController CreateSut(int usuarioId = 3, int rolId = 4)
    {
        var controller = new MascotasController(_mascotas.Object);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuarioId.ToString()),
            new("rol", rolId.ToString())
        };

        var user = new ClaimsPrincipal(new ClaimsIdentity(
            claims, "test", ClaimTypes.NameIdentifier, "rol"));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    [Fact]
    public async Task Create_ConCamposSalud_DebeMapearTodosLosCampos()
    {
        var fechaVacuna = DateTime.UtcNow.AddMonths(2);
        var fechaMedicacion = DateTime.UtcNow.AddDays(7);
        var dto = new CrearMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            Sexo = (int)SexoMascota.Macho,
            EstadoSalud = "Tratamiento",
            ProximaVacuna = "Rabia",
            ProximaVacunaFecha = fechaVacuna,
            MedicacionActual = "Medicación dental",
            ProximaMedicacionFecha = fechaMedicacion
        };
        Mascota? capturada = null;
        _mascotas.Setup(r => r.AddAsync(It.IsAny<Mascota>()))
            .Callback<Mascota>(m => { m.Id = 1; capturada = m; })
            .ReturnsAsync((Mascota m) => m);

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        capturada.Should().NotBeNull();
        capturada!.EstadoSalud.Should().Be("Tratamiento");
        capturada.ProximaVacuna.Should().Be("Rabia");
        capturada.ProximaVacunaFecha.Should().Be(fechaVacuna);
        capturada.MedicacionActual.Should().Be("Medicación dental");
        capturada.ProximaMedicacionFecha.Should().Be(fechaMedicacion);
    }

    [Fact]
    public async Task Create_SinEstadoSalud_DebeUsarSaludablePorDefecto()
    {
        var dto = new CrearMascotaDto
        {
            Nombre = "Michi",
            Especie = "Gato",
            Sexo = (int)SexoMascota.Hembra
        };
        Mascota? capturada = null;
        _mascotas.Setup(r => r.AddAsync(It.IsAny<Mascota>()))
            .Callback<Mascota>(m => capturada = m)
            .ReturnsAsync((Mascota m) => m);

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<OkObjectResult>();
        capturada!.EstadoSalud.Should().Be(EstadoSaludMascota.Saludable.ToString());
    }

    [Fact]
    public async Task Create_ConEstadoSaludInvalido_DebeRetornar400()
    {
        var dto = new CrearMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            Sexo = (int)SexoMascota.Macho,
            EstadoSalud = "Critico"
        };

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _mascotas.Verify(r => r.AddAsync(It.IsAny<Mascota>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConEstadoSaludNumerico_DebeRetornar400()
    {
        // Enum.TryParse("999", ...) devuelve true; sin IsDefined se persistiria un valor invalido.
        var dto = new CrearMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            Sexo = (int)SexoMascota.Macho,
            EstadoSalud = "999"
        };

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _mascotas.Verify(r => r.AddAsync(It.IsAny<Mascota>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConCamposSalud_DebeMapearRoundTrip()
    {
        var entity = new Mascota { Id = 7, DuenioId = 3, Nombre = "Rex", Especie = "Perro" };
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);
        var fechaVacuna = DateTime.UtcNow.AddMonths(1);
        var dto = new ActualizarMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            Sexo = (int)SexoMascota.Macho,
            EstadoSalud = "Saludable",
            ProximaVacuna = "Rabia",
            ProximaVacunaFecha = fechaVacuna,
            MedicacionActual = "Medicación dental",
            ProximaMedicacionFecha = null
        };

        var result = await CreateSut().UpdateAsync(7, dto);

        result.Should().BeOfType<NoContentResult>();
        entity.EstadoSalud.Should().Be("Saludable");
        entity.ProximaVacuna.Should().Be("Rabia");
        entity.ProximaVacunaFecha.Should().Be(fechaVacuna);
        entity.MedicacionActual.Should().Be("Medicación dental");
        entity.ProximaMedicacionFecha.Should().BeNull();
    }

    [Fact]
    public async Task Update_ConEstadoSaludInvalido_DebeRetornar400()
    {
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(
            new Mascota { Id = 7, DuenioId = 3 });
        var dto = new ActualizarMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            EstadoSalud = "NoExiste"
        };

        var result = await CreateSut().UpdateAsync(7, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _mascotas.Verify(r => r.UpdateAsync(It.IsAny<Mascota>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConEstadoSaludNumerico_DebeRetornar400()
    {
        // Enum.TryParse("999", ...) devuelve true; sin IsDefined se persistiria un valor invalido.
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(
            new Mascota { Id = 7, DuenioId = 3 });
        var dto = new ActualizarMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            EstadoSalud = "999"
        };

        var result = await CreateSut().UpdateAsync(7, dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _mascotas.Verify(r => r.UpdateAsync(It.IsAny<Mascota>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConEstadoSaludNull_DebePreservarElValorExistente()
    {
        // EstadoSalud null preserva el valor actual (semantica de update parcial).
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(
            new Mascota { Id = 7, DuenioId = 3, EstadoSalud = "Tratamiento" });
        var dto = new ActualizarMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            EstadoSalud = null
        };

        var result = await CreateSut().UpdateAsync(7, dto);

        result.Should().BeOfType<NoContentResult>();
        _mascotas.Verify(r => r.UpdateAsync(It.Is<Mascota>(m => m.EstadoSalud == "Tratamiento")), Times.Once);
    }

    [Fact]
    public async Task Update_ParcialNoBorraVacunaNiMedicacionCuandoVienenNull()
    {
        // Update parcial: campos de salud con null preservan el valor existente.
        var entity = new Mascota
        {
            Id = 7,
            DuenioId = 3,
            Nombre = "Rex",
            Especie = "Perro",
            EstadoSalud = "Saludable",
            ProximaVacuna = "Rabia",
            ProximaVacunaFecha = DateTime.UtcNow.AddMonths(1),
            MedicacionActual = "Medicación dental",
            ProximaMedicacionFecha = DateTime.UtcNow.AddDays(7)
        };
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);
        var dto = new ActualizarMascotaDto
        {
            Nombre = "Rex",
            Especie = "Perro",
            Sexo = (int)SexoMascota.Macho,
            EstadoSalud = null,
            ProximaVacuna = null,
            ProximaVacunaFecha = null,
            MedicacionActual = null,
            ProximaMedicacionFecha = null
        };

        var result = await CreateSut().UpdateAsync(7, dto);

        result.Should().BeOfType<NoContentResult>();
        entity.ProximaVacuna.Should().Be("Rabia");
        entity.ProximaVacunaFecha.Should().NotBeNull();
        entity.MedicacionActual.Should().Be("Medicación dental");
        entity.ProximaMedicacionFecha.Should().NotBeNull();
        entity.EstadoSalud.Should().Be("Saludable");
    }

    [Fact]
    public async Task GetAll_ComoCliente_DebeRetornarSoloSusMascotasEnDto()
    {
        _mascotas.Setup(r => r.GetByDuenioIdAsync(3)).ReturnsAsync(new List<Mascota>
        {
            new() { Id = 1, Nombre = "Rex", Especie = "Perro", DuenioId = 3, Activo = true }
        });

        var result = await CreateSut().GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<MascotaDto>>().Subject.ToList();
        dto.Should().HaveCount(1);
        dto[0].Nombre.Should().Be("Rex");
    }

    [Fact]
    public async Task GetById_DebeRetornarDtoYNoLaEntidadConDuenio()
    {
        var entity = new Mascota
        {
            Id = 7,
            DuenioId = 3,
            Nombre = "Rex",
            Especie = "Perro",
            Duenio = new Usuario { Id = 3, Nombre = "Cliente Uno", PasswordHash = "secreto" }
        };
        _mascotas.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut().GetByIdAsync(7);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<MascotaDto>().Subject;
        dto.DueñoId.Should().Be(3);
        dto.DueñoNombre.Should().Be("Cliente Uno");
        ok.Value.Should().NotBeSameAs(entity);
    }
}