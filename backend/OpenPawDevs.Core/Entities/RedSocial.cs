namespace OpenPawDevs.Core.Entities;

public class RedSocial
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Plataforma { get; set; } = string.Empty;
    public string? Url { get; set; }
    public DateTime FechaCreacion { get; set; }

    public Usuario? Usuario { get; set; }
}
