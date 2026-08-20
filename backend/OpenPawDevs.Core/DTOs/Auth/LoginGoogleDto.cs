namespace OpenPawDevs.Core.DTOs.Auth;

/// <summary> PBI 44/PBI 47 - Login/Registro con Google: Token recibido del frontend </summary>
public class LoginGoogleDto
{
    public string Token { get; set; } = string.Empty;
}
