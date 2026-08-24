using OpenPawDevs.Core.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OpenPawDevs.Core.DTOs.Auth;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

namespace OpenPawDevs.Core.Services;

/// <summary> Servicio de autenticacion y autorizacion (PBI 10, 44, 45, 46, 47, 48) </summary>
public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public AuthService(IUsuarioRepository usuarioRepository, IConfiguration configuration, HttpClient httpClient)
    {
        _usuarioRepository = usuarioRepository;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var usuario = await _usuarioRepository.GetByEmailAsync(request.Email);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales invalidas");

        return await GenerateTokenAsync(usuario);
    }

    public async Task<LoginResponseDto> RegisterAsync(RegistrarUsuarioDto request)
    {
        var existing = await _usuarioRepository.GetByEmailAsync(request.Email);
        if (existing != null)
            throw new InvalidOperationException("El email ya esta registrado");

        var usuario = new Usuario
        {
            Nombre = request.Nombre,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Telefono = request.Telefono,
            Direccion = request.Direccion,
            RolId = (int)RolTipo.Cliente,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        await _usuarioRepository.AddAsync(usuario);
        return await GenerateTokenAsync(usuario);
    }

    public Task<LoginResponseDto> RegisterExpressAsync(RegistroExpressDto request)
    {
        var email = request.Email.Trim();
        var nombre = GenerarNombreDesdeEmail(email);
        return RegisterAsync(new RegistrarUsuarioDto
        {
            Nombre = nombre,
            Email = email,
            Password = request.Password
        });
    }

    private static string GenerarNombreDesdeEmail(string email)
    {
        var localPart = email.Split('@', 2)[0];
        var partes = localPart.Split(
            ['.', '_', '-', '+'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (partes.Length == 0)
            return localPart;

        return string.Join(' ', partes.Select(parte =>
            char.ToUpperInvariant(parte[0]) + parte[1..].ToLowerInvariant()));
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var usuario = await _usuarioRepository.GetByRefreshTokenAsync(refreshToken);
        if (usuario == null || usuario.RefreshTokenExpiry <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Token de refresco invalido o expirado");

        return await GenerateTokenAsync(usuario);
    }

    /// <summary> PBI 44/PBI 47 - Login/Registro con Google: Verifica token de Google, busca o crea usuario </summary>
    public async Task<LoginResponseDto> LoginWithGoogleAsync(LoginGoogleDto request)
    {
        // Verificar token con Google API (userinfo)
        var req = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
        var response = await _httpClient.SendAsync(req);
        if (!response.IsSuccessStatusCode)
            throw new UnauthorizedAccessException("Token de Google invalido");

        var googleInfo = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>();
        if (googleInfo == null || string.IsNullOrEmpty(googleInfo.Email))
            throw new UnauthorizedAccessException("No se pudo obtener informacion del token de Google");

        // Buscar usuario existente o crear uno nuevo
        var usuario = await _usuarioRepository.GetByEmailAsync(googleInfo.Email);
        if (usuario == null)
        {
            usuario = new Usuario
            {
                Nombre = googleInfo.Name ?? googleInfo.Email.Split('@')[0],
                Email = googleInfo.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                RolId = (int)RolTipo.Cliente,
                Activo = true,
                FotoUrl = googleInfo.Picture,
                FechaRegistro = DateTime.UtcNow
            };
            await _usuarioRepository.AddAsync(usuario);
        }
        else if (googleInfo.Picture != null && usuario.FotoUrl != googleInfo.Picture)
        {
            usuario.FotoUrl = googleInfo.Picture;
            await _usuarioRepository.UpdateAsync(usuario);
        }

        return await GenerateTokenAsync(usuario);
    }

    private async Task<LoginResponseDto> GenerateTokenAsync(Usuario usuario)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var jwtKey = jwtSection["Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.StartsWith("REPLACE_WITH_ENV_VAR", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Jwt:Key no configurado. Define la variable de entorno 'Jwt__Key'. Ver backend/.env.example.");
        }
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim("nombre", usuario.Nombre),
            new Claim("rol", usuario.RolId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiry = DateTime.UtcNow.AddMinutes(double.Parse(jwtSection["ExpiryMinutes"] ?? "60"));
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: credentials
        );

        var refreshToken = Guid.NewGuid().ToString();
        usuario.RefreshToken = refreshToken;
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _usuarioRepository.UpdateAsync(usuario);

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            RefreshToken = refreshToken,
            ExpiraEn = expiry,
            RequiereTelefono = string.IsNullOrWhiteSpace(usuario.Telefono)
        };
    }
}

// Modelos para respuestas de APIs externas
public class GoogleTokenInfo
{
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("picture")] public string? Picture { get; set; }
    [JsonPropertyName("sub")] public string? Sub { get; set; }
}

public class FacebookDebugResponse
{
    [JsonPropertyName("data")] public FacebookDebugData? Data { get; set; }
}

public class FacebookDebugData
{
    [JsonPropertyName("app_id")] public string? AppId { get; set; }
    [JsonPropertyName("type")] public string? Type { get; set; }
    [JsonPropertyName("application")] public string? Application { get; set; }
    [JsonPropertyName("data_access_expires_at")] public long DataAccessExpiresAt { get; set; }
    [JsonPropertyName("expires_at")] public long ExpiresAt { get; set; }
    [JsonPropertyName("is_valid")] public bool IsValid { get; set; }
    [JsonPropertyName("user_id")] public string? UserId { get; set; }
}

public class FacebookUserInfo
{
    [JsonPropertyName("id")] public string? Id { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("picture")] public FacebookPicture? Picture { get; set; }
}

public class FacebookPicture
{
    [JsonPropertyName("data")] public FacebookPictureData? Data { get; set; }
}

public class FacebookTokenExchangeResult
{
    [JsonPropertyName("access_token")] public string? AccessToken { get; set; }
    [JsonPropertyName("token_type")] public string? TokenType { get; set; }
    [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
}

public class FacebookPictureData
{
    [JsonPropertyName("height")] public int Height { get; set; }
    [JsonPropertyName("width")] public int Width { get; set; }
    [JsonPropertyName("is_silhouette")] public bool IsSilhouette { get; set; }
    [JsonPropertyName("url")] public string? Url { get; set; }
}
