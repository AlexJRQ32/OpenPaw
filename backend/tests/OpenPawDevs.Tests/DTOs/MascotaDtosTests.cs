using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using OpenPawDevs.Core.DTOs.Mascota;
using Xunit;

namespace OpenPawDevs.Tests.DTOs;

/// <summary>
/// Tests de validacion (DataAnnotations) de los DTOs de Mascota para los campos
/// de salud agregados en Sprint 1 (EstadoSalud, ProximaVacuna, MedicacionActual).
/// </summary>
public class MascotaDtosTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    private static CrearMascotaDto DtoValido() => new()
    {
        Nombre = "Rex",
        Especie = "Perro",
        Sexo = 1
    };

    [Fact]
    public void ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(DtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void ConEstadoSaludDemasiadoLargo_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.EstadoSalud = new string('x', 31);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearMascotaDto.EstadoSalud)));
    }

    [Fact]
    public void ConProximaVacunaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.ProximaVacuna = new string('x', 101);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearMascotaDto.ProximaVacuna)));
    }

    [Fact]
    public void ConMedicacionActualDemasiadoLarga_DebeSerInvalido()
    {
        var dto = DtoValido();
        dto.MedicacionActual = new string('x', 201);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(CrearMascotaDto.MedicacionActual)));
    }

    private static ActualizarMascotaDto ActualizarDtoValido() => new()
    {
        Nombre = "Rex",
        Especie = "Perro",
        Sexo = 1
    };

    [Fact]
    public void Actualizar_ConDatosValidos_NoDebeTenerErrores()
    {
        Validate(ActualizarDtoValido()).Should().BeEmpty();
    }

    [Fact]
    public void Actualizar_ConEstadoSaludDemasiadoLargo_DebeSerInvalido()
    {
        var dto = ActualizarDtoValido();
        dto.EstadoSalud = new string('x', 31);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarMascotaDto.EstadoSalud)));
    }

    [Fact]
    public void Actualizar_ConProximaVacunaDemasiadoLarga_DebeSerInvalido()
    {
        var dto = ActualizarDtoValido();
        dto.ProximaVacuna = new string('x', 101);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarMascotaDto.ProximaVacuna)));
    }

    [Fact]
    public void Actualizar_ConMedicacionActualDemasiadoLarga_DebeSerInvalido()
    {
        var dto = ActualizarDtoValido();
        dto.MedicacionActual = new string('x', 201);

        Validate(dto).Should().Contain(r => r.MemberNames.Contains(nameof(ActualizarMascotaDto.MedicacionActual)));
    }
}