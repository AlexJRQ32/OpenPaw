using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.DTOs.Producto;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventarioController : ControllerBase
{
    private readonly IInventarioRepository _inventarioRepository;
    private readonly IProductoRepository _productoRepository;
    private readonly IAlmacenRepository _almacenRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public InventarioController(
        IInventarioRepository inventarioRepository,
        IProductoRepository productoRepository,
        IAlmacenRepository almacenRepository,
        IUsuarioRepository usuarioRepository)
    {
        _inventarioRepository = inventarioRepository;
        _productoRepository = productoRepository;
        _almacenRepository = almacenRepository;
        _usuarioRepository = usuarioRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllAsync()
    {
        var inventario = await _inventarioRepository.GetAllAsync();
        return Ok(inventario);
    }

    /// <summary>
    /// Inventario que el usuario autenticado puede gestionar segun su rol y comercio vinculado.
    /// - Administrador: todo el inventario
    /// - Veterinaria: inventario de los almacenes de su veterinaria
    /// - Almacen: inventario de su propio almacen
    /// </summary>
    [HttpGet("mios")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetMiosAsync()
    {
        var userId = GetAuthenticatedUserId();
        var usuario = await _usuarioRepository.GetByIdAsync(userId);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario autenticado no encontrado" });

        IReadOnlyList<Inventario> inventario;
        if (usuario.RolId == 1)
        {
            inventario = await _inventarioRepository.GetAllAsync();
        }
        else if (usuario.RolId == 3 && usuario.AlmacenId.HasValue)
        {
            inventario = await _inventarioRepository.GetByAlmacenIdAsync(usuario.AlmacenId.Value);
        }
        else if (usuario.VeterinariaId.HasValue)
        {
            var almacenes = await _almacenRepository.GetByVeterinariaIdAsync(usuario.VeterinariaId.Value);
            var almacenIds = almacenes.Select(a => a.Id).ToList();
            inventario = await _inventarioRepository.GetByAlmacenesAsync(almacenIds);
        }
        else
        {
            inventario = new List<Inventario>();
        }

        return Ok(inventario);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var inventario = await _inventarioRepository.GetByIdAsync(id);
        if (inventario == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        return Ok(inventario);
    }

    [HttpGet("almacen/{almacenId}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByAlmacenAsync(int almacenId)
    {
        var inventario = await _inventarioRepository.GetByAlmacenIdAsync(almacenId);
        return Ok(inventario);
    }

    [HttpGet("producto/{productoId}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByProductoAsync(int productoId)
    {
        var inventario = await _inventarioRepository.GetByProductoIdAsync(productoId);
        return Ok(inventario);
    }

    [HttpGet("stock-bajo")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetLowStockAsync()
    {
        var inventario = await _inventarioRepository.GetLowStockAsync();
        return Ok(inventario);
    }

    [HttpPost]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> CreateAsync([FromBody] CrearInventarioDto crearDto)
    {
        var errorStock = ValidarStock(crearDto.Cantidad, crearDto.StockMinimo, crearDto.StockMaximo);
        if (errorStock != null)
            return BadRequest(new { mensaje = errorStock });

        if (!await _productoRepository.ExistsAsync(crearDto.ProductoId))
            return BadRequest(new { mensaje = $"Producto con ID {crearDto.ProductoId} no encontrado" });

        if (!await _almacenRepository.ExistsAsync(crearDto.AlmacenId))
            return BadRequest(new { mensaje = $"Almacen con ID {crearDto.AlmacenId} no encontrado" });

        var existente = await _inventarioRepository.GetByProductoYAlmacenAsync(
            crearDto.ProductoId, crearDto.AlmacenId);
        if (existente != null)
            return Conflict(new { mensaje = "El producto ya tiene un registro en este almacen" });

        var entity = new Inventario
        {
            ProductoId = crearDto.ProductoId,
            AlmacenId = crearDto.AlmacenId,
            Cantidad = crearDto.Cantidad,
            StockMinimo = crearDto.StockMinimo,
            StockMaximo = crearDto.StockMaximo,
            FechaActualizacion = DateTime.UtcNow
        };

        try
        {
            var created = await _inventarioRepository.AddAsync(entity);
            return Created($"/api/inventario/{created.Id}", created);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { mensaje = "El producto ya tiene un registro en este almacen" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] ActualizarInventarioDto actualizarDto)
    {
        var entity = await _inventarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        var stockMinimo = actualizarDto.StockMinimo ?? entity.StockMinimo;
        var stockMaximo = actualizarDto.StockMaximo ?? entity.StockMaximo;
        var errorStock = ValidarStock(actualizarDto.Cantidad, stockMinimo, stockMaximo);
        if (errorStock != null)
            return BadRequest(new { mensaje = errorStock });

        entity.Cantidad = actualizarDto.Cantidad;
        entity.StockMinimo = stockMinimo;
        entity.StockMaximo = stockMaximo;
        entity.FechaActualizacion = DateTime.UtcNow;

        await _inventarioRepository.UpdateAsync(entity);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _inventarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        await _inventarioRepository.DeleteAsync(entity);
        return NoContent();
    }

    private static string? ValidarStock(int cantidad, int stockMinimo, int? stockMaximo)
    {
        if (cantidad < 0 || stockMinimo < 0 || stockMaximo < 0)
            return "Las cantidades de inventario no pueden ser negativas";

        if (stockMaximo.HasValue && stockMaximo.Value < stockMinimo)
            return "El stock maximo no puede ser menor que el stock minimo";

        if (stockMaximo.HasValue && cantidad > stockMaximo.Value)
            return "La cantidad no puede superar el stock maximo";

        return null;
    }

    private int GetAuthenticatedUserId()
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.Parse(idClaim!);
    }
}
