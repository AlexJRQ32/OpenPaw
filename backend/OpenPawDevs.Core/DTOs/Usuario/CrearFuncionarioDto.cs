using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Usuario;

public class CrearFuncionarioDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Range(1, 3)]
    public int RolId { get; set; }

    public int? ComercioId { get; set; }

    // Deuda #82: tipo del comercio para desambiguar vet-{id} vs alm-{id} (colisión ids 1-4 vs 2,3).
    // Valores aceptados: "veterinaria"/"vet" | "almacen"/"alm" (case-insensitive). Null = legacy (fallback vet→alm).
    public string? TipoComercio { get; set; }

    // Sprint 1 - Tarea 9: campos del wireframe de Funcionarios.
    // IdCorporativo se autogenera en el controller (prefijo por rol + secuencia), no se acepta del cliente.
    // Estado es un string legible validado en el controller con Enum.TryParse+IsDefined
    // (Activo | Vacaciones | Inactivo) y normalizado a enum.ToString(); null = "Activo".
    [StringLength(100)]
    public string? Especialidad { get; set; }

    [StringLength(60)]
    public string? Sede { get; set; }

    [StringLength(20)]
    public string? Estado { get; set; }
}
