using ActualizarAlmacenDto = OpenPawDevs.Core.DTOs.Veterinaria.ActualizarAlmacenDto;
using AlmacenEntity = OpenPawDevs.Core.Entities.Almacen;

namespace OpenPawDevs.Core.DTOs.Almacen;

/// <summary>
/// Sprint 1 - Tarea 7: mapeo compartido entre entidad <see cref="AlmacenEntity"/> y DTOs.
/// Centralizado para que el controller y los tests usen la misma logica.
/// </summary>
public static class AlmacenMapeo
{
    public static AlmacenDto ToDto(AlmacenEntity a)
    {
        return new AlmacenDto
        {
            Id = a.Id,
            Nombre = a.Nombre,
            CedulaJuridica = a.CedulaJuridica,
            Direccion = a.Direccion,
            Telefono = a.Telefono,
            Email = a.Email,
            Descripcion = a.Descripcion,
            Aprobada = a.Aprobada,
            Rechazada = a.Rechazada,
            MotivoRechazo = a.MotivoRechazo,
            FechaRegistro = a.FechaRegistro,
            TipoAlmacen = a.TipoAlmacen,
            NombreResponsable = a.NombreResponsable,
            CapacidadAlmacenamiento = a.CapacidadAlmacenamiento,
            ControlTemperatura = a.ControlTemperatura,
            Latitud = a.Latitud,
            Longitud = a.Longitud
        };
    }

    /// <summary>
    /// Actualizacion parcial: null en el DTO preserva el valor actual de la entidad.
    /// </summary>
    public static void AplicarActualizacion(AlmacenEntity entity, ActualizarAlmacenDto dto)
    {
        if (dto.Nombre != null)
            entity.Nombre = dto.Nombre;
        if (dto.VeterinariaId.HasValue)
            entity.VeterinariaId = dto.VeterinariaId;
        if (dto.CedulaJuridica != null)
            entity.CedulaJuridica = dto.CedulaJuridica;
        if (dto.Telefono != null)
            entity.Telefono = dto.Telefono;
        if (dto.Email != null)
            entity.Email = dto.Email;
        if (dto.Direccion != null)
            entity.Direccion = dto.Direccion;
        if (dto.Descripcion != null)
            entity.Descripcion = dto.Descripcion;
        if (dto.MotivoRechazo != null)
            entity.MotivoRechazo = dto.MotivoRechazo;
        if (dto.Tipo.HasValue)
            entity.Tipo = dto.Tipo.Value;
        if (dto.Activo.HasValue)
            entity.Activo = dto.Activo.Value;
        if (dto.Aprobada.HasValue)
            entity.Aprobada = dto.Aprobada.Value;
        if (dto.Rechazada.HasValue)
            entity.Rechazada = dto.Rechazada.Value;
        if (dto.FechaRegistro.HasValue)
            entity.FechaRegistro = dto.FechaRegistro.Value;

        // Sprint 1 - Tarea 7: campos del wireframe (update parcial, null preserva).
        if (dto.TipoAlmacen != null)
            entity.TipoAlmacen = dto.TipoAlmacen;
        if (dto.NombreResponsable != null)
            entity.NombreResponsable = dto.NombreResponsable;
        if (dto.CapacidadAlmacenamiento != null)
            entity.CapacidadAlmacenamiento = dto.CapacidadAlmacenamiento;
        if (dto.ControlTemperatura != null)
            entity.ControlTemperatura = dto.ControlTemperatura;
        if (dto.Latitud.HasValue)
            entity.Latitud = dto.Latitud;
        if (dto.Longitud.HasValue)
            entity.Longitud = dto.Longitud;
    }
}