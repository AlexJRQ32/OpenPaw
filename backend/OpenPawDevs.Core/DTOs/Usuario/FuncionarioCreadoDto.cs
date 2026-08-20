namespace OpenPawDevs.Core.DTOs.Usuario;

/// <summary>
/// PBI 53 - Respuesta al crear un funcionario: incluye la contraseña temporal
/// una única vez para que el administrador se la comparta (no hay servicio de email todavía).
/// </summary>
public class FuncionarioCreadoDto
{
    public UsuarioDto Usuario { get; set; } = null!;
    public string PasswordTemporal { get; set; } = string.Empty;
}
