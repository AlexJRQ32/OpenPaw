using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Moq;
using OpenPawDevs.Core.DTOs.Auth;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Core.Services;
using Xunit;

namespace OpenPawDevs.Tests.Services;

/// <summary>
/// Tests unitarios del AuthService. Se mockea IUsuarioRepository, IConfiguration
/// y un HttpMessageHandler falso para simular las llamadas a Google/Facebook.
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
    private readonly IConfiguration _configuration;
    private readonly FakeHttpMessageHandler _httpHandler = new();

    public AuthServiceTests()
    {
        var configValues = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "OpenPawDevsSuperSecretKey2026!Minimum32Chars!",
            ["Jwt:Issuer"] = "OpenPawDevs.Test",
            ["Jwt:Audience"] = "OpenPawDevs.Test.Audience",
            ["Jwt:ExpiryMinutes"] = "60"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
    }

    private AuthService CreateSut() => new(_usuarioRepoMock.Object, _configuration, new HttpClient(_httpHandler));

    [Fact]
    public async Task RefreshTokenAsync_ConTokenValido_DebeGenerarNuevoToken()
    {
        var refreshToken = Guid.NewGuid().ToString();
        _usuarioRepoMock.Setup(r => r.GetByRefreshTokenAsync(refreshToken))
            .ReturnsAsync(new Usuario
            {
                Id = 1,
                Email = "test@test.com",
                Nombre = "Test",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("x"),
                RolId = (int)RolTipo.Cliente,
                Activo = true,
                RefreshToken = refreshToken,
                RefreshTokenExpiry = DateTime.UtcNow.AddDays(1)
            });

        var result = await CreateSut().RefreshTokenAsync(refreshToken);

        result.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        _usuarioRepoMock.Verify(r => r.GetByRefreshTokenAsync(refreshToken), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_ConTokenInexistente_DebeLanzarUnauthorized()
    {
        _usuarioRepoMock.Setup(r => r.GetByRefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((Usuario?)null);

        var act = async () => await CreateSut().RefreshTokenAsync("token-falso");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ConTokenExpirado_DebeLanzarUnauthorized()
    {
        var refreshToken = Guid.NewGuid().ToString();
        _usuarioRepoMock.Setup(r => r.GetByRefreshTokenAsync(refreshToken))
            .ReturnsAsync(new Usuario
            {
                Id = 1,
                Email = "test@test.com",
                Nombre = "Test",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("x"),
                RolId = (int)RolTipo.Cliente,
                Activo = true,
                RefreshToken = refreshToken,
                RefreshTokenExpiry = DateTime.UtcNow.AddMinutes(-1)
            });

        var act = async () => await CreateSut().RefreshTokenAsync(refreshToken);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ─────────────────────────────────────────────────────────────
    // RegisterAsync
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task RegisterAsync_ConEmailNuevo_DebeCrearUsuarioYDevolverToken()
    {
        // Arrange: no existe previamente
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((Usuario?)null);

        _usuarioRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Usuario>()))
            .Callback<Usuario>(u => u.Id = 42)
            .ReturnsAsync((Usuario u) => u);

        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        var dto = new RegistrarUsuarioDto
        {
            Nombre = "Alex Roblero",
            Email = "nuevo@openpaw.com",
            Password = "S3cret!Pass",
            Telefono = "8888-8888",
            Direccion = "Heredia"
        };

        var sut = CreateSut();

        // Act
        var result = await sut.RegisterAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.ExpiraEn.Should().BeAfter(DateTime.UtcNow);

        _usuarioRepoMock.Verify(r => r.AddAsync(It.Is<Usuario>(
            u => u.Email == dto.Email
                 && u.Nombre == dto.Nombre
                 && u.RolId == (int)RolTipo.Cliente
                 && u.Activo)), Times.Once);

        // GenerateTokenAsync también persiste el refresh token
        _usuarioRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_ConEmailExistente_DebeLanzarInvalidOperationException()
    {
        // Arrange: ya existe un usuario con ese email
        var existente = new Usuario
        {
            Id = 1,
            Email = "ya@openpaw.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("cualquiera")
        };
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("ya@openpaw.com"))
            .ReturnsAsync(existente);

        var dto = new RegistrarUsuarioDto
        {
            Nombre = "Alex",
            Email = "ya@openpaw.com",
            Password = "S3cret!Pass"
        };

        var sut = CreateSut();

        // Act
        var act = async () => await sut.RegisterAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("El email ya esta registrado");

        _usuarioRepoMock.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task RegisterExpressAsync_ConDatosValidos_DebeCrearUsuarioYDevolverToken()
    {
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("checkout@openpaw.com"))
            .ReturnsAsync((Usuario?)null);
        _usuarioRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Usuario>()))
            .Callback<Usuario>(u => u.Id = 77)
            .ReturnsAsync((Usuario u) => u);
        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.RegisterExpressAsync(new RegistroExpressDto
        {
            Email = "checkout@openpaw.com",
            Password = "S3cret!Pass"
        });

        result.Token.Should().NotBeNullOrWhiteSpace();
        _usuarioRepoMock.Verify(r => r.AddAsync(It.Is<Usuario>(u =>
            u.Email == "checkout@openpaw.com"
            && u.Nombre == "Checkout"
            && u.RolId == (int)RolTipo.Cliente)), Times.Once);
    }

    [Fact]
    public async Task RegisterExpressAsync_DebeNormalizarEmailYNombreDerivado()
    {
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("maria.lopez-test@openpaw.com"))
            .ReturnsAsync((Usuario?)null);
        _usuarioRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Usuario>()))
            .Callback<Usuario>(u => u.Id = 78)
            .ReturnsAsync((Usuario u) => u);
        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        await CreateSut().RegisterExpressAsync(new RegistroExpressDto
        {
            Email = "  maria.lopez-test@openpaw.com  ",
            Password = "S3cret!Pass"
        });

        _usuarioRepoMock.Verify(r => r.AddAsync(It.Is<Usuario>(u =>
            u.Email == "maria.lopez-test@openpaw.com"
            && u.Nombre == "Maria Lopez Test")), Times.Once);
    }

    [Fact]
    public async Task RegisterExpressAsync_ConEmailExistente_DebeLanzarInvalidOperationException()
    {
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("duplicado@openpaw.com"))
            .ReturnsAsync(new Usuario { Id = 1, Email = "duplicado@openpaw.com" });

        var act = async () => await CreateSut().RegisterExpressAsync(new RegistroExpressDto
        {
            Email = "duplicado@openpaw.com",
            Password = "S3cret!Pass"
        });

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("El email ya esta registrado");
        _usuarioRepoMock.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }

    // ─────────────────────────────────────────────────────────────
    // LoginAsync
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ConCredencialesCorrectas_DebeDevolverToken()
    {
        // Arrange
        var password = "S3cret!Pass";
        var usuario = new Usuario
        {
            Id = 7,
            Email = "login@openpaw.com",
            Nombre = "Login User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            RolId = (int)RolTipo.Cliente,
            Activo = true
        };

        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("login@openpaw.com"))
            .ReturnsAsync(usuario);

        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        var dto = new LoginRequestDto { Email = "login@openpaw.com", Password = password };

        var sut = CreateSut();

        // Act
        var result = await sut.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();

        _usuarioRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ConCredencialesIncorrectas_DebeLanzarUnauthorizedAccess()
    {
        // Arrange
        var usuario = new Usuario
        {
            Id = 7,
            Email = "login@openpaw.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("S3cret!Pass"),
            RolId = (int)RolTipo.Cliente,
            Activo = true
        };

        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("login@openpaw.com"))
            .ReturnsAsync(usuario);

        var dto = new LoginRequestDto { Email = "login@openpaw.com", Password = "clave-mala" };

        var sut = CreateSut();

        // Act
        var act = async () => await sut.LoginAsync(dto);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Credenciales invalidas");
    }

    [Fact]
    public async Task LoginAsync_ConUsuarioInexistente_DebeLanzarUnauthorizedAccess()
    {
        // Arrange
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("noexiste@openpaw.com"))
            .ReturnsAsync((Usuario?)null);

        var dto = new LoginRequestDto { Email = "noexiste@openpaw.com", Password = "x" };

        var sut = CreateSut();

        // Act
        var act = async () => await sut.LoginAsync(dto);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Credenciales invalidas");
    }

    // ─────────────────────────────────────────────────────────────
    // LoginWithGoogleAsync
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginWithGoogleAsync_ConTokenValido_DebeCrearUsuarioSiNoExiste()
    {
        // Arrange: la API de Google contesta 200 con userinfo
        var googlePayload = new
        {
            email = "google.user@gmail.com",
            name = "Google User",
            picture = "https://lh3.googleusercontent.com/avatar.png",
            sub = "google-sub-123"
        };
        _httpHandler.SetResponse(HttpStatusCode.OK,
            System.Text.Json.JsonSerializer.Serialize(googlePayload),
            "application/json");

        // El usuario NO existe previamente -> debe crear
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("google.user@gmail.com"))
            .ReturnsAsync((Usuario?)null);

        _usuarioRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Usuario>()))
            .Callback<Usuario>(u => u.Id = 99)
            .ReturnsAsync((Usuario u) => u);

        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        var dto = new LoginGoogleDto { Token = "google-access-token-falso" };
        var sut = CreateSut();

        // Act
        var result = await sut.LoginWithGoogleAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();

        _usuarioRepoMock.Verify(r => r.AddAsync(It.Is<Usuario>(
            u => u.Email == "google.user@gmail.com"
                 && u.Nombre == "Google User"
                 && u.FotoUrl == "https://lh3.googleusercontent.com/avatar.png"
                 && u.RolId == (int)RolTipo.Cliente)), Times.Once);

        // GenerateTokenAsync persiste el refresh token
        _usuarioRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.Once);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_ConTokenValido_DebeReusarUsuarioSiExiste()
    {
        // Arrange: Google contesta OK
        var googlePayload = new
        {
            email = "ya@openpaw.com",
            name = "Ya Existente",
            picture = "https://lh3.googleusercontent.com/updated.png"
        };
        _httpHandler.SetResponse(HttpStatusCode.OK,
            System.Text.Json.JsonSerializer.Serialize(googlePayload),
            "application/json");

        var existente = new Usuario
        {
            Id = 1,
            Email = "ya@openpaw.com",
            Nombre = "Ya Existente",
            PasswordHash = "hash",
            FotoUrl = "https://lh3.googleusercontent.com/vieja.png"
        };

        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("ya@openpaw.com"))
            .ReturnsAsync(existente);

        _usuarioRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Usuario>()))
            .Returns(Task.CompletedTask);

        var dto = new LoginGoogleDto { Token = "google-token" };
        var sut = CreateSut();

        // Act
        var result = await sut.LoginWithGoogleAsync(dto);

        // Assert: no se creó usuario nuevo, solo se actualizó la foto
        result.Token.Should().NotBeNullOrWhiteSpace();
        _usuarioRepoMock.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
        existente.FotoUrl.Should().Be("https://lh3.googleusercontent.com/updated.png");
        _usuarioRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Usuario>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_ConTokenInvalido_DebeLanzarUnauthorizedAccess()
    {
        // Arrange: Google contesta 401
        _httpHandler.SetResponse(HttpStatusCode.Unauthorized, "", "text/plain");

        var dto = new LoginGoogleDto { Token = "token-malo" };
        var sut = CreateSut();

        // Act
        var act = async () => await sut.LoginWithGoogleAsync(dto);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Token de Google invalido");

        _usuarioRepoMock.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);
    }
}

/// <summary>
/// HttpMessageHandler falso para inyectar respuestas de Google/Facebook
/// sin tocar la red real.
/// </summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private HttpStatusCode _statusCode = HttpStatusCode.OK;
    private string _content = "";
    private string _contentType = "application/json";

    public void SetResponse(HttpStatusCode statusCode, string content, string contentType = "application/json")
    {
        _statusCode = statusCode;
        _content = content;
        _contentType = contentType;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(_statusCode)
        {
            Content = new StringContent(_content, System.Text.Encoding.UTF8, _contentType)
        };
        return Task.FromResult(response);
    }
}
