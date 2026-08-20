using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Expediente (Epic 6 - Atender Consulta) </summary>
public class ExpedienteConfiguration : IEntityTypeConfiguration<Expediente>
{
    public void Configure(EntityTypeBuilder<Expediente> builder)
    {
        builder.ToTable("Expedientes");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Diagnostico)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(e => e.Tratamiento)
            .HasMaxLength(2000);

        builder.Property(e => e.Observaciones)
            .HasMaxLength(2000);

        builder.HasOne(e => e.Mascota)
            .WithMany(m => m.Expedientes)
            .HasForeignKey(e => e.MascotaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Veterinaria)
            .WithMany(v => v.Expedientes)
            .HasForeignKey(e => e.VeterinariaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

