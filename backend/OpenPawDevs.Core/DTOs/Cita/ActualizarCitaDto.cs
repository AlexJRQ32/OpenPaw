using System.ComponentModel.DataAnnotations;
using OpenPawDevs.Core.Enums;

namespace OpenPawDevs.Core.DTOs.Cita;

public class ActualizarCitaDto
{
    public DateTime? FechaHora { get; set; }

    [StringLength(20)]
    public string? Estado { get; set; }

    [StringLength(20)]
    public string? TipoCita { get; set; }

    [StringLength(500)]
    public string? Servicio { get; set; }

    public CategoriaServicioVeterinario? Categoria { get; set; }

    [StringLength(1000)]
    public string? Notas { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Costo { get; set; }
}
