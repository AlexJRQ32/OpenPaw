using Microsoft.EntityFrameworkCore;
using OpenPawDevs.Core.Entities;

namespace OpenPawDevs.Data.Data;

/// <summary> DbContext principal de OpenPaw (Todas los Epics) </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Mascota> Mascotas => Set<Mascota>();
    public DbSet<Expediente> Expedientes => Set<Expediente>();
    public DbSet<ExpedienteCompartido> ExpedientesCompartidos => Set<ExpedienteCompartido>();
    public DbSet<Veterinaria> Veterinarias => Set<Veterinaria>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<Almacen> Almacenes => Set<Almacen>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Inventario> Inventarios => Set<Inventario>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoDetalle> PedidoDetalles => Set<PedidoDetalle>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<RedSocial> RedesSociales => Set<RedSocial>();
    public DbSet<ServicioVeterinario> ServiciosVeterinarios => Set<ServicioVeterinario>();
    public DbSet<TrasladoExpediente> TrasladosExpediente => Set<TrasladoExpediente>();
    public DbSet<AporteExpediente> AportesExpediente => Set<AporteExpediente>();
    public DbSet<Emergencia> Emergencias => Set<Emergencia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Seed data for roles
        modelBuilder.Entity<Rol>().HasData(
            new Rol { Id = 1, Nombre = "Administrador", Descripcion = "Administrador del sistema" },
            new Rol { Id = 2, Nombre = "Veterinaria", Descripcion = "Personal veterinario" },
            new Rol { Id = 3, Nombre = "Almacen", Descripcion = "Personal de almacén" },
            new Rol { Id = 4, Nombre = "Cliente", Descripcion = "Dueño de mascotas" }
        );
    }
}
