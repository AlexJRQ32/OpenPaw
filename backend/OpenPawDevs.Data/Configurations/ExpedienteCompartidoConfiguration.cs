using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla ExpedienteCompartido (Epic 6 - Compartir expedientes) </summary>
public class ExpedienteCompartidoConfiguration : IEntityTypeConfiguration<ExpedienteCompartido>
{
    public void Configure(EntityTypeBuilder<ExpedienteCompartido> builder)
    {
        builder.ToTable("ExpedientesCompartidos");

        builder.HasKey(ec => ec.Id);

        builder.Property(ec => ec.Estado)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasOne(ec => ec.Expediente)
            .WithMany(e => e.ExpedientesCompartidos)
            .HasForeignKey(ec => ec.ExpedienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ec => ec.VeterinariaOrigen)
            .WithMany()
            .HasForeignKey(ec => ec.VeterinariaOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ec => ec.VeterinariaDestino)
            .WithMany()
            .HasForeignKey(ec => ec.VeterinariaDestinoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
