using System.ComponentModel.DataAnnotations;

namespace OpenPawDevs.Core.DTOs.Usuario;

/// <summary> PBI 53 - Gestión de funcionarios: cambio de rol de un funcionario </summary>
public class CambiarRolDto
{
    /// <summary> 1=Administrador, 2=Veterinaria, 3=Almacen (Cliente no aplica a funcionarios) </summary>
    [Range(1, 3)]
    public int RolId { get; set; }
}
