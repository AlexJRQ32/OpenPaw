namespace OpenPawDevs.Core.Entities;

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public virtual ICollection<Usuario>? Usuarios { get; set; }
}
