using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Notificacion (Epic 3/Epic 31 - Notificaciones del sistema) </summary>
public class NotificacionConfiguration : IEntityTypeConfiguration<Notificacion>
{
    public void Configure(EntityTypeBuilder<Notificacion> builder)
    {
        builder.ToTable("Notificaciones");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Mensaje)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(n => n.Mensaje)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(n => n.Tipo)
            .HasMaxLength(50);

        builder.Property(n => n.Leido)
            .HasMaxLength(20)
            .IsRequired();
    }
}


