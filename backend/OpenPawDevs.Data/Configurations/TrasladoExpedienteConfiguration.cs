using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla TrasladoExpediente (PBI 131 - Traslado de expediente entre veterinarias) </summary>
public class TrasladoExpedienteConfiguration : IEntityTypeConfiguration<TrasladoExpediente>
{
    public void Configure(EntityTypeBuilder<TrasladoExpediente> builder)
    {
        builder.ToTable("TrasladosExpediente");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Estado)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.Comentario)
            .HasMaxLength(1000);

        builder.Property(t => t.MotivoRechazo)
            .HasMaxLength(1000);

        builder.HasOne(t => t.Mascota)
            .WithMany()
            .HasForeignKey(t => t.MascotaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.VeterinariaOrigen)
            .WithMany()
            .HasForeignKey(t => t.VeterinariaOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.VeterinariaDestino)
            .WithMany()
            .HasForeignKey(t => t.VeterinariaDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.SolicitadoPor)
            .WithMany()
            .HasForeignKey(t => t.SolicitadoPorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
