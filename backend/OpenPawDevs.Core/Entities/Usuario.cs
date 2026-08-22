namespace OpenPawDevs.Core.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? TelefonoEmergencia { get; set; }
    public string? Direccion { get; set; }
    public string? LicenciaMedica { get; set; }
    public DateTime? FechaIncorporacion { get; set; }
    public int RolId { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string? FotoUrl { get; set; }

    // Sprint 1 - Tarea 9: campos del wireframe de Funcionarios.
    // IdCorporativo autogenerado en el controller (prefijo por rol + secuencia, ej OP-VET-0042).
    // Estado normalizado a enum.ToString() del enum EstadoFuncionario (patron establecido tarea 7).
    public string? IdCorporativo { get; set; }
    public string? Especialidad { get; set; }
    public string? Sede { get; set; }
    public string? Estado { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public int? VeterinariaId { get; set; }
    public int? AlmacenId { get; set; }

    public virtual Rol? Rol { get; set; }
    public virtual Veterinaria? Veterinaria { get; set; }
    public virtual Almacen? Almacen { get; set; }
    public virtual ICollection<Mascota>? Mascotas { get; set; }
    public virtual ICollection<Cita>? Citas { get; set; }
    public virtual ICollection<Notificacion>? Notificaciones { get; set; }
    public virtual ICollection<RedSocial>? RedesSociales { get; set; }
}
