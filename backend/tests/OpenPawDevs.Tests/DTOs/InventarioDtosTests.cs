using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Producto;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Sprint 1 - Tarea 8: tests de validacion (DataAnnotations), mapeo round-trip y update parcial
/// de los campos del wireframe de Inventario (Categoria, Lote, Ubicacion, UnidadMedida).
/// </summary>
public class InventarioDtosTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
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

    // ---------- Validacion ----------

    [Fact]
    public void ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(CrearDtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void ConLoteDemasiadoLargo_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Lote = new string('A', 51);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearInventarioDto.Lote)));
    }

    [Fact]
    public void ConUbicacionDemasiadoLarga_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Ubicacion = new string('A', 51);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearInventarioDto.Ubicacion)));
    }

    [Fact]
    public void ConCategoriaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Categoria = new string('A', 31);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearInventarioDto.Categoria)));
    }

    [Fact]
    public void ConUnidadMedidaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.UnidadMedida = new string('A', 21);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearInventarioDto.UnidadMedida)));
    }

    [Fact]
    public void ConCamposNuevosNull_DebeSerValido()
    {
        // Opcionales para no romper el contrato del frontend actual (patron tarea 7).
        var dto = CrearDtoValido();
        dto.Categoria = null;
        dto.Lote = null;
        dto.Ubicacion = null;
        dto.UnidadMedida = null;

        Validate(dto).Should().BeEmpty();
    }

    // ---------- Mapeo (round-trip) ----------

    [Fact]
    public void ToDto_RoundTrip_PreservaCamposNuevos()
    {
        var entity = new Core.Entities.Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Cantidad = 450,
            StockMinimo = 50,
            StockMaximo = 1000,
            Categoria = "Biologicos",
            Lote = "AMX-2394",
            Ubicacion = "Refri A",
            UnidadMedida = "viales"
        };

        var dto = InventarioMapeo.ToDto(entity);

        dto.Categoria.Should().Be(entity.Categoria);
        dto.Lote.Should().Be(entity.Lote);
        dto.Ubicacion.Should().Be(entity.Ubicacion);
        dto.UnidadMedida.Should().Be(entity.UnidadMedida);
        dto.Id.Should().Be(entity.Id);
        dto.Cantidad.Should().Be(entity.Cantidad);
        dto.StockMaximo.Should().Be(1000);
    }

    [Fact]
    public void ToDto_SinNavigation_UsaNombresVacios()
    {
        var entity = new Core.Entities.Inventario { Id = 7, ProductoId = 1, AlmacenId = 2 };

        var dto = InventarioMapeo.ToDto(entity);

        dto.ProductoNombre.Should().BeEmpty();
        dto.AlmacenNombre.Should().BeEmpty();
        dto.StockMaximo.Should().Be(0);
    }

    // ---------- Fix C1: forma anidada (contrato que consume el frontend) ----------

    [Fact]
    public void ToDto_ConNavigation_ExponeProductoYAlmacenAnidados()
    {
        var entity = new Core.Entities.Inventario
        {
            Id = 7,
            ProductoId = 1,
            AlmacenId = 2,
            Producto = new Core.Entities.Producto
            {
                Id = 1,
                Nombre = "Amoxicilina 500mg",
                Precio = 2500m,
                Descripcion = "Antibiotico",
                Categoria = "Antibiotico",
                Proveedor = "FarmVet",
                ImagenUrl = "img.png",
                UnidadMedida = "caja",
                Activo = true
            },
            Almacen = new Core.Entities.Almacen
            {
                Id = 2,
                Nombre = "Almacen Central",
                VeterinariaId = 7,
                Veterinaria = new Core.Entities.Veterinaria { Id = 7, Nombre = "Vet San Jose" }
            }
        };

        var dto = InventarioMapeo.ToDto(entity);

        // Campos planos preservados (no romper el contrato plano).
        dto.ProductoNombre.Should().Be("Amoxicilina 500mg");
        dto.AlmacenNombre.Should().Be("Almacen Central");
        // Forma anidada que consume InventarioPage.jsx (producto.nombre/precio, almacen.nombre).
        dto.Producto.Should().NotBeNull();
        dto.Producto!.Nombre.Should().Be("Amoxicilina 500mg");
        dto.Producto.Precio.Should().Be(2500m);
        dto.Producto.Activo.Should().BeTrue();
        dto.Almacen.Should().NotBeNull();
        dto.Almacen!.Nombre.Should().Be("Almacen Central");
        dto.Almacen.VeterinariaId.Should().Be(7);
        dto.Almacen.Veterinaria.Should().NotBeNull();
        dto.Almacen.Veterinaria!.Nombre.Should().Be("Vet San Jose");
    }

    [Fact]
    public void ToDto_SinNavigation_AnidadosNulos()
    {
        var entity = new Core.Entities.Inventario { Id = 7, ProductoId = 1, AlmacenId = 2 };

        var dto = InventarioMapeo.ToDto(entity);

        dto.Producto.Should().BeNull();
        dto.Almacen.Should().BeNull();
    }

    // ---------- Update parcial ----------

    [Fact]
    public void AplicarActualizacion_ConNull_PreservaValoresExistentes()
    {
        var entity = new Core.Entities.Inventario
        {
            Cantidad = 450,
            StockMinimo = 50,
            StockMaximo = 1000,
            Categoria = "Antibiotico",
            Lote = "LOTE-1",
            Ubicacion = "Refri A",
            UnidadMedida = "uds"
        };

        var dto = new ActualizarInventarioDto
        {
            // Solo se envia un campo nuevo: el resto debe preservarse.
            Lote = "AMX-2394"
        };

        InventarioMapeo.AplicarActualizacion(entity, dto);

        entity.Lote.Should().Be("AMX-2394");
        entity.Categoria.Should().Be("Antibiotico");
        entity.Ubicacion.Should().Be("Refri A");
        entity.UnidadMedida.Should().Be("uds");
        entity.StockMinimo.Should().Be(50);
        entity.StockMaximo.Should().Be(1000);
        // Fix M1: Cantidad no enviada (null) se preserva, ya no se zeroea.
        entity.Cantidad.Should().Be(450);
    }

    [Fact]
    public void AplicarActualizacion_ConValores_ActualizaCamposNuevos()
    {
        var entity = new Core.Entities.Inventario
        {
            Cantidad = 10,
            StockMinimo = 2,
            Categoria = null,
            Lote = null,
            Ubicacion = null,
            UnidadMedida = null
        };

        var dto = new ActualizarInventarioDto
        {
            Cantidad = 12,
            StockMinimo = 3,
            Categoria = "Consumibles",
            Lote = "LOTE-9",
            Ubicacion = "Caja 4",
            UnidadMedida = "rollos"
        };

        InventarioMapeo.AplicarActualizacion(entity, dto);

        entity.Cantidad.Should().Be(12);
        entity.StockMinimo.Should().Be(3);
        entity.Categoria.Should().Be("Consumibles");
        entity.Lote.Should().Be("LOTE-9");
        entity.Ubicacion.Should().Be("Caja 4");
        entity.UnidadMedida.Should().Be("rollos");
        entity.StockMaximo.Should().BeNull(); // no enviado -> preservado (null)
    }

    [Fact]
    public void ActualizarDto_Vacio_DebeSerValido()
    {
        // PUT parcial: un DTO con todos los campos null es válido (nada se modifica).
        Validate(new ActualizarInventarioDto()).Should().BeEmpty();
    }
}