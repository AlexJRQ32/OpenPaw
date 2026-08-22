namespace OpenPawDevs.Core.Entities;

/// <summary> PBI 131 - Traslado de expediente entre veterinarias </summary>
public class TrasladoExpediente
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int VeterinariaOrigenId { get; set; }
    public int VeterinariaDestinoId { get; set; }
    public string Estado { get; set; } = "Solicitado";
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    public DateTime? FechaRespuesta { get; set; }
    public int SolicitadoPorId { get; set; }
    public string? Comentario { get; set; }
    public string? MotivoRechazo { get; set; }

    // Sprint 1 - Tarea 10: campos del wireframe de Traslados (logistica de transporte).
    // Coexisten con el flujo de aprobacion existente: `Estado` (Solicitado/Aceptado/Rechazado)
    // sigue siendo el ciclo de aprobacion entre veterinarias; `EstadoLogistica`
    // (Programado/EnTransito/Completado) es un campo PARALELO de visualizacion para el
    // wireframe (mapa origen->destino, ETA, timeline de ruta). Se decide mantener ambos:
    // el backend no mezcla los dos ciclos y aceptar/rechazar queda intacto.
    public string EstadoLogistica { get; set; } = "Programado";

    // Coordenadas de las veterinarias para el mapa Leaflet punto a punto (precision decimal(10,7)).
    public decimal? OrigenLatitud { get; set; }
    public decimal? OrigenLongitud { get; set; }
    public decimal? DestinoLatitud { get; set; }
    public decimal? DestinoLongitud { get; set; }

    // Hora estimada de llegada (wireframe: "Destino -> ETA 10:15 AM") y hora de salida
    // (wireframe: "Origen -> Salida 09:30 AM").
    public DateTime? EtaLlegada { get; set; }
    public DateTime? Salida { get; set; }

    public virtual Mascota? Mascota { get; set; }
    public virtual Veterinaria? VeterinariaOrigen { get; set; }
    public virtual Veterinaria? VeterinariaDestino { get; set; }
    public virtual Usuario? SolicitadoPor { get; set; }
}
