using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Veterinaria;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using System.Security.Claims;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

public class ServiciosVeterinariosControllerTests
{
    private readonly Mock<IServicioVeterinarioRepository> _servicios = new();
    private readonly Mock<IVeterinariaRepository> _veterinarias = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private ServiciosVeterinariosController CreateSut() =>
        new(_servicios.Object, _veterinarias.Object, _usuarios.Object);

    [Fact]
    public async Task Create_ConVeterinariaValida_DebeRetornar201()
    {
        var dto = new CrearServicioVeterinarioDto
        {
            VeterinariaId = 4,
            Nombre = "Consulta general",
            Categoria = CategoriaServicioVeterinario.Consulta,
            Precio = 25000,
            DuracionMinutos = 30
        };
        _veterinarias.Setup(r => r.ExistsAsync(4)).ReturnsAsync(true);
        _servicios.Setup(r => r.AddAsync(It.IsAny<ServicioVeterinario>()))
            .Callback<ServicioVeterinario>(s => s.Id = 8)
            .ReturnsAsync((ServicioVeterinario s) => s);

        var result = await CreateSut().CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/serviciosveterinarios/8");
    }

    [Fact]
    public async Task Create_ConVeterinariaInexistente_DebeRetornar400()
    {
        var dto = new CrearServicioVeterinarioDto
        {
            VeterinariaId = 99,
            Nombre = "Grooming",
            Categoria = CategoriaServicioVeterinario.Grooming,
            Precio = 15000,
            DuracionMinutos = 60
        };
        _veterinarias.Setup(r => r.ExistsAsync(99)).ReturnsAsync(false);

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _servicios.Verify(r => r.AddAsync(It.IsAny<ServicioVeterinario>()), Times.Never);
    }

    [Fact]
    public async Task GetAll_DebeRetornarServiciosMapeados()
    {
        var servicio = CrearServicio();
        _servicios.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ServicioVeterinario> { servicio });

        var result = await CreateSut().GetAllAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var servicios = ok.Value.Should()
            .BeAssignableTo<IEnumerable<ServicioVeterinarioDto>>().Subject.ToList();
        servicios.Should().ContainSingle();
        servicios[0].Should().BeEquivalentTo(new ServicioVeterinarioDto
        {
            Id = 8,
            VeterinariaId = 4,
            VeterinariaNombre = "Clínica OpenPaw",
            Nombre = "Consulta general",
            Descripcion = "Valoración médica",
            Categoria = CategoriaServicioVeterinario.Consulta,
            Precio = 25000,
            DuracionMinutos = 30,
            Activo = true
        });
    }

    [Fact]
    public async Task GetById_ConServicioExistente_DebeRetornar200()
    {
        _servicios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(CrearServicio());

        var result = await CreateSut().GetByIdAsync(8);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var servicio = ok.Value.Should().BeOfType<ServicioVeterinarioDto>().Subject;
        servicio.Id.Should().Be(8);
        servicio.VeterinariaNombre.Should().Be("Clínica OpenPaw");
    }

    [Fact]
    public async Task GetById_ConServicioInexistente_DebeRetornar404()
    {
        _servicios.Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((ServicioVeterinario?)null);

        var result = await CreateSut().GetByIdAsync(99);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByVeterinaria_DebeRetornarServiciosFiltrados()
    {
        _servicios.Setup(r => r.GetByVeterinariaIdAsync(4))
            .ReturnsAsync(new List<ServicioVeterinario> { CrearServicio() });

        var result = await CreateSut().GetByVeterinariaAsync(4);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IEnumerable<ServicioVeterinarioDto>>()
            .Which.Should().ContainSingle(s => s.VeterinariaId == 4);
        _servicios.Verify(r => r.GetByVeterinariaIdAsync(4), Times.Once);
    }

    [Fact]
    public async Task GetByCategoria_DebeRetornarServiciosFiltrados()
    {
        _servicios.Setup(r => r.GetByCategoriaAsync(CategoriaServicioVeterinario.Consulta))
            .ReturnsAsync(new List<ServicioVeterinario> { CrearServicio() });

        var result = await CreateSut().GetByCategoriaAsync(CategoriaServicioVeterinario.Consulta);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IEnumerable<ServicioVeterinarioDto>>()
            .Which.Should().ContainSingle(s => s.Categoria == CategoriaServicioVeterinario.Consulta);
        _servicios.Verify(
            r => r.GetByCategoriaAsync(CategoriaServicioVeterinario.Consulta), Times.Once);
    }

    [Fact]
    public async Task Update_ConServicioExistente_DebeActualizarYRetornar204()
    {
        var servicio = CrearServicio();
        var dto = new ActualizarServicioVeterinarioDto
        {
            Nombre = "  Grooming premium  ",
            Descripcion = "Baño y corte",
            Categoria = CategoriaServicioVeterinario.Grooming,
            Precio = 18000,
            DuracionMinutos = 60,
            Activo = false
        };
        _servicios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(servicio);

        var result = await CreateSut().UpdateAsync(8, dto);

        result.Should().BeOfType<NoContentResult>();
        servicio.Nombre.Should().Be("Grooming premium");
        servicio.Categoria.Should().Be(CategoriaServicioVeterinario.Grooming);
        servicio.Precio.Should().Be(18000);
        servicio.DuracionMinutos.Should().Be(60);
        servicio.Activo.Should().BeFalse();
        _servicios.Verify(r => r.UpdateAsync(servicio), Times.Once);
    }

    [Fact]
    public async Task Update_ConServicioInexistente_DebeRetornar404()
    {
        _servicios.Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((ServicioVeterinario?)null);

        var result = await CreateSut().UpdateAsync(99, new ActualizarServicioVeterinarioDto());

        result.Should().BeOfType<NotFoundObjectResult>();
        _servicios.Verify(r => r.UpdateAsync(It.IsAny<ServicioVeterinario>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ConServicioExistente_DebeEliminarYRetornar204()
    {
        var servicio = CrearServicio();
        _servicios.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(servicio);

        var result = await CreateSut().DeleteAsync(8);

        result.Should().BeOfType<NoContentResult>();
        _servicios.Verify(r => r.DeleteAsync(servicio), Times.Once);
    }

    [Fact]
    public async Task Delete_ConServicioInexistente_DebeRetornar404()
    {
        _servicios.Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((ServicioVeterinario?)null);

        var result = await CreateSut().DeleteAsync(99);

        result.Should().BeOfType<NotFoundObjectResult>();
        _servicios.Verify(r => r.DeleteAsync(It.IsAny<ServicioVeterinario>()), Times.Never);
    }

    [Theory]
    [InlineData(nameof(ServiciosVeterinariosController.CreateAsync))]
    [InlineData(nameof(ServiciosVeterinariosController.UpdateAsync))]
    [InlineData(nameof(ServiciosVeterinariosController.DeleteAsync))]
    public void EndpointsDeEscritura_DebenRestringirseAVeterinariaYAdministrador(
        string metodo)
    {
        var action = typeof(ServiciosVeterinariosController).GetMethods()
            .Single(m => m.Name == metodo);

        var authorize = action.GetCustomAttributes(typeof(AuthorizeAttribute), false)
            .Cast<AuthorizeAttribute>()
            .Single();

        authorize.Roles.Should().Be("1,2");
    }

    [Fact]
    public async Task GetMios_ComoVeterinaria_DebeRetornarSoloSusServicios()
    {
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 4 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        _servicios.Setup(r => r.GetByVeterinariaIdAsync(4))
            .ReturnsAsync(new List<ServicioVeterinario> { CrearServicio() });

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 3);

        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IEnumerable<ServicioVeterinarioDto>>()
            .Which.Should().ContainSingle(s => s.VeterinariaId == 4);
        _servicios.Verify(r => r.GetAllAsync(), Times.Never);
        _servicios.Verify(r => r.GetByVeterinariaIdAsync(4), Times.Once);
    }

    [Fact]
    public async Task GetMios_ComoAdministrador_DebeRetornarTodosLosServicios()
    {
        var usuario = new Usuario { Id = 1, RolId = 1 };
        _usuarios.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(usuario);
        _servicios.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ServicioVeterinario> { CrearServicio() });

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 1);

        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IEnumerable<ServicioVeterinarioDto>>();
        _servicios.Verify(r => r.GetAllAsync(), Times.Once);
    }

    private static void SetAuthenticatedUser(ServiciosVeterinariosController controller, int userId)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", userId.ToString())
        }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static ServicioVeterinario CrearServicio() => new()
    {
        Id = 8,
        VeterinariaId = 4,
        Veterinaria = new Veterinaria { Id = 4, Nombre = "Clínica OpenPaw" },
        Nombre = "Consulta general",
        Descripcion = "Valoración médica",
        Categoria = CategoriaServicioVeterinario.Consulta,
        Precio = 25000,
        DuracionMinutos = 30,
        Activo = true
    };
}
