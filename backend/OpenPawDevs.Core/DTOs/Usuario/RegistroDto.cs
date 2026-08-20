namespace OpenPawDevs.Core.DTOs.Usuario;

public class RegistroDto
{
    public string Tipo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Detalle { get; set; }
}
