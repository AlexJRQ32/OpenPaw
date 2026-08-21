using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Almacen;
using OpenPawDevs.Core.DTOs.Veterinaria;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Sprint 1 - Tarea 7: tests de validacion (DataAnnotations), mapeo round-trip y update parcial
/// de los campos del wireframe de Registro de Almacen (TipoAlmacen, NombreResponsable,
/// CapacidadAlmacenamiento, ControlTemperatura, Latitud, Longitud).
/// </summary>
public class AlmacenDtosTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearAlmacenDto CrearDtoValido() => new()
    {
        Nombre = "Almacén Central",
        CedulaJuridica = "3-101-123456",
        TipoAlmacen = "Interno",
        NombreResponsable = "Dr. David Chen",
        CapacidadAlmacenamiento = "De50a150",
        ControlTemperatura = "CadenaFrio",
        Latitud = 9.934739m,
        Longitud = -84.087502m
    };

    // ---------- Validacion ----------

    [Fact]
    public void ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(CrearDtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void ConLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Latitud = 90.5m;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAlmacenDto.Latitud)));
    }

    [Fact]
    public void ConLatitudNegativaFueraDeRango_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Latitud = -90.1m;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAlmacenDto.Latitud)));
    }

    [Fact]
    public void ConLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Longitud = 180.5m;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAlmacenDto.Longitud)));
    }

    [Fact]
    public void ConNombreResponsableDemasiadoLargo_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.NombreResponsable = new string('a', 200);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAlmacenDto.NombreResponsable)));
    }

    [Fact]
    public void ConCamposNuevosNull_DebeSerValido()
    {
        // Opcionales para no romper el contrato del frontend actual.
        var dto = CrearDtoValido();
        dto.TipoAlmacen = null;
        dto.NombreResponsable = null;
        dto.CapacidadAlmacenamiento = null;
        dto.ControlTemperatura = null;
        dto.Latitud = null;
        dto.Longitud = null;

        Validate(dto).Should().BeEmpty();
    }

    // ---------- Mapeo (round-trip) ----------

    [Fact]
    public void ToDto_RoundTrip_PreservaCamposNuevos()
    {
        var entity = new Core.Entities.Almacen
        {
            Id = 7,
            Nombre = "Almacén Central",
            CedulaJuridica = "3-101-123456",
            Direccion = "San José",
            TipoAlmacen = "Interno",
            NombreResponsable = "Dr. David Chen",
            CapacidadAlmacenamiento = "De50a150",
            ControlTemperatura = "CadenaFrio",
            Latitud = 9.934739m,
            Longitud = -84.087502m
        };

        var dto = AlmacenMapeo.ToDto(entity);

        dto.TipoAlmacen.Should().Be(entity.TipoAlmacen);
        dto.NombreResponsable.Should().Be(entity.NombreResponsable);
        dto.CapacidadAlmacenamiento.Should().Be(entity.CapacidadAlmacenamiento);
        dto.ControlTemperatura.Should().Be(entity.ControlTemperatura);
        dto.Latitud.Should().Be(entity.Latitud);
        dto.Longitud.Should().Be(entity.Longitud);
        // Campos legacy intactos
        dto.Id.Should().Be(entity.Id);
        dto.Nombre.Should().Be(entity.Nombre);
        dto.Direccion.Should().Be(entity.Direccion);
    }

    // ---------- Update parcial ----------

    [Fact]
    public void AplicarActualizacion_ConNull_PreservaValoresExistentes()
    {
        var entity = new Core.Entities.Almacen
        {
            Nombre = "Almacén Original",
            TipoAlmacen = "Interno",
            NombreResponsable = "Dr. Original",
            CapacidadAlmacenamiento = "Menos50",
            ControlTemperatura = "SinControl",
            Latitud = 9.934739m,
            Longitud = -84.087502m,
            Direccion = "Heredia"
        };

        var dto = new ActualizarAlmacenDto
        {
            // Solo se envia un campo nuevo: el resto debe preservarse.
            NombreResponsable = "Dr. Actualizado"
        };

        AlmacenMapeo.AplicarActualizacion(entity, dto);

        entity.NombreResponsable.Should().Be("Dr. Actualizado");
        entity.TipoAlmacen.Should().Be("Interno");
        entity.CapacidadAlmacenamiento.Should().Be("Menos50");
        entity.ControlTemperatura.Should().Be("SinControl");
        entity.Latitud.Should().Be(9.934739m);
        entity.Longitud.Should().Be(-84.087502m);
        entity.Nombre.Should().Be("Almacén Original");
        entity.Direccion.Should().Be("Heredia");
    }

    [Fact]
    public void AplicarActualizacion_ConValores_ActualizaCamposNuevos()
    {
        var entity = new Core.Entities.Almacen
        {
            TipoAlmacen = "Externo",
            Latitud = null,
            Longitud = null
        };

        var dto = new ActualizarAlmacenDto
        {
            TipoAlmacen = "CentroDistribucion",
            CapacidadAlmacenamiento = "Mas500",
            ControlTemperatura = "Mixto",
            Latitud = -33.44889m,
            Longitud = -70.669265m
        };

        AlmacenMapeo.AplicarActualizacion(entity, dto);

        entity.TipoAlmacen.Should().Be("CentroDistribucion");
        entity.CapacidadAlmacenamiento.Should().Be("Mas500");
        entity.ControlTemperatura.Should().Be("Mixto");
        entity.Latitud.Should().Be(-33.44889m);
        entity.Longitud.Should().Be(-70.669265m);
        entity.NombreResponsable.Should().BeNull(); // no enviado -> preservado (null)
    }

    [Fact]
    public void ActualizarDto_ConLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new ActualizarAlmacenDto { Latitud = 91m };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarAlmacenDto.Latitud)));
    }

    [Fact]
    public void ActualizarDto_ConLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new ActualizarAlmacenDto { Longitud = -181m };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarAlmacenDto.Longitud)));
    }

    [Fact]
    public void ActualizarDto_Vacio_DebeSerValido()
    {
        // PUT parcial: un DTO con todos los campos null es válido (nada se modifica).
        Validate(new ActualizarAlmacenDto()).Should().BeEmpty();
    }
}