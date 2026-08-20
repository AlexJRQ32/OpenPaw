using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using OpenPawDevs.Data.Data;
using OpenPawDevs.Core.Interfaces;
using OpenPawDevs.Data.Repositories;
using OpenPawDevs.Core.Services.Interfaces;
using OpenPawDevs.Core.Services;
using OpenPawDevs.WebAPI.Middleware;
using Microsoft.AspNetCore.DataProtection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var configuredKeysPath = builder.Configuration["DataProtection:KeysPath"];
var dataProtectionKeysPath = string.IsNullOrWhiteSpace(configuredKeysPath)
    ? Path.Combine(builder.Environment.ContentRootPath, ".aspnet-data-protection-keys")
    : Path.IsPathRooted(configuredKeysPath)
        ? configuredKeysPath
        : Path.Combine(builder.Environment.ContentRootPath, configuredKeysPath);
Directory.CreateDirectory(dataProtectionKeysPath);

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IMascotaRepository, MascotaRepository>();
builder.Services.AddScoped<IExpedienteRepository, ExpedienteRepository>();
builder.Services.AddScoped<IExpedienteCompartidoRepository, ExpedienteCompartidoRepository>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();
builder.Services.AddScoped<IVeterinariaRepository, VeterinariaRepository>();
builder.Services.AddScoped<IAlmacenRepository, AlmacenRepository>();
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();
builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
builder.Services.AddScoped<INotificacionRepository, NotificacionRepository>();
builder.Services.AddScoped<IRedSocialRepository, RedSocialRepository>();
builder.Services.AddScoped<IServicioVeterinarioRepository, ServicioVeterinarioRepository>();
builder.Services.AddScoped<ITrasladoExpedienteRepository, TrasladoExpedienteRepository>();
builder.Services.AddScoped<IAporteExpedienteRepository, AporteExpedienteRepository>();
builder.Services.AddScoped<IEmergenciaRepository, EmergenciaRepository>();

// HTTP Client for OAuth
builder.Services.AddHttpClient<IAuthService, AuthService>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();

// JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? "OpenPawDevsSuperSecretKey2026!Minimum32Chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = "rol"
        };
    });

builder.Services.AddAuthorization();

// Rate limiting: mitigacion de fuerza bruta en login/registro
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Controllers + Swagger
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("OpenPawCors", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                var uri = new Uri(origin);
                var host = uri.Host;
                var isLocalhost = host is "localhost" or "127.0.0.1" or "[::1]";
                return isLocalhost || origin == "https://openpaw-devs.vercel.app";
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("OpenPawCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();




