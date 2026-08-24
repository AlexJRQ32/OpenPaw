namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 7: control de temperatura segun el wireframe de Registro de Almacen
/// (Sin control / Ambiente 15-25C / Cadena de frio 2-8C / Mixto).
/// Se almacena como string en la entidad.
/// </summary>
public enum ControlTemperatura
{
    /// <summary> Sin control especial </summary>
    SinControl = 1,

    /// <summary> Control de temperatura ambiente (15-25C) </summary>
    Ambiente = 2,

    /// <summary> Cadena de frio (2-8C) </summary>
    CadenaFrio = 3,

    /// <summary> Mixto (Ambiente + Frio) </summary>
    Mixto = 4
}