using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla AporteExpediente (PBI 132 - Aporte de expediente externo) </summary>
public class AporteExpedienteConfiguration : IEntityTypeConfiguration<AporteExpediente>
{
    public void Configure(EntityTypeBuilder<AporteExpediente> builder)
    {
        builder.ToTable("AportesExpediente");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.VeterinariaNombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(a => a.Descripcion)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(a => a.Diagnostico)
            .HasMaxLength(1000);

        builder.Property(a => a.Medicamentos)
            .HasMaxLength(1000);

        builder.Property(a => a.ArchivoAdjuntoUrl)
            .HasMaxLength(500);

        builder.HasOne(a => a.Mascota)
            .WithMany()
            .HasForeignKey(a => a.MascotaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Propietario)
            .WithMany()
            .HasForeignKey(a => a.PropietarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
