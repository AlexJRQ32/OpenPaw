using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OpenPawDevs.Core.DTOs.Auth;
using OpenPawDevs.Core.Services.Interfaces;
using OpenPawDevs.WebAPI.Controllers;
using Xunit;

namespace OpenPawDevs.Tests.Controllers;

/// <summary>
/// Tests unitarios del AuthController. Se mockea IAuthService y se invocan
/// los métodos del controlador directamente (no se levanta el pipeline de ASP.NET Core).
/// </summary>
public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _controller = new AuthController(_authServiceMock.Object);
    }

    /// <summary> Lee la propiedad 'mensaje' del objeto anónimo devuelto por el controlador. </summary>
    private static string GetMensaje(object? value)
    {
        value.Should().NotBeNull();
        var prop = value!.GetType().GetProperty("mensaje");
        prop.Should().NotBeNull("el payload del error debe incluir la propiedad 'mensaje'");
        return (string)prop!.GetValue(value)!;
    }

    private static LoginResponseDto SampleResponse() => new()
    {
        Token = "jwt.fake.token",
        RefreshToken = "refresh-fake",
        ExpiraEn = DateTime.UtcNow.AddMinutes(60)
    };

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ConDatosValidos_DebeRetornar200ConToken()
    {
        // Arrange
        var dto = new RegistrarUsuarioDto
        {
            Nombre = "Alex Roblero",
            Email = "nuevo@openpaw.com",
            Password = "S3cret!Pass"
        };

        var expected = SampleResponse();
        _authServiceMock
            .Setup(s => s.RegisterAsync(It.Is<RegistrarUsuarioDto>(
                d => d.Email == dto.Email && d.Nombre == dto.Nombre)))
            .ReturnsAsync(expected);

        // Act
        var actionResult = await _controller.RegisterAsync(dto);

        // Assert
        var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var payload = okResult.Value.Should().BeOfType<LoginResponseDto>().Subject;
        payload.Token.Should().Be(expected.Token);
        payload.RefreshToken.Should().Be(expected.RefreshToken);

        _authServiceMock.Verify(s => s.RegisterAsync(dto), Times.Once);
    }

    [Fact]
    public async Task Register_ConEmailDuplicado_DebeRetornar400()
    {
        // Arrange: el servicio lanza InvalidOperationException cuando el email ya existe
        var dto = new RegistrarUsuarioDto
        {
            Nombre = "Alex",
            Email = "duplicado@openpaw.com",
            Password = "S3cret!Pass"
        };

        _authServiceMock
            .Setup(s => s.RegisterAsync(It.IsAny<RegistrarUsuarioDto>()))
            .ThrowsAsync(new InvalidOperationException("El email ya esta registrado"));

        // Act
        var actionResult = await _controller.RegisterAsync(dto);

        // Assert
        var badRequest = actionResult.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(400);

        // El mensaje debe propagarse al cliente
        GetMensaje(badRequest.Value).Should().Be("El email ya esta registrado");

        _authServiceMock.Verify(s => s.RegisterAsync(dto), Times.Once);
    }

    [Fact]
    public async Task RegisterExpress_ConDatosValidos_DebeRetornar200ConToken()
    {
        var dto = new RegistroExpressDto
        {
            Email = "checkout@openpaw.com",
            Password = "S3cret!Pass"
        };
        var expected = SampleResponse();
        _authServiceMock
            .Setup(s => s.RegisterExpressAsync(dto))
            .ReturnsAsync(expected);

        var actionResult = await _controller.RegisterExpressAsync(dto);

        var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeSameAs(expected);
        _authServiceMock.Verify(s => s.RegisterExpressAsync(dto), Times.Once);
    }

    [Fact]
    public async Task RegisterExpress_ConEmailDuplicado_DebeRetornar400()
    {
        var dto = new RegistroExpressDto
        {
            Email = "duplicado@openpaw.com",
            Password = "S3cret!Pass"
        };
        _authServiceMock
            .Setup(s => s.RegisterExpressAsync(dto))
            .ThrowsAsync(new InvalidOperationException("El email ya esta registrado"));

        var actionResult = await _controller.RegisterExpressAsync(dto);

        var badRequest = actionResult.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(400);
        GetMensaje(badRequest.Value).Should().Be("El email ya esta registrado");
        _authServiceMock.Verify(s => s.RegisterExpressAsync(dto), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ConCredencialesCorrectas_DebeRetornar200ConToken()
    {
        // Arrange
        var dto = new LoginRequestDto
        {
            Email = "usuario@openpaw.com",
            Password = "S3cret!Pass"
        };

        var expected = SampleResponse();
        _authServiceMock
            .Setup(s => s.LoginAsync(It.Is<LoginRequestDto>(
                d => d.Email == dto.Email && d.Password == dto.Password)))
            .ReturnsAsync(expected);

        // Act
        var actionResult = await _controller.LoginAsync(dto);

        // Assert
        var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var payload = okResult.Value.Should().BeOfType<LoginResponseDto>().Subject;
        payload.Token.Should().Be(expected.Token);

        _authServiceMock.Verify(s => s.LoginAsync(dto), Times.Once);
    }

    [Fact]
    public async Task Login_ConCredencialesIncorrectas_DebeRetornar401()
    {
        // Arrange: el servicio lanza UnauthorizedAccessException
        var dto = new LoginRequestDto
        {
            Email = "usuario@openpaw.com",
            Password = "clave-mala"
        };

        _authServiceMock
            .Setup(s => s.LoginAsync(It.IsAny<LoginRequestDto>()))
            .ThrowsAsync(new UnauthorizedAccessException("Credenciales invalidas"));

        // Act
        var actionResult = await _controller.LoginAsync(dto);

        // Assert
        var unauthorized = actionResult.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorized.StatusCode.Should().Be(401);

        GetMensaje(unauthorized.Value).Should().Be("Credenciales invalidas");

        _authServiceMock.Verify(s => s.LoginAsync(dto), Times.Once);
    }
}
