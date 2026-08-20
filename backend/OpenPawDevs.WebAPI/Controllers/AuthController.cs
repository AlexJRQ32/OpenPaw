using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpenPawDevs.Core.DTOs.Auth;
using OpenPawDevs.Core.Services.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary> PBI 10 - Login con usuario y contrasenna </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestDto loginDto)
    {
        try
        {
            var result = await _authService.LoginAsync(loginDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    /// <summary> PBI 46 - Registro autoservicio: Clientes </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RegisterAsync([FromBody] RegistrarUsuarioDto registerDto)
    {
        try
        {
            var result = await _authService.RegisterAsync(registerDto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary> AB#107 - Registro rapido desde checkout con inicio de sesion automatico </summary>
    [HttpPost("register-express")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RegisterExpressAsync([FromBody] RegistroExpressDto registerDto)
    {
        try
        {
            var result = await _authService.RegisterExpressAsync(registerDto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary> PBI 44/PBI 47 - Login/Registro con Google </summary>
    [HttpPost("login-google")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginWithGoogleAsync([FromBody] LoginGoogleDto googleDto)
    {
        try
        {
            var result = await _authService.LoginWithGoogleAsync(googleDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    /// <summary> PBI 45/PBI 48 - Login/Registro con Facebook </summary>
    [HttpPost("login-facebook")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginWithFacebookAsync([FromBody] LoginFacebookDto facebookDto)
    {
        try
        {
            var result = await _authService.LoginWithFacebookAsync(facebookDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    /// <summary> PBI 10 - Refresh token </summary>
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshTokenRequestDto refreshDto)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(refreshDto.RefreshToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }
}

/// <summary> DTO para refresh token </summary>
public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
