using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Emergencia;
using OpenPawDevs.Core.Entities;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Tests de validación (DataAnnotations) de CrearEmergenciaDto (PBI 133 - Atención de
/// emergencias). Cubre campos obligatorios pedidos en la tarea #149 que no se ejercitan
/// en los tests de controller.
/// </summary>
public class EmergenciaDtoTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearEmergenciaDto DtoValido() => new()
    {
        MascotaId = 1,
        EsEnPlataforma = true,
        FechaAtencion = DateTime.UtcNow,
        Motivo = "Convulsiones"
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

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.MascotaId)));
    }

    [Fact]
    public void ConMotivoVacio_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.Motivo = "";

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.Motivo)));
    }

    [Fact]
    public void ConMotivoDemasiadoLargo_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.Motivo = new string('x', 1001);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.Motivo)));
    }

    [Fact]
    public void ConVeterinariaNombreExternaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.VeterinariaNombreExterna = new string('x', 151);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.VeterinariaNombreExterna)));
    }

    // ─────────────────────────────────────────────────────────────
    // Sprint 1 T4 - Emergencias: severidad, signos vitales, tratamiento, medico
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void ConSeveridadYSignosVitalesValidos_NoDebeTenerErrores()
    {
        var dto = DtoValido();
        dto.NivelSeveridad = "Nivel1_Critico";
        dto.FrecuenciaCardiaca = 160;
        dto.SaturacionO2 = 88;
        dto.Temperatura = 39.2m;
        dto.EstadoPaciente = "Estable";
        dto.MedicoACargo = "Dr. Martinez";
        dto.Diagnostico = "Convulsion generalizada";

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void ConFrecuenciaCardiacaFueraDeRango_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.FrecuenciaCardiaca = 500;

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.FrecuenciaCardiaca)));
    }

    [Fact]
    public void ConMedicoACargoDemasiadoLargo_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.MedicoACargo = new string('x', 151);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearEmergenciaDto.MedicoACargo)));
    }

    [Fact]
    public void EmergenciaDto_NoDebeExponerEntidadesDeNavegacion()
    {
        // El DTO de respuesta no debe serializar la entidad cruda ni sus navegaciones (evita PII)
        var properties = typeof(EmergenciaDto).GetProperties().Select(p => p.Name).ToArray();

        properties.Should().NotContain(nameof(Emergencia.Mascota));
        properties.Should().NotContain(nameof(Emergencia.Propietario));
        properties.Should().NotContain(nameof(Emergencia.Veterinaria));
    }
}
