namespace OpenPawDevs.Core.DTOs.Auth;

/// <summary> PBI 45/PBI 48 - Login/Registro con Facebook: Token recibido del frontend </summary>
public class LoginFacebookDto
{
    public string Token { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? Code { get; set; }
}

