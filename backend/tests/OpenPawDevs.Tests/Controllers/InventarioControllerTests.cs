using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Producto;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

public class InventarioControllerTests
{
    private readonly Mock<IInventarioRepository> _inventario = new();
    private readonly Mock<IProductoRepository> _productos = new();
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private InventarioController CreateSut() =>
        new(_inventario.Object, _productos.Object, _almacenes.Object, _usuarios.Object);

    [Fact]
    public async Task Create_ConDatosValidos_DebeRetornar201()
    {
        var dto = new CrearInventarioDto
        {
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 10,
            StockMinimo = 2,
            StockMaximo = 20
        };
        _productos.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _almacenes.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _inventario.Setup(r => r.GetByProductoYAlmacenAsync(1, 2))
            .ReturnsAsync((Inventario?)null);
        _inventario.Setup(r => r.AddAsync(It.IsAny<Inventario>()))
            .Callback<Inventario>(i => i.Id = 15)
            .ReturnsAsync((Inventario i) => i);

        var result = await CreateSut().CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/inventario/15");
    }

    [Fact]
    public async Task Create_ConCantidadMayorAlMaximo_DebeRetornar400()
    {
        var dto = new CrearInventarioDto
        {
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 30,
            StockMinimo = 2,
            StockMaximo = 20
        };

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _inventario.Verify(r => r.AddAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Create_ConRegistroDuplicado_DebeRetornar409()
    {
        var dto = new CrearInventarioDto
        {
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 5,
            StockMinimo = 1
        };
        _productos.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _almacenes.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _inventario.Setup(r => r.GetByProductoYAlmacenAsync(1, 2))
            .ReturnsAsync(new Inventario { Id = 9, ProductoId = 1, AlmacenId = 2 });

        var result = await CreateSut().CreateAsync(dto);

        result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Update_ConCantidadMayorAlMaximo_DebeRetornar400()
    {
        var existente = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 5,
            StockMinimo = 2,
            StockMaximo = 20
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(existente);

        var result = await CreateSut().UpdateAsync(7, new ActualizarInventarioDto
        {
            Cantidad = 30
        });

        result.Should().BeOfType<BadRequestObjectResult>();
        existente.Cantidad.Should().Be(5);
        _inventario.Verify(r => r.UpdateAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ConRegistroExistente_DebeEliminarYRetornar204()
    {
        var existente = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(existente);

        var result = await CreateSut().DeleteAsync(7);

        result.Should().BeOfType<NoContentResult>();
        _inventario.Verify(r => r.DeleteAsync(existente), Times.Once);
    }

    [Fact]
    public async Task GetLowStock_DebeRetornarRegistrosDelRepositorio()
    {
        var registros = new List<Inventario>
        {
            new() { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 1, StockMinimo = 2 }
        };
        _inventario.Setup(r => r.GetLowStockAsync()).ReturnsAsync(registros);

        var result = await CreateSut().GetLowStockAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(registros);
        _inventario.Verify(r => r.GetLowStockAsync(), Times.Once);
    }

    [Fact]
    public async Task GetMios_ComoVeterinaria_DebeRetornarSoloInventarioDeSusAlmacenes()
    {
        var usuario = new Usuario { Id = 3, RolId = 2, VeterinariaId = 7 };
        _usuarios.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(usuario);
        _almacenes.Setup(r => r.GetByVeterinariaIdAsync(7)).ReturnsAsync(new List<Almacen>
        {
            new() { Id = 2, VeterinariaId = 7 },
            new() { Id = 5, VeterinariaId = 7 }
        });
        var inventario = new List<Inventario> { new() { Id = 1, AlmacenId = 2 }, new() { Id = 2, AlmacenId = 5 } };
        _inventario.Setup(r => r.GetByAlmacenesAsync(new[] { 2, 5 })).ReturnsAsync(inventario);

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 3);

        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(inventario);
        _inventario.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetMios_ComoAdministrador_DebeRetornarTodoElInventario()
    {
        var usuario = new Usuario { Id = 1, RolId = 1 };
        _usuarios.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(usuario);
        var todo = new List<Inventario> { new() { Id = 1, AlmacenId = 2 } };
        _inventario.Setup(r => r.GetAllAsync()).ReturnsAsync(todo);

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 1);

        var result = await sut.GetMiosAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(todo);
        _inventario.Verify(r => r.GetAllAsync(), Times.Once);
    }

    private static void SetAuthenticatedUser(InventarioController controller, int userId)
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
}
