using System.ComponentModel.DataAnnotations;
using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.DTOs.Cita;

public class CrearCitaDto
{
    [Range(1, int.MaxValue)]
    public int MascotaId { get; set; }

    [Range(1, int.MaxValue)]
    public int VeterinariaId { get; set; }

    [Range(1, int.MaxValue)]
    public int UsuarioId { get; set; }

    [Required]
    public DateTime FechaHora { get; set; }

    [Required]
    [StringLength(500)]
    public string Servicio { get; set; } = string.Empty;

    [StringLength(20)]
    public string? TipoCita { get; set; }

    public CategoriaServicioVeterinario? Categoria { get; set; }

    [StringLength(1000)]
    public string? Notas { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Costo { get; set; }
}
