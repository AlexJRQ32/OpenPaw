namespace OpenPawDevs.Core.DTOs.Producto;

public class InventarioDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = string.Empty;
    public int AlmacenId { get; set; }
    public string AlmacenNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int StockMinimo { get; set; }
    public int StockMaximo { get; set; }

    // Sprint 1 - Tarea 8: campos del wireframe de Inventario.
    public string? Categoria { get; set; }
    public string? Lote { get; set; }
    public string? Ubicacion { get; set; }
    public string? UnidadMedida { get; set; }

    // Fix C1 (Code Review QA): el frontend actual (InventarioPage y marketplace) consume
    // la forma ANIDADA item.producto.nombre/precio y item.almacen.nombre. Se preserva la
    // forma anidada (objetos Producto/Almacen) ademas de los campos planos existentes
    // para no romper ningun consumidor. El rediseno del contrato plano es Sprint 2.
    public ProductoResumenDto? Producto { get; set; }
    public AlmacenResumenDto? Almacen { get; set; }
}

public class ProductoResumenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public string? Categoria { get; set; }
    public string? Proveedor { get; set; }
    public string? ImagenUrl { get; set; }
    public string? UnidadMedida { get; set; }
    public bool Activo { get; set; } = true;
}

public class AlmacenResumenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int? VeterinariaId { get; set; }
    public VeterinariaResumenDto? Veterinaria { get; set; }
}

public class VeterinariaResumenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
}
