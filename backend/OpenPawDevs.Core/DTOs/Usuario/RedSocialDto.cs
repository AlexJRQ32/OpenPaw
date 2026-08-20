namespace OpenPawDevs.Core.DTOs.Usuario;

public class RedSocialDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Plataforma { get; set; } = string.Empty;
    public string? Url { get; set; }
}
