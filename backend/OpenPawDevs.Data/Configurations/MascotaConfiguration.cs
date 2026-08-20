using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

/// <summary> Configuración de tabla Mascota (Epic 4 - Registrar Mascota) </summary>
public class MascotaConfiguration : IEntityTypeConfiguration<Mascota>
{
    public void Configure(EntityTypeBuilder<Mascota> builder)
    {
        builder.ToTable("Mascotas");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Nombre)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(m => m.Especie)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(m => m.Raza)
            .HasMaxLength(100);

        builder.Property(m => m.Sexo)
            .HasMaxLength(10);

        builder.Property(m => m.Color)
            .HasMaxLength(50);

        builder.Property(m => m.FotoUrl)
            .HasMaxLength(500);

        builder.Property(m => m.Peso)
            .HasPrecision(18, 2);

        builder.HasOne(m => m.Duenio)
            .WithMany(u => u.Mascotas)
            .HasForeignKey(m => m.DuenioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Veterinaria)
            .WithMany()
            .HasForeignKey(m => m.VeterinariaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}




