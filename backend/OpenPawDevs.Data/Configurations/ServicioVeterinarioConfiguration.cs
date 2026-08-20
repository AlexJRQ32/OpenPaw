using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

public class ServicioVeterinarioConfiguration : IEntityTypeConfiguration<ServicioVeterinario>
{
    public void Configure(EntityTypeBuilder<ServicioVeterinario> builder)
    {
        builder.ToTable("ServiciosVeterinarios");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Nombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(s => s.Descripcion)
            .HasMaxLength(1000);

        builder.Property(s => s.Categoria)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(s => s.Precio)
            .HasPrecision(18, 2);

        builder.HasIndex(s => new { s.VeterinariaId, s.Nombre })
            .IsUnique();

        builder.HasOne(s => s.Veterinaria)
            .WithMany(v => v.Servicios)
            .HasForeignKey(s => s.VeterinariaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
