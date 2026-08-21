using VeterinariaEntity = OpenPawDevs.Core.Entities.Veterinaria;

namespace OpenPawDevs.Core.DTOs.Veterinaria;

/// <summary>
/// Sprint 1 - Tarea 6: mapeo compartido entre entidad <see cref="VeterinariaEntity"/> y DTOs.
/// Centralizado para que el controller y los tests usen la misma logica.
/// </summary>
public static class VeterinariaMapeo
{
    public static VeterinariaDto ToDto(VeterinariaEntity v)
    {
        return new VeterinariaDto
        {
            Id = v.Id,
            Nombre = v.Nombre,
            CedulaJuridica = v.CedulaJuridica,
            Direccion = v.Direccion,
            Telefono = v.Telefono,
            Email = v.Email,
            Descripcion = v.Descripcion,
            Horario = v.Horario,
            LogoUrl = v.LogoUrl,
            Activo = v.Activo,
            Aprobada = v.Aprobada,
            Rechazada = v.Rechazada,
            MotivoRechazo = v.MotivoRechazo,
            DocumentoPersoneriaJuridica = v.DocumentoPersoneriaJuridica,
            FechaRegistro = v.FechaRegistro,
            UsuarioId = v.UsuarioId,
            RazonSocial = v.RazonSocial,
            Nit = v.Nit,
            CorreoOficial = v.CorreoOficial,
            Latitud = v.Latitud,
            Longitud = v.Longitud
        };
    }

    /// <summary>
    /// Actualizacion parcial: null en el DTO preserva el valor actual de la entidad.
    /// </summary>
    public static void AplicarActualizacion(VeterinariaEntity entity, ActualizarVeterinariaDto dto)
    {
        if (dto.RazonSocial != null)
            entity.RazonSocial = dto.RazonSocial;
        if (dto.Nit != null)
            entity.Nit = dto.Nit;
        if (dto.CorreoOficial != null)
            entity.CorreoOficial = dto.CorreoOficial;
        if (dto.Latitud.HasValue)
            entity.Latitud = dto.Latitud;
        if (dto.Longitud.HasValue)
            entity.Longitud = dto.Longitud;
        if (dto.Direccion != null)
            entity.Direccion = dto.Direccion;
        if (dto.Telefono != null)
            entity.Telefono = dto.Telefono;
        if (dto.Email != null)
            entity.Email = dto.Email;
        if (dto.Horario != null)
            entity.Horario = dto.Horario;
        if (dto.LogoUrl != null)
            entity.LogoUrl = dto.LogoUrl;
        if (dto.Descripcion != null)
            entity.Descripcion = dto.Descripcion;
    }
}