using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

public class AlmacenConfiguration : IEntityTypeConfiguration<Almacen>
{
    public void Configure(EntityTypeBuilder<Almacen> builder)
    {
        builder.ToTable("Almacenes");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Nombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(a => a.Direccion)
            .HasMaxLength(300);

        builder.Property(a => a.Telefono)
            .HasMaxLength(20);

        builder.Property(a => a.Email)
            .HasMaxLength(100);

        builder.Property(a => a.CedulaJuridica)
            .HasMaxLength(30);

        builder.Property(a => a.Descripcion)
            .HasMaxLength(1000);

        builder.Property(a => a.MotivoRechazo)
            .HasMaxLength(500);

        // Sprint 1 - Tarea 7: campos del wireframe de Registro de Almacen.
        builder.Property(a => a.TipoAlmacen)
            .HasMaxLength(30);

        builder.Property(a => a.NombreResponsable)
            .HasMaxLength(150);

        builder.Property(a => a.CapacidadAlmacenamiento)
            .HasMaxLength(30);

        builder.Property(a => a.ControlTemperatura)
            .HasMaxLength(30);

        builder.Property(a => a.Latitud)
            .HasPrecision(10, 7);

        builder.Property(a => a.Longitud)
            .HasPrecision(10, 7);
    }
}
