API de Servicios Veterinarios

Este módulo gestiona la oferta de servicios de las clínicas dadas de alta en OpenPaw. Construimos la solución sobre una API REST en ASP.NET Core y aplicamos el patrón Repositorio para mantener bien separada la base de datos de los controladores.
En el apartado de seguridad, protegemos los recursos exigiendo un token activo ([Authorize]). Cualquiera puede consultar la información si está autenticado, pero únicamente las cuentas con rol 1 o 2 tienen permisos para crear, editar o dar de baja un servicio.
1.	Flujo de Arquitectura
El camino que sigue una solicitud desde que sale del cliente es bastante directo:
1.	Frontend: Dispara la petición HTTP.
2.	ServiciosVeterinariosController: Recibe la solicitud, valida que todo venga en orden y delega el trabajo pesado.
3.	ServicioVeterinarioRepository: Capa intermedia donde reside la lógica de acceso a datos.
4.	Base de Datos: Se ejecutan las operaciones mediante Entity Framework Core.
2.	Modelo de Datos y Transferencia
La información de cada servicio veterinario se expone mediante el objeto de transferencia ServicioVeterinarioDto, utilizado para enviar únicamente la información necesaria al cliente sin exponer directamente la entidad de la base de datos.

Campo	Tipo	Descripción
Id	int	Identificador único del servicio veterinario.
VeterinariaId	int	Identificador de la veterinaria propietaria del servicio.
VeterinariaNombre	string	Nombre de la veterinaria asociada al servicio.
Nombre	string	Nombre del servicio veterinario.
Descripcion	string	Descripción del procedimiento o servicio ofrecido.
Categoria	CategoriaServicioVeterinario	Categoría a la que pertenece el servicio.
Precio	decimal	Precio del servicio veterinario.
DuracionMinutos	int	Duración estimada del servicio en minutos.
Activo	bool	Indica si el servicio se encuentra disponible para los clientes.

Durante la creación de un nuevo servicio, el sistema registra automáticamente la fecha de creación y actualización utilizando la hora UTC y establece el estado Activo en verdadero
3.	Catálogo de Endpoints
Consultas Lectura (GET)
•	GET /api/ServiciosVeterinarios Retorna la lista completa de servicios activos en la plataforma.
200 OK: Colección de ServicioVeterinarioDto.
•	GET /api/ServiciosVeterinarios/{id} Busca un servicio puntual según su ID.
200 OK: Devuelve el DTO correspondiente.
404 Not Found: El ID no coincide con ningún registro.
•	GET /api/ServiciosVeterinarios/veterinaria/{veterinariaId} Filtra y entrega los servicios activos asignados a una veterinaria en específico.
200 OK: Lista de servicios filtrados por clínica.
•	GET /api/ServiciosVeterinarios/categoria/{categoria} Devuelve los servicios asociados a un tipo particular.
200 OK: Lista de servicios por categoría.
Operaciones de Escritura (POST, PUT, DELETE)
(Requieren roles 1 o 2)
•	POST /api/ServiciosVeterinarios Registra un servicio nuevo en el sistema.
Body esperado: CrearServicioVeterinarioDto.
Proceso: Confirma la existencia de la veterinaria, asigna fechas en UTC y lo marca como activo.
201 Created: Creado exitosamente.
400 Bad Request: La veterinaria enviada no existe.
•	PUT /api/ServiciosVeterinarios/{id} Actualiza los campos de un registro existente.
Body esperado: ActualizarServicioVeterinarioDto.
204 No Content: Modificado correctamente.
404 Not Found: No existe el recurso a editar.
•	DELETE /api/ServiciosVeterinarios/{id} Elimina un servicio de la base de datos.
204 No Content: Eliminación completada.
404 Not Found: Registro no encontrado.
4.	Puesta en Marcha y Configuración
4.1 Inyección de Dependencias
Registramos las clases en Program.cs. La interfaz IServicioVeterinarioRepository extiende de un repositorio genérico IGenericRepository<ServicioVeterinario>, sumando un par de métodos propios:
C#
// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositorio
builder.Services.AddScoped<IServicioVeterinarioRepository, ServicioVeterinarioRepository>();
Contrato del repositorio:
C#
public interface IServicioVeterinarioRepository : IGenericRepository<ServicioVeterinario>
{
    Task<IReadOnlyList<ServicioVeterinario>> GetByVeterinariaIdAsync(int veterinariaId);
    Task<IReadOnlyList<ServicioVeterinario>> GetByCategoriaAsync(CategoriaServicioVeterinario categoria);
}
4.2 Cadena de Conexión
En el archivo appsettings.json definimos el string para SQL Server:
JSON
"ConnectionStrings": {
  "DefaultConnection": "Server=<servidor>;Database=OpenPawDevs;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
Tip: Evita subir credenciales reales al repositorio git. Trabaja con appsettings.Development.json o variables de entorno en tus entornos de deploy.
4.3 Autenticación JWT
Configuramos la validación de tokens Bearer en Program.cs. Mapeamos el tipo de rol con RoleClaimType = "rol", de modo que el JWT debe incluir ese claim numérico (1 o 2) para permitir operaciones de administración.
C#
var jwtSection = builder.Configuration.GetSection("Jwt");
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
Variables clave en el JSON:
•	Jwt:Key: Clave de firma (mínimo 32 caracteres).
•	Jwt:Issuer: Emisor del token.
•	Jwt:Audience: Audiencia esperada.
•	Jwt:ExpiryMinutes: Tiempo de vida en minutos.
Asegúrate de agregar app.UseAuthentication() antes de app.UseAuthorization().
4.4 CORS
Para conectar sin problemas la API con el frontend (ya sea Vite local o Vercel en producción), habilitamos los orígenes permitidos con soporte de credenciales:
C#
builder.Services.AddCors(options =>
{
    options.AddPolicy("OpenPawCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://openpaw-devs.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
4.5 Serialización JSON
Ajustamos dos comportamientos por defecto del serializador: evitamos ciclos infinitos al navegar relaciones de EF Core y convertimos los valores del enum a sus equivalentes en texto.
C#
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
4.6 Estrategias de Consulta
A nivel repositorio aplicamos un par de buenas prácticas para optimizar el rendimiento:
•	AsNoTracking(): Utilizado en lecturas puras para omitir el seguimiento del change tracker.
•	Include(): Carga la entidad Veterinaria en el mismo query, previniendo el error N+1.
•	Ordenamiento: Los resultados retornan ordenados alfabéticamente por el nombre del servicio.
5.	Mapeo con el Marketplace
Los servicios se agrupan mediante el enum CategoriaServicioVeterinario, lo que facilita la navegación y filtrado desde la app principal.
•	Consulta: Revisiones generales, diagnósticos, chequeos preventivos y consultas de control.
•	Grooming: Todo el apartado estético y de higiene (baño, corte de pelo, cepillado, oídos).
•	Procedimiento: Actividades clínicas como curaciones, aplicación de medicamentos o intervenciones menores.
Al estandarizar los tipos de servicio bajo este esquema, el buscador del Marketplace puede consumir directamente /api/ServiciosVeterinarios/categoria/{categoria} sin necesidad de procesar los datos en el frontend.

