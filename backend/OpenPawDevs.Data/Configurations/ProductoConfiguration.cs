using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Producto (Epic 9 - Marketplace) </summary>
public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.ToTable("Productos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nombre)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Descripcion)
            .HasMaxLength(1000);

        builder.Property(p => p.Precio)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(p => p.Categoria)
            .HasMaxLength(100);

        builder.Property(p => p.ImagenUrl)
            .HasMaxLength(500);

        builder.Property(p => p.Activo)
            .HasMaxLength(20)
            .IsRequired();
    }
}

