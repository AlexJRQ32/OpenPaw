using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class ServicioVeterinarioDto
{
    public int Id { get; set; }
    public int VeterinariaId { get; set; }
    public string? VeterinariaNombre { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public CategoriaServicioVeterinario Categoria { get; set; }
    public decimal Precio { get; set; }
    public int DuracionMinutos { get; set; }
    public bool Activo { get; set; }
}
