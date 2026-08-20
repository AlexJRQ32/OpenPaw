using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Traslado;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Tests de validación (DataAnnotations) de los DTOs del PBI 131 - Traslado de expediente.
/// Estas reglas no se ejercitan en los tests de controller (que invocan la acción
/// directamente sin pasar por el pipeline de model-binding de ASP.NET Core), por lo que
/// se validan aquí de forma aislada con el Validator estándar de .NET.
/// </summary>
public class TrasladoExpedienteDtosTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConDatosValidos_NoDebeTenerErrores()
    {
        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 2, Comentario = "Mudanza" };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConMascotaIdCero_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto { MascotaId = 0, VeterinariaDestinoId = 2 };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.MascotaId)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConVeterinariaDestinoIdCero_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto { MascotaId = 1, VeterinariaDestinoId = 0 };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.VeterinariaDestinoId)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConComentarioDemasiadoLargo_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            Comentario = new string('x', 1001)
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.Comentario)));
    }

    [Fact]
    public void RechazarTrasladoDto_ConMotivoValido_NoDebeTenerErrores()
    {
        var dto = new RechazarTrasladoDto { MotivoRechazo = "Sin cupo disponible" };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void RechazarTrasladoDto_ConMotivoVacio_DebeSerInvalido()
    {
        var dto = new RechazarTrasladoDto { MotivoRechazo = "" };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(RechazarTrasladoDto.MotivoRechazo)));
    }

    [Fact]
    public void RechazarTrasladoDto_ConMotivoDemasiadoLargo_DebeSerInvalido()
    {
        var dto = new RechazarTrasladoDto { MotivoRechazo = new string('x', 1001) };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(RechazarTrasladoDto.MotivoRechazo)));
    }
}
