namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 7: rango de capacidad de almacenamiento segun el wireframe
/// de Registro de Almacen (Menos de 50 m2 / 50-150 / 150-500 / Mas de 500 m2).
/// Se almacena como string en la entidad.
/// </summary>
public enum CapacidadAlmacenamiento
{
    /// <summary> Menos de 50 m2 </summary>
    Menos50 = 1,

    /// <summary> 50 m2 - 150 m2 </summary>
    De50a150 = 2,

    /// <summary> 150 m2 - 500 m2 </summary>
    De150a500 = 3,

    /// <summary> Mas de 500 m2 </summary>
    Mas500 = 4
}