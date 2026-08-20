namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class VeterinariaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Horario { get; set; }
    public string? LogoUrl { get; set; }
    public string? CedulaJuridica { get; set; }
    public string? Descripcion { get; set; }
    public int UsuarioId { get; set; }
    public bool Activo { get; set; }
    public bool Aprobada { get; set; }
    public bool Rechazada { get; set; }
    public string? MotivoRechazo { get; set; }
    public string? DocumentoPersoneriaJuridica { get; set; }
    public DateTime FechaRegistro { get; set; }
}
