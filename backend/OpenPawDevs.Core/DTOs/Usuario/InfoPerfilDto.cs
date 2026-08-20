namespace OpenPawDevs.Core.DTOs.Usuario;

public class InfoPerfilDto
{
    public string Rol { get; set; } = string.Empty;
    public int? VeterinariaId { get; set; }
    public int? AlmacenId { get; set; }
    public List<MascotaVeterinariaDto> Mascotas { get; set; } = [];
}

public class MascotaVeterinariaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public string? Raza { get; set; }
    public string? Veterinaria { get; set; }
    public string? UltimaCita { get; set; }
}
