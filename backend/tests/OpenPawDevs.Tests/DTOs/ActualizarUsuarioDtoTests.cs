using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Usuario;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Tests de validación (DataAnnotations) de ActualizarUsuarioDto (perfil extendido).
/// Cubre los campos nuevos: FechaIncorporacion (rango/futuro), Telefono/TelefonoEmergencia
/// (regex sin espacios) y normalización de "" a null.
/// </summary>
public class ActualizarUsuarioDtoTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static ActualizarUsuarioDto DtoValido() => new()
    {
        Nombre = "Ana Gomez",
        Telefono = "5551234567",
        TelefonoEmergencia = "(555)123-4567",
        Direccion = "Calle 1",
        LicenciaMedica = "LM-123",
        FechaIncorporacion = DateTime.Today.AddDays(-30),
        FotoUrl = "https://ejemplo.com/foto.jpg"
    };

    [Fact]
    public void ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(DtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void ConFechaIncorporacionFutura_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.FechaIncorporacion = DateTime.Today.AddDays(1);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.FechaIncorporacion)));
    }

    [Fact]
    public void ConFechaIncorporacionMinValue_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.FechaIncorporacion = DateTime.MinValue;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.FechaIncorporacion)));
    }

    [Fact]
    public void ConFechaIncorporacionAnio1950_DebeSerValido()
    {
        var dto = DtoValido();
        dto.FechaIncorporacion = new DateTime(1950, 1, 1);

        Validate(dto).Should().NotContain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.FechaIncorporacion)));
    }

    [Fact]
    public void ConFechaIncorporacionNull_DebeSerValido()
    {
        var dto = DtoValido();
        dto.FechaIncorporacion = null;

        Validate(dto).Should().NotContain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.FechaIncorporacion)));
    }

    [Fact]
    public void ConTelefonoConEspacios_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.Telefono = "555 123 4567";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.Telefono)));
    }

    [Fact]
    public void ConTelefonoEmergenciaConEspacios_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.TelefonoEmergencia = "555 123 4567";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.TelefonoEmergencia)));
    }

    [Fact]
    public void ConTelefonoConParentesis_DebeSerValido()
    {
        var dto = DtoValido();
        dto.Telefono = "(555)123-4567";

        Validate(dto).Should().NotContain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.Telefono)));
    }

    [Fact]
    public void ConTelefonoVacio_SeNormalizaANull()
    {
        var dto = DtoValido();
        dto.Telefono = "";

        dto.Telefono.Should().BeNull();
        dto.TelefonoEmergencia = "   ";
        dto.TelefonoEmergencia.Should().BeNull();
    }

    [Fact]
    public void ConLicenciaMedicaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.LicenciaMedica = new string('x', 101);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarUsuarioDto.LicenciaMedica)));
    }
}