using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

public class VeterinariaConfiguration : IEntityTypeConfiguration<Veterinaria>
{
    public void Configure(EntityTypeBuilder<Veterinaria> builder)
    {
        builder.ToTable("Veterinarias");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Nombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(v => v.Direccion)
            .HasMaxLength(300);

        builder.Property(v => v.Telefono)
            .HasMaxLength(20);

        builder.Property(v => v.Email)
            .HasMaxLength(100);

        builder.Property(v => v.Horario)
            .HasMaxLength(50);

        builder.Property(v => v.LogoUrl)
            .HasMaxLength(500);

        builder.Property(v => v.CedulaJuridica)
            .HasMaxLength(30);

        // Deuda #89: índice único para evitar cédulas duplicadas (404->409 del frontend es código muerto sin esto).
        builder.HasIndex(v => v.CedulaJuridica)
            .IsUnique()
            .HasFilter("[CedulaJuridica] IS NOT NULL");

        builder.Property(v => v.Descripcion)
            .HasMaxLength(1000);

        builder.Property(v => v.DocumentoPersoneriaJuridica)
            .HasMaxLength(500);

        builder.Property(v => v.MotivoRechazo)
            .HasMaxLength(500);

        // Sprint 1 - Tarea 6: campos del wireframe de Registro de Veterinaria.
        builder.Property(v => v.RazonSocial)
            .HasMaxLength(150);

        builder.Property(v => v.Nit)
            .HasMaxLength(30);

        builder.Property(v => v.CorreoOficial)
            .HasMaxLength(100);

        builder.Property(v => v.Latitud)
            .HasPrecision(10, 7);

        builder.Property(v => v.Longitud)
            .HasPrecision(10, 7);
    }
}
