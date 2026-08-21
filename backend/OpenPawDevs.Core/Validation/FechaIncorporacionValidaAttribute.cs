using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.Validation;

/// <summary>
/// Valida que FechaIncorporacion no sea DateTime.MinValue ni una fecha futura.
/// Rango razonable: entre el anio 1900 y hoy. Null (campo opcional) es valido.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class FechaIncorporacionValidaAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is not DateTime fecha)
            return true; // null (o ausencia del campo) es valido: actualizacion parcial

        if (fecha == DateTime.MinValue)
            return false;

        return fecha.Year >= 1900 && fecha <= DateTime.Today;
    }
}