namespace OpenPawDevs.Core.DTOs.Common;

public class ErrorResponseDto
{
    public string Mensaje { get; set; } = string.Empty;
    public string? Detalle { get; set; }
    public string? CodigoError { get; set; }
}
