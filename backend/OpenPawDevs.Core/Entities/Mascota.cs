namespace OpenPawDevs.Core.Entities;

public class Mascota
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
    public int DuenioId { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
    public int? VeterinariaId { get; set; }

    public virtual Usuario? Duenio { get; set; }
    public virtual Veterinaria? Veterinaria { get; set; }
    public virtual ICollection<Expediente>? Expedientes { get; set; }
    public virtual ICollection<Cita>? Citas { get; set; }
}

