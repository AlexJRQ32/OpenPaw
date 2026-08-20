using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Pedido;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PedidosController : ControllerBase
{
    private readonly IPedidoRepository _pedidoRepository;
    private readonly IVeterinariaRepository _veterinariaRepository;

    public PedidosController(
        IPedidoRepository pedidoRepository,
        IVeterinariaRepository veterinariaRepository)
    {
        _pedidoRepository = pedidoRepository;
        _veterinariaRepository = veterinariaRepository;
    }

    private int UsuarioAutenticadoId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool EsFuncionario =>
        User.IsInRole("1") || User.IsInRole("2") || User.IsInRole("3");

    private async Task<int?> VeterinariaDelUsuarioAsync()
    {
        var vets = await _veterinariaRepository.GetByUsuarioIdAsync(UsuarioAutenticadoId);
        return vets.FirstOrDefault()?.Id;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        // Admin ve todos; Veterinaria/Almacen ven solo los de su comercio; Cliente no accede
        if (!EsFuncionario)
            return Forbid();

        var veterinariaId = await VeterinariaDelUsuarioAsync();
        if (User.IsInRole("1"))
        {
            var todos = await _pedidoRepository.GetAllAsync();
            return Ok(todos);
        }

        if (!veterinariaId.HasValue)
            return Ok(Array.Empty<Pedido>());

        var pedidos = await _pedidoRepository.GetByVeterinariaIdAsync(veterinariaId.Value);
        return Ok(pedidos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var pedido = await _pedidoRepository.GetByIdAsync(id);
        if (pedido == null)
            return NotFound(new { mensaje = $"Pedido con ID {id} no encontrado" });

        if (!EsFuncionario)
            return Forbid();

        if (!User.IsInRole("1"))
        {
            var veterinariaId = await VeterinariaDelUsuarioAsync();
            if (!veterinariaId.HasValue ||
                (pedido.VeterinariaOrigenId != veterinariaId.Value && pedido.VeterinariaDestinoId != veterinariaId.Value))
                return Forbid();
        }

        return Ok(pedido);
    }

    [HttpGet("veterinaria/{veterinariaId}")]
    public async Task<IActionResult> GetByVeterinariaAsync(int veterinariaId)
    {
        if (!EsFuncionario)
            return Forbid();

        if (!User.IsInRole("1"))
        {
            var miVeterinaria = await VeterinariaDelUsuarioAsync();
            if (miVeterinaria != veterinariaId)
                return Forbid();
        }

        var pedidos = await _pedidoRepository.GetByVeterinariaIdAsync(veterinariaId);
        return Ok(pedidos);
    }

    [HttpGet("estado/{estado}")]
    public async Task<IActionResult> GetByEstadoAsync(EstadoPedido estado)
    {
        if (!EsFuncionario)
            return Forbid();

        var veterinariaId = await VeterinariaDelUsuarioAsync();
        if (!User.IsInRole("1"))
        {
            if (!veterinariaId.HasValue)
                return Ok(Array.Empty<Pedido>());

            var pedidosComercio = await _pedidoRepository.GetByVeterinariaIdAsync(veterinariaId.Value);
            return Ok(pedidosComercio.Where(p => p.Estado == estado.ToString()));
        }

        var pedidos = await _pedidoRepository.GetByEstadoAsync(estado);
        return Ok(pedidos);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CrearPedidoDto crearDto)
    {
        if (!EsFuncionario)
            return Forbid();

        var entity = new Pedido
        {
            VeterinariaOrigenId = crearDto.VeterinariaOrigenId,
            VeterinariaDestinoId = crearDto.VeterinariaDestinoId,
            Comentario = crearDto.Comentario,
            Estado = "Pendiente",
            FechaPedido = DateTime.UtcNow,
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _pedidoRepository.AddAsync(entity);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }
}
