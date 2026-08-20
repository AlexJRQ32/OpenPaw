using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Configurations;

public class RedSocialConfiguration : IEntityTypeConfiguration<RedSocial>
{
    public void Configure(EntityTypeBuilder<RedSocial> builder)
    {
        builder.ToTable("RedesSociales");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Plataforma).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Url).HasMaxLength(500);

        builder.HasOne(r => r.Usuario)
            .WithMany(u => u.RedesSociales)
            .HasForeignKey(r => r.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
