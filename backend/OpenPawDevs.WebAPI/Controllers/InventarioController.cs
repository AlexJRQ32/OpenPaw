using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.DTOs.Producto;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Enums;
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
    [Authorize]
    public async Task<IActionResult> GetAllAsync()
    {
        var inventario = await _inventarioRepository.GetAllAsync();
        return Ok(inventario.Select(InventarioMapeo.ToDto));
    }

    /// <summary>
    /// Deuda #70: endpoint público para marketplace con DTO mínimo (producto+precio+stock).
    /// [AllowAnonymous] para que el marketplace anónimo consuma sin token, sin exponer DTO interno.
    /// </summary>
    [HttpGet("publico")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicoAsync()
    {
        var inventario = await _inventarioRepository.GetAllAsync();
        // Solo stock disponible + producto activo; mapeo mínimo público
        var publico = inventario
            .Where(i => i.Cantidad > 0 && i.Producto != null && i.Producto.Activo)
            .Select(InventarioMapeo.ToPublicoDto);
        return Ok(publico);
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

        return Ok(inventario.Select(InventarioMapeo.ToDto));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var inventario = await _inventarioRepository.GetByIdAsync(id);
        if (inventario == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        // Fix A3 (Code Review QA): lectura con verificacion de propiedad
        // (admin o dueno del almacen; ajeno -> 403).
        if (!await PuedeModificarAsync(inventario))
            return Forbid();

        return Ok(InventarioMapeo.ToDto(inventario));
    }

    [HttpGet("almacen/{almacenId}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByAlmacenAsync(int almacenId)
    {
        // Fix A3: admin siempre; rol 2/3 solo si el almacen le pertenece.
        var accesibles = await ObtenerAlmacenesAccesiblesAsync();
        if (accesibles != null && !accesibles.Contains(almacenId))
            return Forbid();

        var inventario = await _inventarioRepository.GetByAlmacenIdAsync(almacenId);
        return Ok(inventario.Select(InventarioMapeo.ToDto));
    }

    [HttpGet("producto/{productoId}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetByProductoAsync(int productoId)
    {
        var inventario = await _inventarioRepository.GetByProductoIdAsync(productoId);

        // Fix A3: admin ve todo; rol 2/3 solo el inventario de sus almacenes
        // (si hay registros pero ninguno accesible -> 403).
        var accesibles = await ObtenerAlmacenesAccesiblesAsync();
        if (accesibles == null)
            return Ok(inventario.Select(InventarioMapeo.ToDto));

        var visibles = inventario.Where(i => accesibles.Contains(i.AlmacenId)).ToList();
        if (inventario.Count > 0 && visibles.Count == 0)
            return Forbid();

        return Ok(visibles.Select(InventarioMapeo.ToDto));
    }

    [HttpGet("stock-bajo")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> GetLowStockAsync()
    {
        var inventario = await _inventarioRepository.GetLowStockAsync();

        // Fix A3: admin ve todo; rol 2/3 solo el stock bajo de sus almacenes.
        var accesibles = await ObtenerAlmacenesAccesiblesAsync();
        if (accesibles == null)
            return Ok(inventario.Select(InventarioMapeo.ToDto));

        var visibles = inventario.Where(i => accesibles.Contains(i.AlmacenId)).ToList();
        if (inventario.Count > 0 && visibles.Count == 0)
            return Forbid();

        return Ok(visibles.Select(InventarioMapeo.ToDto));
    }

    [HttpPost]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> CreateAsync([FromBody] CrearInventarioDto crearDto)
    {
        // Guard defensivo: el filtro [ApiController] normalmente valida antes del action,
        // pero garantiza que un DTO invalido devuelva 400 y nunca llegue a la BD.
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Sprint 1 - Tarea 8: validacion de Categoria (string legible del wireframe).
        // Enum.TryParse("999", ...) devuelve true; sin IsDefined se persistiria un valor invalido.
        // Tras el TryParse exitoso + IsDefined se normaliza SIEMPRE a la forma canonica
        // (enum.ToString()) para que la BD nunca reciba "2", "antibiotico", "ANTIBIOTICO", etc.
        var errorCategoria = ValidarNormalizarCategoria(crearDto.Categoria, out var categoriaNormalizada);
        if (errorCategoria != null)
            return BadRequest(new { mensaje = errorCategoria });

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
            Categoria = categoriaNormalizada,
            Lote = crearDto.Lote,
            Ubicacion = crearDto.Ubicacion,
            UnidadMedida = crearDto.UnidadMedida,
            FechaActualizacion = DateTime.UtcNow
        };

        try
        {
            var created = await _inventarioRepository.AddAsync(entity);
            return Created($"/api/inventario/{created.Id}", InventarioMapeo.ToDto(created));
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
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var entity = await _inventarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        // Control de acceso (previene IDOR): el endpoint admite roles "1,2,3"
        // (admin, veterinaria, almacen), pero solo un administrador (rol "1") o el dueno
        // del almacen al que pertenece el registro (o de la veterinaria que posee ese almacen)
        // pueden modificarlo. Sin este guard, un rol 2/3 autenticado podria editar
        // inventario ajeno (IDOR). Patron de las tareas 6 y 7.
        if (!await PuedeModificarAsync(entity))
            return Forbid();

        // Sprint 1 - Tarea 8: validacion de Categoria con normalizacion a forma canonica.
        if (actualizarDto.Categoria != null)
        {
            var errorCategoria = ValidarNormalizarCategoria(actualizarDto.Categoria, out var categoriaNormalizada);
            if (errorCategoria != null)
                return BadRequest(new { mensaje = errorCategoria });

            actualizarDto.Categoria = categoriaNormalizada;
        }

        var stockMinimo = actualizarDto.StockMinimo ?? entity.StockMinimo;
        var stockMaximo = actualizarDto.StockMaximo ?? entity.StockMaximo;
        // Fix M1 (Code Review QA): Cantidad anulable; si no viene, se valida contra el
        // valor actual (el update parcial la preserva).
        var cantidad = actualizarDto.Cantidad ?? entity.Cantidad;
        var errorStock = ValidarStock(cantidad, stockMinimo, stockMaximo);
        if (errorStock != null)
            return BadRequest(new { mensaje = errorStock });

        // Update parcial: null en el DTO preserva el valor actual (no borra campos no enviados);
        // cadena vacia ("") si sobrescribe el campo.
        InventarioMapeo.AplicarActualizacion(entity, actualizarDto);
        entity.FechaActualizacion = DateTime.UtcNow;

        await _inventarioRepository.UpdateAsync(entity);
        return Ok(InventarioMapeo.ToDto(entity));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var entity = await _inventarioRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Inventario con ID {id} no encontrado" });

        // Fix A1 (Code Review QA): mismo guard anti-IDOR del PUT. Sin esto, un rol 2/3
        // autenticado podria eliminar inventario ajeno (IDOR).
        if (!await PuedeModificarAsync(entity))
            return Forbid();

        await _inventarioRepository.DeleteAsync(entity);
        return NoContent();
    }

    /// <summary>
    /// Sprint 1 - Tarea 8: valida Categoria contra el enum CategoriaInventario y devuelve
    /// la forma canonica (enum.ToString()). null es valido (campo opcional).
    /// </summary>
    private static string? ValidarNormalizarCategoria(string? categoria, out string? categoriaNormalizada)
    {
        categoriaNormalizada = null;
        if (categoria == null)
            return null;

        if (!Enum.TryParse<CategoriaInventario>(categoria, true, out var parsed)
            || !Enum.IsDefined(typeof(CategoriaInventario), parsed))
            return "Categoria no valida (use Antibiotico, Biologicos, Quirurgico o Consumibles)";

        categoriaNormalizada = parsed.ToString();
        return null;
    }

    /// <summary>
    /// Control de acceso del PUT/DELETE y de los GETs de lectura (fix A1/A3): administrador
    /// (rol "1") siempre puede; en otro caso solo el dueno del almacen (rol "3" con su
    /// AlmacenId) o de la veterinaria que posee el almacen (rol "2").
    /// Devuelve null = acceso total (admin); si no, el conjunto de AlmacenIds accesibles.
    /// </summary>
    private async Task<HashSet<int>?> ObtenerAlmacenesAccesiblesAsync()
    {
        if (User.IsInRole("1"))
            return null; // admin: todos los almacenes

        var usuario = await _usuarioRepository.GetByIdAsync(GetAuthenticatedUserId());
        if (usuario == null)
            return new HashSet<int>();

        if (usuario.RolId == 3)
        {
            return usuario.AlmacenId.HasValue
                ? new HashSet<int> { usuario.AlmacenId.Value }
                : new HashSet<int>();
        }

        if (usuario.RolId == 2 && usuario.VeterinariaId.HasValue)
        {
            var almacenes = await _almacenRepository.GetByVeterinariaIdAsync(usuario.VeterinariaId.Value);
            return almacenes.Select(a => a.Id).ToHashSet();
        }

        return new HashSet<int>();
    }

    private async Task<bool> PuedeModificarAsync(Inventario entity)
    {
        var accesibles = await ObtenerAlmacenesAccesiblesAsync();
        return accesibles == null || accesibles.Contains(entity.AlmacenId);
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