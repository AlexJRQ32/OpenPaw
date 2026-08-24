using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Core.DTOs.Producto;

/// <summary>
/// Sprint 1 - Tarea 8: mapeo compartido entre entidad <see cref="Inventario"/> y DTOs.
/// Centralizado para que el controller y los tests usen la misma logica.
/// </summary>
public static class InventarioMapeo
{
    public static InventarioDto ToDto(Inventario i)
    {
        return new InventarioDto
        {
            Id = i.Id,
            ProductoId = i.ProductoId,
            ProductoNombre = i.Producto?.Nombre ?? string.Empty,
            AlmacenId = i.AlmacenId,
            AlmacenNombre = i.Almacen?.Nombre ?? string.Empty,
            Cantidad = i.Cantidad,
            StockMinimo = i.StockMinimo,
            StockMaximo = i.StockMaximo ?? 0,
            Categoria = i.Categoria,
            Lote = i.Lote,
            Ubicacion = i.Ubicacion,
            UnidadMedida = i.UnidadMedida,
            // Fix C1 (Code Review QA): forma anidada que consume el frontend actual.
            Producto = i.Producto == null ? null : new ProductoResumenDto
            {
                Id = i.Producto.Id,
                Nombre = i.Producto.Nombre,
                Descripcion = i.Producto.Descripcion,
                Precio = i.Producto.Precio,
                Categoria = i.Producto.Categoria,
                Proveedor = i.Producto.Proveedor,
                ImagenUrl = i.Producto.ImagenUrl,
                UnidadMedida = i.Producto.UnidadMedida,
                Activo = i.Producto.Activo
            },
            Almacen = i.Almacen == null ? null : new AlmacenResumenDto
            {
                Id = i.Almacen.Id,
                Nombre = i.Almacen.Nombre,
                VeterinariaId = i.Almacen.VeterinariaId,
                Veterinaria = i.Almacen.Veterinaria == null ? null : new VeterinariaResumenDto
                {
                    Id = i.Almacen.Veterinaria.Id,
                    Nombre = i.Almacen.Veterinaria.Nombre
                }
            }
        };
    }

    /// <summary>
    /// Deuda #70: DTO público mínimo para marketplace (solo producto+precio+stock).
    /// No expone StockMinimo/Maximo, Lote, Ubicacion ni IDs internos sensibles.
    /// </summary>
    public static InventarioPublicoDto ToPublicoDto(Inventario i)
    {
        return new InventarioPublicoDto
        {
            InventarioId = i.Id,
            ProductoId = i.ProductoId,
            Nombre = i.Producto?.Nombre ?? string.Empty,
            Precio = i.Producto?.Precio ?? 0m,
            Stock = i.Cantidad,
            ImagenUrl = i.Producto?.ImagenUrl,
            Categoria = i.Producto?.Categoria,
            AlmacenNombre = i.Almacen?.Nombre,
            VeterinariaId = i.Almacen?.VeterinariaId,
            VeterinariaNombre = i.Almacen?.Veterinaria?.Nombre
        };
    }

    /// <summary>
    /// Actualizacion parcial: null en el DTO preserva el valor actual de la entidad;
    /// cadena vacia ("") si sobrescribe el campo.
    /// </summary>
    public static void AplicarActualizacion(Inventario entity, ActualizarInventarioDto dto)
    {
        // Fix M1 (Code Review QA): Cantidad anulable en el DTO; null preserva el valor actual.
        if (dto.Cantidad.HasValue)
            entity.Cantidad = dto.Cantidad.Value;

        if (dto.StockMinimo.HasValue)
            entity.StockMinimo = dto.StockMinimo.Value;

        if (dto.StockMaximo.HasValue)
            entity.StockMaximo = dto.StockMaximo.Value;

        // Sprint 1 - Tarea 8: campos del wireframe (update parcial, null preserva).
        if (dto.Categoria != null)
            entity.Categoria = dto.Categoria;
        if (dto.Lote != null)
            entity.Lote = dto.Lote;
        if (dto.Ubicacion != null)
            entity.Ubicacion = dto.Ubicacion;
        if (dto.UnidadMedida != null)
            entity.UnidadMedida = dto.UnidadMedida;
    }
}