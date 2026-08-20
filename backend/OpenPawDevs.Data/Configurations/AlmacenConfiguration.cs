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
    }
}
