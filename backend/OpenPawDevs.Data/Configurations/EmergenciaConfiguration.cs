using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Emergencia (PBI 133 - Atención de emergencias) </summary>
public class EmergenciaConfiguration : IEntityTypeConfiguration<Emergencia>
{
    public void Configure(EntityTypeBuilder<Emergencia> builder)
    {
        builder.ToTable("Emergencias");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.VeterinariaNombreExterna)
            .HasMaxLength(150);

        builder.Property(e => e.Motivo)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(e => e.Sintomas)
            .HasMaxLength(2000);

        builder.Property(e => e.TratamientoAplicado)
            .HasMaxLength(2000);

        builder.Property(e => e.ArchivoAdjuntoUrl)
            .HasMaxLength(500);

        builder.HasOne(e => e.Mascota)
            .WithMany()
            .HasForeignKey(e => e.MascotaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Propietario)
            .WithMany()
            .HasForeignKey(e => e.PropietarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Veterinaria)
            .WithMany()
            .HasForeignKey(e => e.VeterinariaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
