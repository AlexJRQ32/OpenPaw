namespace OpenPawDevs.Core.DTOs.Mascota;

public class MascotaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public string? Raza { get; set; }
    public int Sexo { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public decimal? Peso { get; set; }
    public string? Color { get; set; }
    public string? Identificacion { get; set; }
    public string? FotoUrl { get; set; }
    public int DueñoId { get; set; }
    public string DueñoNombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
}
