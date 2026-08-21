using System.ComponentModel.DataAnnotations;
using OpenPawDevs.Core.Validation;

namespace OpenPawDevs.Core.DTOs.Usuario;

public class ActualizarUsuarioDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    private string? _telefono;

    [RegularExpression(@"^[0-9+\-()]{8,15}$", ErrorMessage = "El teléfono debe tener entre 8 y 15 caracteres y solo puede contener números, '+', '-' y '(' o ')'.")]
    public string? Telefono
    {
        get => _telefono;
        set => _telefono = string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private string? _telefonoEmergencia;

    [RegularExpression(@"^[0-9+\-()]{8,15}$", ErrorMessage = "El teléfono de emergencia debe tener entre 8 y 15 caracteres y solo puede contener números, '+', '-' y '(' o ')'.")]
    public string? TelefonoEmergencia
    {
        get => _telefonoEmergencia;
        set => _telefonoEmergencia = string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public string? Direccion { get; set; }

    [StringLength(100)]
    public string? LicenciaMedica { get; set; }

    [FechaIncorporacionValida(ErrorMessage = "La fecha de incorporación debe estar entre 1900 y la fecha actual.")]
    public DateTime? FechaIncorporacion { get; set; }

    [Url(ErrorMessage = "La foto de perfil debe ser una URL válida.")]
    [StringLength(500)]
    public string? FotoUrl { get; set; }

}