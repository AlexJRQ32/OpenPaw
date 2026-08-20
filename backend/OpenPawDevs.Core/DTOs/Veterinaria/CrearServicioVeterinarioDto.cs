using System.ComponentModel.DataAnnotations;
using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

public class CrearServicioVeterinarioDto
{
    [Range(1, int.MaxValue)]
    public int VeterinariaId { get; set; }

    [Required]
    [StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [EnumDataType(typeof(CategoriaServicioVeterinario))]
    public CategoriaServicioVeterinario Categoria { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Precio { get; set; }

    [Range(1, 1440)]
    public int DuracionMinutos { get; set; }
}
