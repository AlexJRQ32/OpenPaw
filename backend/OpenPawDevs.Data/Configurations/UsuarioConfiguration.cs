using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Nombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(u => u.Telefono)
            .HasMaxLength(20);

        builder.Property(u => u.Direccion)
            .HasMaxLength(300);

        builder.Property(u => u.FotoUrl)
            .HasMaxLength(500);

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(500);

        builder.Property(u => u.RefreshTokenExpiry)
            .HasColumnType("datetime2");

        builder.HasOne(u => u.Rol)
            .WithMany(r => r.Usuarios)
            .HasForeignKey(u => u.RolId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Veterinaria)
            .WithMany()
            .HasForeignKey(u => u.VeterinariaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(u => u.Almacen)
            .WithMany()
            .HasForeignKey(u => u.AlmacenId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(u => u.Email)
            .IsUnique();
    }
}
