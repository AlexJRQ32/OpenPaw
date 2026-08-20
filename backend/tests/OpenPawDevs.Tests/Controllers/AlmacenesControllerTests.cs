using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

public class AlmacenesControllerTests
{
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private AlmacenesController CreateSut(int userId, int rolId, int? veterinariaId = null, int? almacenId = null)
    {
        var controller = new AlmacenesController(_almacenes.Object, _usuarios.Object);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", userId.ToString()),
            new Claim("rol", rolId.ToString()),
        }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        _usuarios.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new Usuario
        {
            Id = userId,
            RolId = rolId,
            VeterinariaId = veterinariaId,
            AlmacenId = almacenId
        });
        return controller;
    }

    [Fact]
    public async Task GetMios_ComoVeterinaria_DebeRetornarSoloAlmacenesDeSuVeterinaria()
    {
        var almacenes = new List<Almacen>
        {
            new() { Id = 1, Nombre = "Almacen Central", VeterinariaId = 7 },
            new() { Id = 2, Nombre = "Almacen Satelite", VeterinariaId = 9 },
        };
        _almacenes.Setup(r => r.GetByVeterinariaIdAsync(7)).ReturnsAsync(almacenes);

        var sut = CreateSut(userId: 3, rolId: 2, veterinariaId: 7);
        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        dto.Should().HaveCount(2);
        _almacenes.Verify(r => r.GetByVeterinariaIdAsync(7), Times.Once);
        _almacenes.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetMios_ComoAlmacen_DebeRetornarSoloSuAlmacen()
    {
        _almacenes.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(new Almacen { Id = 5, Nombre = "Mi Almacen" });

        var sut = CreateSut(userId: 4, rolId: 3, almacenId: 5);
        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        dto.Should().ContainSingle();
        _almacenes.Verify(r => r.GetByIdAsync(5), Times.Once);
        _almacenes.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetMios_ComoAdministrador_DebeRetornarTodosLosAlmacenes()
    {
        var almacenes = new List<Almacen>
        {
            new() { Id = 1, Nombre = "Almacen A" },
            new() { Id = 2, Nombre = "Almacen B" },
        };
        _almacenes.Setup(r => r.GetAllAsync()).ReturnsAsync(almacenes);

        var sut = CreateSut(userId: 1, rolId: 1);
        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        dto.Should().HaveCount(2);
        _almacenes.Verify(r => r.GetAllAsync(), Times.Once);
    }
}
