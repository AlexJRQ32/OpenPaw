using OpenPawDevs.Core.DTOs.Auth;

namespace OpenPawDevs.Core.Services.Interfaces;

/// <summary> Servicio de autenticacion y autorizacion </summary>
public interface IAuthService
{
    /// <summary> PBI 10 - Login con usuario y contrasenna </summary>
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    
    /// <summary> PBI 46 - Registro autoservicio: Clientes </summary>
    Task<LoginResponseDto> RegisterAsync(RegistrarUsuarioDto request);

    /// <summary> AB#107 - Registro rapido desde checkout </summary>
    Task<LoginResponseDto> RegisterExpressAsync(RegistroExpressDto request);
    
    /// <summary> PBI 10 - Refresh token </summary>
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    
    /// <summary> PBI 44/PBI 47 - Login/Registro con Google </summary>
    Task<LoginResponseDto> LoginWithGoogleAsync(LoginGoogleDto request);
    
    /// <summary> PBI 45/PBI 48 - Login/Registro con Facebook </summary>
    Task<LoginResponseDto> LoginWithFacebookAsync(LoginFacebookDto request);
}
