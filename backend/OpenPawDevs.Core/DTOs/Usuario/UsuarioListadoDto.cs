namespace OpenPawDevs.Core.DTOs.Usuario;

/// <summary>
/// DTO de listado de usuarios. Excluye campos sensibles (LicenciaMedica, TelefonoEmergencia)
/// que solo deben exponerse en el perfil propio o a administradores.
/// </summary>
public class UsuarioListadoDto
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