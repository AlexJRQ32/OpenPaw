namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 7: tipo de almacen segun el wireframe de Registro de Almacen.
/// Se almacena como string en la entidad (patron establecido: enum en Core/Enums + string en entidad).
/// </summary>
public enum TipoAlmacen
{
    /// <summary> Interno (Anexo a clinica) </summary>
    Interno = 1,

    /// <summary> Externo (Independiente) </summary>
    Externo = 2,

    /// <summary> Centro de Distribucion </summary>
    CentroDistribucion = 3
}