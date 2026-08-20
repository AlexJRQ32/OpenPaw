namespace OpenPawDevs.Core.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime ExpiraEn { get; set; }
    public bool RequiereTelefono { get; set; }
}
