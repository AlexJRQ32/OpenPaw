using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Aporte;
using OpenPawDevs.Core.Enums;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Tests de validación (DataAnnotations) de CrearAporteExpedienteDto (PBI 132 - Aporte de
/// expediente externo). Cubre "veterinaria en blanco" y demás campos obligatorios pedidos
/// en la tarea #144, que no se ejercitan en los tests de controller.
/// </summary>
public class AporteExpedienteDtoTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearAporteExpedienteDto DtoValido() => new()
    {
        MascotaId = 1,
        VeterinariaNombre = "Clinica Externa",
        FechaAtencion = DateTime.UtcNow.AddDays(-1),
        TipoAtencion = TipoAtencion.Consulta,
        Descripcion = "Consulta de rutina"
    };

    [Fact]
    public void ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(DtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void ConMascotaIdCero_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.MascotaId = 0;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAporteExpedienteDto.MascotaId)));
    }

    [Fact]
    public void ConVeterinariaNombreEnBlanco_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.VeterinariaNombre = "   ";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAporteExpedienteDto.VeterinariaNombre)));
    }

    [Fact]
    public void ConVeterinariaNombreDemasiadoLargo_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.VeterinariaNombre = new string('x', 151);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAporteExpedienteDto.VeterinariaNombre)));
    }

    [Fact]
    public void ConDescripcionVacia_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.Descripcion = "";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAporteExpedienteDto.Descripcion)));
    }

    [Fact]
    public void ConDiagnosticoDemasiadoLargo_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.Diagnostico = new string('x', 1001);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearAporteExpedienteDto.Diagnostico)));
    }
}
