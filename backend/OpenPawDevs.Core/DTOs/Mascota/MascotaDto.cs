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
    public string EstadoSalud { get; set; } = "Saludable";
    public string? ProximaVacuna { get; set; }
    public DateTime? ProximaVacunaFecha { get; set; }
    public string? MedicacionActual { get; set; }
    public DateTime? ProximaMedicacionFecha { get; set; }
    public int DueñoId { get; set; }
    public string DueñoNombre { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public int? VeterinariaId { get; set; }
    public bool Activo { get; set; }
}
