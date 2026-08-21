using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Usuario;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/usuarios/me/redes-sociales")]
[Authorize]
public class RedesSocialesController : ControllerBase
{
    private static readonly string[] PlataformasPermitidas =
    {
        "facebook", "instagram", "twitter", "tiktok", "whatsapp", "linkedin", "github", "youtube", "website"
    };

    private readonly IRedSocialRepository _redSocialRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public RedesSocialesController(IRedSocialRepository redSocialRepository, IUsuarioRepository usuarioRepository)
    {
        _redSocialRepository = redSocialRepository;
        _usuarioRepository = usuarioRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        var userId = GetAuthenticatedUserId();
        var list = await _redSocialRepository.GetByUsuarioIdAsync(userId);
        return Ok(list.Select(r => new RedSocialDto { Id = r.Id, UsuarioId = r.UsuarioId, Plataforma = r.Plataforma, Url = r.Url }));
    }

    [HttpPut("{plataforma}")]
    public async Task<IActionResult> UpsertAsync(string plataforma, [FromBody] string? url)
    {
        if (string.IsNullOrWhiteSpace(plataforma) || !PlataformasPermitidas.Contains(plataforma, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { mensaje = $"La plataforma '{plataforma}' no es valida" });

        // Normalizar para evitar duplicados case-sensitive (ej: PUT /LinkedIn y PUT /linkedin).
        var plataformaNorm = plataforma.ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { mensaje = "La URL de la red social es obligatoria" });
        if (url.Length > 500)
            return BadRequest(new { mensaje = "La URL no puede superar los 500 caracteres" });
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest(new { mensaje = "La URL debe ser una direccion http/https valida" });

        var userId = GetAuthenticatedUserId();
        var existing = (await _redSocialRepository.GetByUsuarioIdAsync(userId))
            .FirstOrDefault(r => r.Plataforma == plataformaNorm);

        if (existing != null)
        {
            existing.Url = url;
            await _redSocialRepository.UpdateAsync(existing);
        }
        else
        {
            var nueva = new RedSocial
            {
                UsuarioId = userId,
                Plataforma = plataformaNorm,
                Url = url,
                FechaCreacion = DateTime.UtcNow,
            };
            await _redSocialRepository.AddAsync(nueva);
        }

        return NoContent();
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(idClaim!);
    }
}
