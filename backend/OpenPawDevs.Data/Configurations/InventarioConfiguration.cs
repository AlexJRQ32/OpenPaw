using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Inventario (Epic 9 - Marketplace: Control de inventario) </summary>
public class InventarioConfiguration : IEntityTypeConfiguration<Inventario>
{
    public void Configure(EntityTypeBuilder<Inventario> builder)
    {
        builder.ToTable("Inventarios");

        builder.HasKey(i => i.Id);

        builder.HasIndex(i => new { i.ProductoId, i.AlmacenId })
            .IsUnique();

        builder.Property(i => i.Cantidad)
            .IsRequired();

        // Sprint 1 - Tarea 8: campos del wireframe de Inventario.
        builder.Property(i => i.Categoria)
            .HasMaxLength(30);

        builder.Property(i => i.Lote)
            .HasMaxLength(50);

        builder.Property(i => i.Ubicacion)
            .HasMaxLength(50);

        builder.Property(i => i.UnidadMedida)
            .HasMaxLength(20);

        builder.HasOne(i => i.Producto)
            .WithMany(p => p.Inventarios)
            .HasForeignKey(i => i.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Almacen)
            .WithMany(a => a.Inventarios)
            .HasForeignKey(i => i.AlmacenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
