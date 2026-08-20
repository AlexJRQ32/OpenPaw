namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class ActualizarAlmacenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int? VeterinariaId { get; set; }
    public string? CedulaJuridica { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? Descripcion { get; set; }
    public string? MotivoRechazo { get; set; }
    public int UsuarioId { get; set; }
    public int Tipo { get; set; }
    public bool Activo { get; set; }
    public bool Aprobada { get; set; }
    public bool Rechazada { get; set; }
    public DateTime FechaRegistro { get; set; }
}
