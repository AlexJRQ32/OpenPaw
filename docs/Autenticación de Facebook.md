Autenticación con Facebook en OpenPaw
Para el login con Facebook implementamos el endpoint POST /api/Auth/login-facebook. El cliente nos manda el Access Token que le escupe Meta tras autenticarse, y desde el backend nos encargamos de ir a pegarle a la Graph API para validar que ese token sea real, traer los datos del perfil y finalmente soltarle al usuario sus propios tokens de OpenPaw (un JWT de sesión y un Refresh Token).
Flujo de Autenticación con Facebook

[Usuario]
Inicia sesión en Facebook
       |
       v
[Frontend]
Envía Access Token de Meta
       |
       v
[Solicitud de login]
POST /api/Auth/login-facebook
       |
       v
+---------------------------------------------+
|         AuthController / AuthService         |
|                                               |
|  [Valida el token]                           |
|  Graph API · debug_token                     |
|        |                                     |
|        v                                     |
|  [Solicita perfil]                           |
|  Datos del usuario vía Meta                  |
|        |                                     |
|        v                                     |
|  [¿Existe el correo en la BD?]                |
|        |                                     |
|   Sí   |   No                                |
|   +----+----+                                |
|   |         |                                |
|   v         v                                |
| [Recupera  [Registra                         |
|  la cuenta] cuenta nueva]                    |
| Correo ya   Rol: Cliente                     |
| registrado                                   |
|   |         |                                |
|   +----+----+                                |
|        |                                     |
|        v                                     |
|  [Genera JWT y Refresh Token]                |
|  Prepara tokens de sesión                    |
|        |                                     |
|        v                                     |
|  [Guarda Refresh Token]                      |
|  Persiste en base de datos                   |
|                                               |
+---------------------------------------------+
       |
       v
[Cliente]
JWT, Refresh Token y expiración

Configuración e Inyección de Dependencias
Para que esto funcione, en Program.cs dejamos registrado el cliente HTTP que consume los endpoints de Meta y registramos la capa de servicios:
C#
builder.Services.AddHttpClient<IAuthService, AuthService>();
builder.Services.AddScoped<IAuthService, AuthService>();
La autenticación por JWT la montamos sobre el middleware estándar de ASP.NET Core con AddAuthentication y AddAuthorization. Las credenciales y claves las leemos directamente vía IConfiguration para no dejar nada hardcodeado en el repositorio:
Variables requeridas (appsettings.json / Variables de entorno)
•	Sección Facebook
o	Facebook:AppId: El ID de nuestra app en el panel de Meta Developers.
o	Facebook:AppSecret: La clave secreta para firmar la validación contra Graph API.
•	Sección JWT
o	Jwt:Key: Secreta para la firma HMAC SHA-256.
o	Jwt:Issuer: Emisor del token.
o	Jwt:Audience: Audiencia esperada.
o	Jwt:ExpiryMinutes: Minutos de vida del JWT.
¿Cómo procesamos la solicitud en el backend?
1.	Recepción: El controller recibe un LoginFacebookDto con el token de Facebook expuesto por el cliente.
2.	Validación del token: Armamos la llamada a GET [https://graph.facebook.com/debug_token](https://graph.facebook.com/debug_token) usando el AppId y AppSecret. Ahí confirmamos tres cosas básicas: que el token pertenezca a nuestra app, que siga activo y que no esté vencido. Si algo falla aquí, disparamos un UnauthorizedAccessException.
3.	Lectura del perfil: Si Meta nos da el visto bueno, llamamos de nuevo a Graph API pidiendo los campos id, name, email y picture. Si la cuenta de Facebook no tiene un correo asociado (o el usuario no dio el permiso al loguearse), abortamos el proceso retornando un error.
4.	Cruce contra nuestra base de datos: Buscamos si existe un usuario con ese email:
o	Si ya existe: Simplemente tomamos ese usuario para iniciarle sesión.
o	Si no existe: Lo creamos en el momento. Guardamos su nombre, correo, la foto de perfil que nos pasó Facebook y le asignamos el rol Cliente con estado Activo. Le generamos una contraseña aleatoria y la guardamos hasheada con BCrypt.
5.	Emisión de credenciales OpenPaw:
o	Armamos el JWT con los claims sub (ID usuario), email, nombre, rol y jti.
o	Generamos un Refresh Token tipo GUID con 7 días de validez y lo persistimos en la base de datos.
o	Le devolvemos al frontend la respuesta con el JWT, el Refresh Token y la fecha exacta de expiración.
Manejo de errores (Respuestas 401)
El endpoint responde con un estatus 401 Unauthorized si se da alguno de estos casos:
•	El token de Facebook viene alterado, caducado o no pertenece a nuestra app.
•	La Graph API de Meta no responde o regresa un error de consulta.
•	No logramos extraer la información básica del usuario.
•	El perfil de Facebook no viene con una dirección de correo válida.
Puntos de seguridad clave
•	Cero confianza en el cliente: Nunca damos por bueno el Access Token que manda el frontend hasta haberlo verificado directamente contra los servidores de Meta.
•	AppSecret protegido: El secreto de la app vive en las variables del servidor; nunca baja al navegador ni a la app móvil.
•	Contraseñas aleatorias: Aunque las cuentas sociales no usan contraseña para entrar, les asignamos un string aleatorio hasheado con BCrypt al crearlas para no dejar campos vacíos ni contraseñas por defecto en la BD.
•	Aislamiento de tokens: Una vez que validamos con Facebook, el cliente guarda nuestro JWT para las siguientes peticiones. No vuelve a tocar el Access Token de Meta dentro de nuestra API.
•	Persistencia del Refresh Token: Queda guardado en BD para permitir renovar la sesión de forma controlada sin tener que obligar al usuario a hacer la autenticación con Facebook a cada rato.

