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

/// <summary>
/// Sprint 1 - Tarea 8: tests del inventario con los campos del wireframe
/// (Categoria, Lote, Ubicacion, UnidadMedida).
/// Cubre: validacion de enum Categoria (999 -> 400), normalizacion a forma canonica
/// ("2" -> "Biologicos"), round-trip de campos nuevos, update parcial (null preserva)
/// y control de acceso del PUT (dueno del almacen/veterinaria o admin; ajeno -> 403).
/// </summary>
public class InventarioCamposControllerTests
{
    private readonly Mock<IInventarioRepository> _inventario = new();
    private readonly Mock<IProductoRepository> _productos = new();
    private readonly Mock<IAlmacenRepository> _almacenes = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();

    private InventarioController CreateSut(int usuarioId, int rolId, int? almacenId = null, int? veterinariaId = null)
    {
        var controller = new InventarioController(
            _inventario.Object, _productos.Object, _almacenes.Object, _usuarios.Object);

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
            AlmacenId = almacenId,
            VeterinariaId = veterinariaId
        });
        return controller;
    }

    private static CrearInventarioDto CrearDtoValido() => new()
    {
        ProductoId = 1,
        AlmacenId = 2,
        Cantidad = 450,
        StockMinimo = 50,
        StockMaximo = 1000,
        Categoria = "Antibiotico",
        Lote = "AMX-2394",
        Ubicacion = "Estante B2",
        UnidadMedida = "uds"
    };

    // ---------- Create: validacion de enum y round-trip ----------

    [Fact]
    public async Task Create_ConCategoriaInvalida_DebeRetornar400()
    {
        var dto = CrearDtoValido();
        dto.Categoria = "999";

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CreateAsync(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
        _inventario.Verify(r => r.AddAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Theory]
    [InlineData("2", "Biologicos")]
    [InlineData("antibiotico", "Antibiotico")]
    [InlineData("QUIRURGICO", "Quirurgico")]
    public async Task Create_ConCategoriaNoCanonica_DebePersistirFormaCanonica(string entrada, string esperado)
    {
        var dto = CrearDtoValido();
        dto.Categoria = entrada;
        _productos.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _almacenes.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _inventario.Setup(r => r.GetByProductoYAlmacenAsync(1, 2))
            .ReturnsAsync((Inventario?)null);
        _inventario.Setup(r => r.AddAsync(It.IsAny<Inventario>()))
            .ReturnsAsync((Inventario i) => i);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CreateAsync(dto);

        result.Should().BeOfType<CreatedResult>();
        _inventario.Verify(r => r.AddAsync(It.Is<Inventario>(i => i.Categoria == esperado)), Times.Once);
    }

    [Fact]
    public async Task Create_ConCamposInventario_DebeMapearRoundTrip()
    {
        var dto = CrearDtoValido();
        dto.Categoria = "Quirurgico";
        _productos.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _almacenes.Setup(r => r.ExistsAsync(2)).ReturnsAsync(true);
        _inventario.Setup(r => r.GetByProductoYAlmacenAsync(1, 2))
            .ReturnsAsync((Inventario?)null);
        _inventario.Setup(r => r.AddAsync(It.IsAny<Inventario>()))
            .Callback<Inventario>(i => i.Id = 15)
            .ReturnsAsync((Inventario i) => i);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).CreateAsync(dto);

        var created = result.Should().BeOfType<CreatedResult>().Subject;
        created.Location.Should().Be("/api/inventario/15");
        var dtoRespuesta = created.Value.Should().BeOfType<InventarioDto>().Subject;
        dtoRespuesta.Categoria.Should().Be("Quirurgico");
        dtoRespuesta.Lote.Should().Be("AMX-2394");
        dtoRespuesta.Ubicacion.Should().Be("Estante B2");
        dtoRespuesta.UnidadMedida.Should().Be("uds");
        _inventario.Verify(r => r.AddAsync(It.Is<Inventario>(i =>
            i.Categoria == "Quirurgico" &&
            i.Lote == "AMX-2394" &&
            i.Ubicacion == "Estante B2" &&
            i.UnidadMedida == "uds")), Times.Once);
    }

    // ---------- Update: enum invalido, normalizacion y update parcial ----------

    [Fact]
    public async Task Update_ConCategoriaInvalida_DebeRetornar400()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Categoria = "999" });

        result.Should().BeOfType<BadRequestObjectResult>();
        _inventario.Verify(r => r.UpdateAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Update_ConCategoriaNoCanonica_DebePersistirFormaCanonica()
    {
        var entity = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 5,
            StockMinimo = 1,
            Categoria = "Antibiotico",
            Lote = "LOTE-1",
            Ubicacion = "Refri A",
            UnidadMedida = "uds"
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Categoria = "2" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Categoria.Should().Be("Biologicos");
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ConSoloLote_PreservaRestoDeCampos()
    {
        // Update parcial: null en el DTO preserva el valor actual de la entidad.
        var entity = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 5,
            StockMinimo = 1,
            StockMaximo = 10,
            Categoria = "Antibiotico",
            Lote = "LOTE-1",
            Ubicacion = "Refri A",
            UnidadMedida = "viales"
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Lote = "AMX-9999" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Lote.Should().Be("AMX-9999");
        entity.Categoria.Should().Be("Antibiotico");
        entity.Ubicacion.Should().Be("Refri A");
        entity.UnidadMedida.Should().Be("viales");
        entity.StockMinimo.Should().Be(1);
        entity.StockMaximo.Should().Be(10);
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- Update: control de acceso (dueno o admin; ajeno -> 403) ----------

    [Fact]
    public async Task Update_AlmacenDuenioPuedeActualizarSuInventario_DebeRetornar200()
    {
        var entity = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 5,
            StockMinimo = 1,
            Categoria = "Antibiotico",
            Lote = "LOTE-1"
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2)
            .UpdateAsync(7, new ActualizarInventarioDto { Lote = "LOTE-2" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Lote.Should().Be("LOTE-2");
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_VeterinariaDueniaDelAlmacenPuedeActualizar_DebeRetornar200()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5, StockMinimo = 1 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);
        _almacenes.Setup(r => r.GetByVeterinariaIdAsync(7)).ReturnsAsync(new List<Almacen>
        {
            new() { Id = 2, VeterinariaId = 7 }
        });

        var result = await CreateSut(usuarioId: 3, rolId: 2, veterinariaId: 7)
            .UpdateAsync(7, new ActualizarInventarioDto { Categoria = "Consumibles" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Categoria.Should().Be("Consumibles");
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_AlmacenQueNoEsDuenio_DebeRetornar403()
    {
        // Rol 3 con AlmacenId 99 intenta editar inventario del almacen 2 (IDOR).
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5, StockMinimo = 1 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99)
            .UpdateAsync(7, new ActualizarInventarioDto { Lote = "INTRUSO" });

        result.Should().BeOfType<ForbidResult>();
        _inventario.Verify(r => r.UpdateAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Update_ClienteSinVincular_DebeRetornar403()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5, StockMinimo = 1 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 99, rolId: 4)
            .UpdateAsync(7, new ActualizarInventarioDto { Lote = "INTRUSO" });

        result.Should().BeOfType<ForbidResult>();
        _inventario.Verify(r => r.UpdateAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Update_AdministradorPuedeActualizarInventarioAjeno_DebeRetornar200()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5, StockMinimo = 1 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Ubicacion = "Gabinete Q1" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Ubicacion.Should().Be("Gabinete Q1");
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- Fix M1: PUT sin Cantidad preserva el valor existente ----------

    [Fact]
    public async Task Update_SinCantidad_PreservaCantidadExistente()
    {
        var entity = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 450,
            StockMinimo = 50,
            StockMaximo = 1000
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        // DTO sin Cantidad (null): el update parcial no debe zeroear la cantidad.
        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Lote = "AMX-9999" });

        result.Should().BeOfType<OkObjectResult>();
        entity.Cantidad.Should().Be(450);
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Update_ConCantidad_ActualizaCantidad()
    {
        var entity = new Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 450,
            StockMinimo = 50,
            StockMaximo = 1000
        };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1)
            .UpdateAsync(7, new ActualizarInventarioDto { Cantidad = 300 });

        result.Should().BeOfType<OkObjectResult>();
        entity.Cantidad.Should().Be(300);
        _inventario.Verify(r => r.UpdateAsync(entity), Times.Once);
    }

    // ---------- Fix A1: DELETE con guard anti-IDOR ----------

    [Fact]
    public async Task Delete_AlmacenQueNoEsDuenio_DebeRetornar403YNoEliminar()
    {
        // Rol 3 con AlmacenId 99 intenta eliminar inventario del almacen 2 (IDOR).
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99).DeleteAsync(7);

        result.Should().BeOfType<ForbidResult>();
        _inventario.Verify(r => r.DeleteAsync(It.IsAny<Inventario>()), Times.Never);
    }

    [Fact]
    public async Task Delete_AdministradorPuedeEliminarInventarioAjeno_DebeRetornar204()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 1, rolId: 1).DeleteAsync(7);

        result.Should().BeOfType<NoContentResult>();
        _inventario.Verify(r => r.DeleteAsync(entity), Times.Once);
    }

    // ---------- Fix A3: GETs de lectura con verificacion de propiedad ----------

    [Fact]
    public async Task GetById_InventarioAjeno_DebeRetornar403()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99).GetByIdAsync(7);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetById_DuenioDelAlmacenPuedeLeer_DebeRetornar200()
    {
        var entity = new Inventario { Id = 7, ProductoId = 1, AlmacenId = 2, Cantidad = 5 };
        _inventario.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(entity);

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 2).GetByIdAsync(7);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetByAlmacen_AlmacenQueNoEsDuenio_DebeRetornar403()
    {
        // Rol 3 con AlmacenId 99 consulta el inventario del almacen 2 (IDOR de lectura).
        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99)
            .GetByAlmacenAsync(2);

        result.Should().BeOfType<ForbidResult>();
        _inventario.Verify(r => r.GetByAlmacenIdAsync(2), Times.Never);
    }

    [Fact]
    public async Task GetByProducto_SinAccesoANingunAlmacen_DebeRetornar403()
    {
        // Producto con registros solo en el almacen 2; el usuario es del almacen 99.
        _inventario.Setup(r => r.GetByProductoIdAsync(1))
            .ReturnsAsync(new List<Inventario>
            {
                new() { Id = 1, ProductoId = 1, AlmacenId = 2, Cantidad = 5 }
            });

        var result = await CreateSut(usuarioId: 3, rolId: 3, almacenId: 99).GetByProductoAsync(1);

        result.Should().BeOfType<ForbidResult>();
    }
}