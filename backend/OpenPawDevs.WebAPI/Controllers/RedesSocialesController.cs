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
        var plataformasPermitidas = new[] { "facebook", "instagram", "twitter", "tiktok", "whatsapp" };
        if (!plataformasPermitidas.Contains(plataforma, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { mensaje = $"La plataforma '{plataforma}' no es valida" });

        var userId = GetAuthenticatedUserId();
        var existing = (await _redSocialRepository.GetByUsuarioIdAsync(userId))
            .FirstOrDefault(r => r.Plataforma == plataforma);

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
                Plataforma = plataforma,
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
