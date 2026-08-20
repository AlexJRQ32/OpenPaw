using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionRepository _notificacionRepository;

    public NotificacionesController(INotificacionRepository notificacionRepository)
    {
        _notificacionRepository = notificacionRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("usuario/{usuarioId}")]
    public async Task<IActionResult> GetByUsuarioAsync(int usuarioId)
    {
        if (usuarioId != UsuarioAutenticadoId)
            return Forbid();

        var notificaciones = await _notificacionRepository.GetByUsuarioIdAsync(usuarioId);
        return Ok(notificaciones);
    }

    [HttpGet("no-leidas/{usuarioId}")]
    public async Task<IActionResult> GetNoLeidasAsync(int usuarioId)
    {
        if (usuarioId != UsuarioAutenticadoId)
            return Forbid();

        var notificaciones = await _notificacionRepository.GetNoLeidasAsync(usuarioId);
        return Ok(notificaciones);
    }

    [HttpPost("marcar-leidas/{usuarioId}")]
    public async Task<IActionResult> MarkAsLeidasAsync(int usuarioId)
    {
        if (usuarioId != UsuarioAutenticadoId)
            return Forbid();

        await _notificacionRepository.MarkAsLeidasAsync(usuarioId);
        return NoContent();
    }
}
