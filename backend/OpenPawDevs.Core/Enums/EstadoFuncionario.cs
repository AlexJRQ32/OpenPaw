namespace OpenPawDevs.Core.Enums;

/// <summary>
/// Sprint 1 - Tarea 9: estado del funcionario segun el wireframe de Funcionarios
/// (columna Estado: "Activo" con dot verde, "Vacaciones" con dot gris, ademas del Inactivo).
/// Se almacena como string en la entidad (patron establecido: enum en Core/Enums + string en entidad).
/// </summary>
public enum EstadoFuncionario
{
    /// <summary> Activo </summary>
    Activo = 1,

    /// <summary> Vacaciones </summary>
    Vacaciones = 2,

    /// <summary> Inactivo </summary>
    Inactivo = 3
}