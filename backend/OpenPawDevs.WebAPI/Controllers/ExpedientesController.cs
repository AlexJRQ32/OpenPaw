using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Expediente;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpedientesController : ControllerBase
{
    private readonly IExpedienteRepository _expedienteRepository;
    private readonly IExpedienteCompartidoRepository _expedienteCompartidoRepository;
    private readonly IMascotaRepository _mascotaRepository;

    public ExpedientesController(
        IExpedienteRepository expedienteRepository,
        IExpedienteCompartidoRepository expedienteCompartidoRepository,
        IMascotaRepository mascotaRepository)
    {
        _expedienteRepository = expedienteRepository;
        _expedienteCompartidoRepository = expedienteCompartidoRepository;
        _mascotaRepository = mascotaRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool EsFuncionario =>
        User.IsInRole("1") || User.IsInRole("2") || User.IsInRole("3");

    private async Task<bool> MascotaEsDelUsuarioAsync(int mascotaId)
    {
        var mascota = await _mascotaRepository.GetByIdAsync(mascotaId);
        return mascota != null && mascota.DuenioId == UsuarioAutenticadoId;
    }

    [HttpGet("mascota/{mascotaId}")]
    public async Task<IActionResult> GetByMascotaAsync(int mascotaId)
    {
        if (!EsFuncionario && !await MascotaEsDelUsuarioAsync(mascotaId))
            return Forbid();

        var expedientes = await _expedienteRepository.GetByMascotaIdAsync(mascotaId);
        return Ok(expedientes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var expediente = await _expedienteRepository.GetByIdAsync(id);
        if (expediente == null)
            return NotFound(new { mensaje = $"Expediente con ID {id} no encontrado" });

        if (!EsFuncionario && !await MascotaEsDelUsuarioAsync(expediente.MascotaId))
            return Forbid();

        return Ok(expediente);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearExpedienteDto crearDto)
    {
        // Crear expediente medico: solo funcionarios (veterinaria/admin/almacen)
        if (!EsFuncionario)
            return Forbid();

        var entity = new Expediente
        {
            MascotaId = crearDto.MascotaId,
            VeterinariaId = crearDto.VeterinariaId,
            Diagnostico = crearDto.Diagnostico,
            Tratamiento = crearDto.Tratamiento,
            Observaciones = crearDto.Observaciones,
            RecetaUrl = crearDto.RecetaUrl,
            ArchivoUrl = crearDto.ArchivoUrl,
            FechaConsulta = DateTime.UtcNow,
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _expedienteRepository.AddAsync(entity);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }

    [HttpPost("compartir")]
    public async Task<IActionResult> CompartirAsync([FromBody] CompartirExpedienteDto compartirDto)
    {
        var expediente = await _expedienteRepository.GetByIdAsync(compartirDto.ExpedienteId);
        if (expediente == null)
            return NotFound(new { mensaje = $"Expediente con ID {compartirDto.ExpedienteId} no encontrado" });

        // Solo el dueno de la mascota o un funcionario puede compartir
        if (!EsFuncionario && !await MascotaEsDelUsuarioAsync(expediente.MascotaId))
            return Forbid();

        var entity = new ExpedienteCompartido
        {
            ExpedienteId = compartirDto.ExpedienteId,
            VeterinariaDestinoId = compartirDto.VeterinariaDestinoId,
            FechaCompartido = DateTime.UtcNow,
            Estado = "Pendiente"
        };

        var created = await _expedienteCompartidoRepository.AddAsync(entity);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }

    [HttpGet("compartidos/recibidos/{veterinariaId}")]
    public async Task<IActionResult> GetCompartidosRecibidosAsync(int veterinariaId)
    {
        if (!EsFuncionario)
            return Forbid();

        var expedientes = await _expedienteCompartidoRepository.GetByDestinoAsync(veterinariaId);
        return Ok(expedientes);
    }
}
