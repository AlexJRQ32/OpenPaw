using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Cita (Epic 5 - Agendar Cita) </summary>
public class CitaConfiguration : IEntityTypeConfiguration<Cita>
{
    public void Configure(EntityTypeBuilder<Cita> builder)
    {
        builder.ToTable("Citas");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Servicio)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(c => c.Estado)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(c => c.TipoCita)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("Rutina");

        builder.Property(c => c.Notas)
            .HasMaxLength(1000);

        builder.Property(c => c.Costo)
            .HasPrecision(18, 2);

        builder.HasOne(c => c.Mascota)
            .WithMany(m => m.Citas)
            .HasForeignKey(c => c.MascotaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Veterinaria)
            .WithMany(v => v.Citas)
            .HasForeignKey(c => c.VeterinariaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Usuario)
            .WithMany(u => u.Citas)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

