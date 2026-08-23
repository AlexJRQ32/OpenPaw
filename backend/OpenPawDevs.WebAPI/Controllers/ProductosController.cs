using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenPawDevs.Core.DTOs.Producto;
using OpenPawDevs.Core.Entities;
using OpenPawDevs.Core.Interfaces;

namespace OpenPawDevs.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly IProductoRepository _productoRepository;

    public ProductosController(IProductoRepository productoRepository)
    {
        _productoRepository = productoRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllAsync()
    {
        var productos = await _productoRepository.GetAllAsync();
        return Ok(productos);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var producto = await _productoRepository.GetByIdAsync(id);
        if (producto == null)
            return NotFound(new { mensaje = $"Producto con ID {id} no encontrado" });

        return Ok(producto);
    }

    [HttpGet("buscar/{termino}")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchAsync(string termino)
    {
        var productos = await _productoRepository.SearchByNombreAsync(termino);
        return Ok(productos);
    }

    [HttpGet("categoria/{categoria}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCategoriaAsync(string categoria)
    {
        var productos = await _productoRepository.GetByCategoriaAsync(categoria);
        return Ok(productos);
    }

    [HttpPost]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> CreateAsync([FromBody] CrearProductoDto crearDto)
    {
        var entity = new Producto
        {
            Nombre = crearDto.Nombre,
            Descripcion = crearDto.Descripcion,
            Precio = crearDto.Precio,
            Categoria = crearDto.Categoria,
            Proveedor = crearDto.Proveedor,
            ImagenUrl = crearDto.ImagenUrl,
            UnidadMedida = crearDto.UnidadMedida,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var created = await _productoRepository.AddAsync(entity);
        return Created($"/api/productos/{created.Id}", created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "1,2,3")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] CrearProductoDto actualizarDto)
    {
        var entity = await _productoRepository.GetByIdAsync(id);
        if (entity == null)
            return NotFound(new { mensaje = $"Producto con ID {id} no encontrado" });

        entity.Nombre = actualizarDto.Nombre;
        entity.Descripcion = actualizarDto.Descripcion;
        entity.Precio = actualizarDto.Precio;
        entity.Categoria = actualizarDto.Categoria;
        entity.Proveedor = actualizarDto.Proveedor;
        entity.ImagenUrl = actualizarDto.ImagenUrl;
        entity.UnidadMedida = actualizarDto.UnidadMedida;

        await _productoRepository.UpdateAsync(entity);
        return NoContent();
    }
}
