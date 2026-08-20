using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Pedido (Epic 9 - Marketplace: Gestión de pedidos) </summary>
public class PedidoConfiguration : IEntityTypeConfiguration<Pedido>
{
    public void Configure(EntityTypeBuilder<Pedido> builder)
    {
        builder.ToTable("Pedidos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Estado)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(p => p.Total)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(p => p.Comentario)
            .HasMaxLength(500);

        builder.HasOne(p => p.VeterinariaOrigen)
            .WithMany()
            .HasForeignKey(p => p.VeterinariaOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.VeterinariaDestino)
            .WithMany()
            .HasForeignKey(p => p.VeterinariaDestinoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

