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

        builder.Property(v => v.Descripcion)
            .HasMaxLength(1000);

        builder.Property(v => v.DocumentoPersoneriaJuridica)
            .HasMaxLength(500);

        builder.Property(v => v.MotivoRechazo)
            .HasMaxLength(500);
    }
}
