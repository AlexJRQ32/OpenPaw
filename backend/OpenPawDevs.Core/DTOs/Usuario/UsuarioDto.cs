namespace OpenPawDevs.Core.DTOs.Usuario;

public class UsuarioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public int RolId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string? FotoUrl { get; set; }
    public List<RedSocialDto>? RedesSociales { get; set; }
    public int? VeterinariaId { get; set; }
    public int? AlmacenId { get; set; }
    public string? ComercioNombre { get; set; }
}
