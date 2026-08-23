using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
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

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 1); // admin: pasa el guard anti-IDOR y llega a la validacion de stock

        var result = await sut.UpdateAsync(7, new ActualizarInventarioDto
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

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 1); // admin: pasa el guard anti-IDOR del DELETE (fix A1)

        var result = await sut.DeleteAsync(7);

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

        var sut = CreateSut();
        SetAuthenticatedUser(sut, 1); // admin: pasa el guard de propiedad del GET (fix A3)

        var result = await sut.GetLowStockAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<InventarioDto>>().Subject.ToList();
        dto.Should().HaveCount(1);
        dto[0].Id.Should().Be(7);
        dto[0].Cantidad.Should().Be(1);
        dto[0].ProductoId.Should().Be(1);
        dto[0].AlmacenId.Should().Be(2);
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
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<InventarioDto>>().Subject.ToList();
        dto.Select(d => d.AlmacenId).Should().BeEquivalentTo(new[] { 2, 5 });
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
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<InventarioDto>>().Subject.ToList();
        dto.Should().HaveCount(1);
        dto[0].AlmacenId.Should().Be(2);
        _inventario.Verify(r => r.GetAllAsync(), Times.Once);
    }

    // Deuda #70: validación de endpoints interno (auth) vs público (AllowAnonymous)

    [Fact]
    public void GetAll_DebeRequerirAutorizacion_SinAllowAnonymous()
    {
        var method = typeof(InventarioController).GetMethod(nameof(InventarioController.GetAllAsync))!;
        method.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Should().BeEmpty(
            "GET /api/inventario interno debe requerir auth (sin AllowAnonymous)");
        method.GetCustomAttributes(typeof(AuthorizeAttribute), false)
            .Cast<AuthorizeAttribute>().Should().ContainSingle(
                "debe tener [Authorize] explícito (cubre 401 sin token)");
    }

    [Fact]
    public void GetPublico_DebePermitirAnonimo()
    {
        var method = typeof(InventarioController).GetMethod(nameof(InventarioController.GetPublicoAsync))!;
        method.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Should().ContainSingle(
            "GET /api/inventario/publico debe ser [AllowAnonymous] (200 sin token)");
    }

    [Fact]
    public async Task GetPublico_DebeRetornarSoloConStockYDtoMinimo()
    {
        var registros = new List<Inventario>
        {
            new() { Id = 1, ProductoId = 10, Cantidad = 5, Producto = new Producto { Id = 10, Nombre = "Alimento Premium", Precio = 15000, ImagenUrl = "img.jpg", Categoria = "Alimentos", Activo = true }, Almacen = new Almacen { Id = 2, Nombre = "Central", VeterinariaId = 7, Veterinaria = new Veterinaria { Id = 7, Nombre = "Vet San Roque" } } },
            new() { Id = 2, ProductoId = 11, Cantidad = 0, Producto = new Producto { Id = 11, Nombre = "Agotado", Precio = 5000, Activo = true } },
            new() { Id = 3, ProductoId = 12, Cantidad = 3, Producto = new Producto { Id = 12, Nombre = "Inactivo", Precio = 8000, Activo = false } },
        };
        _inventario.Setup(r => r.GetAllAsync()).ReturnsAsync(registros);

        var result = await CreateSut().GetPublicoAsync();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<InventarioPublicoDto>>().Subject.ToList();
        dto.Should().ContainSingle("solo el registro con stock>0 y activo debe exponerse");
        dto[0].InventarioId.Should().Be(1);
        dto[0].ProductoId.Should().Be(10);
        dto[0].Nombre.Should().Be("Alimento Premium");
        dto[0].Precio.Should().Be(15000);
        dto[0].Stock.Should().Be(5);
        dto[0].ImagenUrl.Should().Be("img.jpg");
        dto[0].Categoria.Should().Be("Alimentos");
        dto[0].AlmacenNombre.Should().Be("Central");
        dto[0].VeterinariaId.Should().Be(7);
        // DTO mínimo no debe exponer campos internos sensibles (validación estructural)
        typeof(InventarioPublicoDto).GetProperty("StockMinimo").Should().BeNull();
        typeof(InventarioPublicoDto).GetProperty("StockMaximo").Should().BeNull();
        typeof(InventarioPublicoDto).GetProperty("Lote").Should().BeNull();
        typeof(InventarioPublicoDto).GetProperty("Ubicacion").Should().BeNull();
        typeof(InventarioPublicoDto).GetProperty("Cantidad").Should().BeNull("se expone como Stock, no Cantidad interna");
    }

    [Fact]
    public async Task GetPublico_ConInventarioVacio_DebeRetornarListaVacia200()
    {
        _inventario.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Inventario>());
        var result = await CreateSut().GetPublicoAsync();
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IEnumerable<InventarioPublicoDto>>().Which.Should().BeEmpty();
    }

    private static void SetAuthenticatedUser(InventarioController controller, int userId, int rolId = 1)
    {
        // "sub" lo lee GetAuthenticatedUserId(); "rol" como tipo de claim para User.IsInRole("1").
        var claims = new List<Claim>
        {
            new("sub", userId.ToString()),
            new("rol", rolId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test", ClaimTypes.NameIdentifier, "rol");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }
}
