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

    // ─────────────────────────────────────────────────────────────
    // Sprint 1 - Tarea 10: campos de logistica del wireframe
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void CrearTrasladoExpedienteDto_ConCamposLogisticaValidos_NoDebeTenerErrores()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            OrigenLatitud = 9.934739m,
            OrigenLongitud = -84.087502m,
            DestinoLatitud = -90m,
            DestinoLongitud = 180m,
            EstadoLogistica = "EnTransito",
            EtaLlegada = new DateTime(2026, 8, 22, 10, 15, 0, DateTimeKind.Utc),
            Salida = new DateTime(2026, 8, 22, 9, 30, 0, DateTimeKind.Utc)
        };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConOrigenLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            OrigenLatitud = 90.1m
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.OrigenLatitud)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConOrigenLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            OrigenLongitud = -180.01m
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.OrigenLongitud)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConDestinoLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            DestinoLatitud = 90.5m
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.DestinoLatitud)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConDestinoLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            DestinoLongitud = 180.1m
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.DestinoLongitud)));
    }

    [Fact]
    public void CrearTrasladoExpedienteDto_ConEstadoLogisticaDemasiadoLargo_DebeSerInvalido()
    {
        var dto = new CrearTrasladoExpedienteDto
        {
            MascotaId = 1,
            VeterinariaDestinoId = 2,
            EstadoLogistica = new string('x', 21)
        };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearTrasladoExpedienteDto.EstadoLogistica)));
    }

    [Fact]
    public void ActualizarTrasladoExpedienteDto_ConCamposValidos_NoDebeTenerErrores()
    {
        var dto = new ActualizarTrasladoExpedienteDto
        {
            OrigenLatitud = 9.934739m,
            OrigenLongitud = -84.087502m,
            EstadoLogistica = "Completado",
            EtaLlegada = new DateTime(2026, 8, 22, 10, 15, 0, DateTimeKind.Utc)
        };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void ActualizarTrasladoExpedienteDto_ConVacio_NoDebeTenerErrores()
    {
        // Update parcial: un DTO vacio (todos los campos null) es valido y preserva todo.
        Validate(new ActualizarTrasladoExpedienteDto()).Should().BeEmpty();
    }

    [Fact]
    public void ActualizarTrasladoExpedienteDto_ConLatitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new ActualizarTrasladoExpedienteDto { DestinoLatitud = -90.1m };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarTrasladoExpedienteDto.DestinoLatitud)));
    }

    [Fact]
    public void ActualizarTrasladoExpedienteDto_ConLongitudFueraDeRango_DebeSerInvalido()
    {
        var dto = new ActualizarTrasladoExpedienteDto { DestinoLongitud = 181m };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarTrasladoExpedienteDto.DestinoLongitud)));
    }

    [Fact]
    public void ActualizarTrasladoExpedienteDto_ConEstadoLogisticaDemasiadoLargo_DebeSerInvalido()
    {
        var dto = new ActualizarTrasladoExpedienteDto { EstadoLogistica = new string('x', 21) };

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarTrasladoExpedienteDto.EstadoLogistica)));
    }
}
