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

        builder.Property(u => u.TelefonoEmergencia)
            .HasMaxLength(20);

        builder.Property(u => u.Direccion)
            .HasMaxLength(300);

        builder.Property(u => u.LicenciaMedica)
            .HasMaxLength(100);

        builder.Property(u => u.FechaIncorporacion)
            .HasColumnType("datetime2");

        builder.Property(u => u.FotoUrl)
            .HasMaxLength(500);

        // Sprint 1 - Tarea 9: campos del wireframe de Funcionarios.
        builder.Property(u => u.IdCorporativo)
            .HasMaxLength(20);

        // M1 (Code Review): indice unico sobre IdCorporativo para que la generacion
        // CountByRolAsync + 1 no pueda producir duplicados bajo concurrencia.
        // (La migracion AddUniqueIndexIdCorporativo limpia duplicados previos antes de crear el indice.)
        builder.HasIndex(u => u.IdCorporativo)
            .IsUnique();

        builder.Property(u => u.Especialidad)
            .HasMaxLength(100);

        builder.Property(u => u.Sede)
            .HasMaxLength(60);

        builder.Property(u => u.Estado)
            .HasMaxLength(20);

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
