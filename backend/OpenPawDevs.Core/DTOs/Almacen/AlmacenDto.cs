namespace OpenPawDevs.Core.DTOs.Almacen;

public class AlmacenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? CedulaJuridica { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Descripcion { get; set; }
    public bool Aprobada { get; set; }
    public bool Rechazada { get; set; }
    public string? MotivoRechazo { get; set; }
    public DateTime FechaRegistro { get; set; }

    // Sprint 1 - Tarea 7: campos del wireframe de Registro de Almacen.
    public string? TipoAlmacen { get; set; }
    public string? NombreResponsable { get; set; }
    public string? CapacidadAlmacenamiento { get; set; }
    public string? ControlTemperatura { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
}
