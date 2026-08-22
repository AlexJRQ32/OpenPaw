namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 8: categoria de inventario segun el wireframe de Inventario.
/// Se almacena como string en la entidad (patron establecido: enum en Core/Enums + string en entidad).
/// </summary>
public enum CategoriaInventario
{
    /// <summary> Antibiotico </summary>
    Antibiotico = 1,

    /// <summary> Biologicos (vacunas, sueros) </summary>
    Biologicos = 2,

    /// <summary> Quirurgico (material e instrumental) </summary>
    Quirurgico = 3,

    /// <summary> Consumibles (desechables, insumos) </summary>
    Consumibles = 4
}