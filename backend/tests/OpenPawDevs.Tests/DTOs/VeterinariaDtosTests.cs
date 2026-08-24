using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Veterinaria;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Sprint 1 - Tarea 6: tests de validacion (DataAnnotations) y mapeo de los campos nuevos
/// del wireframe de Registro de Veterinaria (RazonSocial, Nit, CorreoOficial, Latitud, Longitud).
/// </summary>
public class VeterinariaDtosTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearVeterinariaDto CrearDtoValido() => new()
    {
        Nombre = "Clínica Huellitas",
        CedulaJuridica = "3-101-123456",
        RazonSocial = "Clínica Veterinaria Huellitas S.A.",
        Nit = "3-101-123456",
        CorreoOficial = "contacto@huellitas.cr",
        Latitud = 9.934739m,
        Longitud = -84.087502m
    };

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

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Latitud)));
    }

    [Fact]
    public void ConLatitudNegativaFueraDeRango_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Latitud = -90.1m;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Latitud)));
    }

    [Fact]
    public void ConLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Longitud = 180.5m;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Longitud)));
    }

    [Fact]
    public void ConNitInvalido_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Nit = "AB@CD/1";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Nit)));
    }

    [Fact]
    public void ConNitDemasiadoCorto_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.Nit = "123";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Nit)));
    }

    [Fact]
    public void ConNitConPuntosYGuiones_DebeSerValido()
    {
        var dto = CrearDtoValido();
        dto.Nit = "900.123.456-7";

        Validate(dto).Should().NotContain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.Nit)));
    }

    [Fact]
    public void ConCorreoOficialInvalido_DebeSerInvalido()
    {
        var dto = CrearDtoValido();
        dto.CorreoOficial = "correo-sin-arroba";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearVeterinariaDto.CorreoOficial)));
    }

    [Fact]
    public void ConCamposNuevosNull_DebeSerValido()
    {
        // Los campos nuevos son opcionales para no romper el contrato del frontend actual.
        var dto = CrearDtoValido();
        dto.RazonSocial = null;
        dto.Nit = null;
        dto.CorreoOficial = null;
        dto.Latitud = null;
        dto.Longitud = null;

        Validate(dto).Should().BeEmpty();
    }

    // ---------- Mapeo (round-trip) ----------

    [Fact]
    public void ToDto_RoundTrip_PreservaCamposNuevos()
    {
        var entity = new Core.Entities.Veterinaria
        {
            Id = 7,
            Nombre = "Clínica Huellitas",
            CedulaJuridica = "3-101-123456",
            RazonSocial = "Clínica Veterinaria Huellitas S.A.",
            Nit = "3-101-123456",
            CorreoOficial = "contacto@huellitas.cr",
            Latitud = 9.934739m,
            Longitud = -84.087502m,
            Direccion = "San José",
            Telefono = "2222-3344",
            Email = "admin@huellitas.cr"
        };

        var dto = VeterinariaMapeo.ToDto(entity);

        dto.RazonSocial.Should().Be(entity.RazonSocial);
        dto.Nit.Should().Be(entity.Nit);
        dto.CorreoOficial.Should().Be(entity.CorreoOficial);
        dto.Latitud.Should().Be(entity.Latitud);
        dto.Longitud.Should().Be(entity.Longitud);
        // Campos legacy intactos
        dto.Nombre.Should().Be(entity.Nombre);
        dto.CedulaJuridica.Should().Be(entity.CedulaJuridica);
        dto.Direccion.Should().Be(entity.Direccion);
    }

    // ---------- Update parcial ----------

    [Fact]
    public void AplicarActualizacion_ConNull_PreservaValoresExistentes()
    {
        var entity = new Core.Entities.Veterinaria
        {
            RazonSocial = "Razón original",
            Nit = "3-101-111111",
            CorreoOficial = "viejos@clinic.com",
            Latitud = 9.934739m,
            Longitud = -84.087502m,
            Direccion = "Heredia",
            Telefono = "2233-4455",
            Email = "viejo@clinic.com",
            Descripcion = "Descripción existente"
        };

        var dto = new ActualizarVeterinariaDto
        {
            // Solo se envía un campo: el resto debe preservarse.
            RazonSocial = "Razón actualizada"
        };

        VeterinariaMapeo.AplicarActualizacion(entity, dto);

        entity.RazonSocial.Should().Be("Razón actualizada");
        entity.Nit.Should().Be("3-101-111111");
        entity.CorreoOficial.Should().Be("viejos@clinic.com");
        entity.Latitud.Should().Be(9.934739m);
        entity.Longitud.Should().Be(-84.087502m);
        entity.Direccion.Should().Be("Heredia");
        entity.Telefono.Should().Be("2233-4455");
        entity.Email.Should().Be("viejo@clinic.com");
        entity.Descripcion.Should().Be("Descripción existente");
    }

    [Fact]
    public void AplicarActualizacion_ConValores_ActualizaCamposNuevos()
    {
        var entity = new Core.Entities.Veterinaria
        {
            RazonSocial = "Razón original",
            Nit = "3-101-111111",
            Latitud = null,
            Longitud = null
        };

        var dto = new ActualizarVeterinariaDto
        {
            Nit = "3-101-222222",
            Latitud = -33.44889m,
            Longitud = -70.669265m
        };

        VeterinariaMapeo.AplicarActualizacion(entity, dto);

        entity.RazonSocial.Should().Be("Razón original"); // no enviado -> preservado
        entity.Nit.Should().Be("3-101-222222");
        entity.Latitud.Should().Be(-33.44889m);
        entity.Longitud.Should().Be(-70.669265m);
    }

    [Fact]
    public void ActualizarDto_ConLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new ActualizarVeterinariaDto { Latitud = 91m };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarVeterinariaDto.Latitud)));
    }

    [Fact]
    public void ActualizarDto_ConNitInvalido_DebeSerInvalido()
    {
        var dto = new ActualizarVeterinariaDto { Nit = "NO VALIDO!!" };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarVeterinariaDto.Nit)));
    }

    [Fact]
    public void ActualizarDto_Vacio_DebeSerValido()
    {
        // PUT parcial: un DTO con todos los campos null es válido (nada se modifica).
        Validate(new ActualizarVeterinariaDto()).Should().BeEmpty();
    }
}