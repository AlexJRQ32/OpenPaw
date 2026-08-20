using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla PedidoDetalle (Epic 9 - Marketplace: Gestión de pedidos) </summary>
public class PedidoDetalleConfiguration : IEntityTypeConfiguration<PedidoDetalle>
{
    public void Configure(EntityTypeBuilder<PedidoDetalle> builder)
    {
        builder.ToTable("PedidoDetalles");

        builder.HasKey(pd => pd.Id);

        builder.Property(pd => pd.Cantidad)
            .IsRequired();

        builder.Property(pd => pd.PrecioUnitario)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(pd => pd.Subtotal)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(pd => pd.Pedido)
            .WithMany(p => p.Detalles)
            .HasForeignKey(pd => pd.PedidoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pd => pd.Producto)
            .WithMany()
            .HasForeignKey(pd => pd.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
