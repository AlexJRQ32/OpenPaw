Integración del registro con Facebook en OpenPaw
OpenPaw permite que un usuario se registre utilizando su cuenta de Facebook mediante el endpoint POST /api/Auth/login-facebook. El cliente envía un Access Token generado por Facebook y el backend valida dicho token utilizando la Graph API de Meta. Si el usuario aún no existe en la base de datos, el sistema crea automáticamente una nueva cuenta; en caso contrario, utiliza la cuenta existente e inicia sesión.
Especificaciones de la API
•	Método: POST
•	Endpoint: /api/Auth/login-facebook
•	Acceso: Público ([AllowAnonymous]), ya que el usuario todavía no posee un JWT emitido por OpenPaw.
Información enviada por el cliente
El cliente envía un objeto LoginFacebookDto que contiene el Access Token generado por Facebook.
Campo	Tipo	Requerido	Descripción
Token	string	Sí	Access Token emitido por Facebook utilizado para validar la identidad del usuario.
UserId	string	No	Identificador del usuario en Facebook, si el cliente lo envía. Reservado para uso futuro; actualmente no es consumido por el flujo de autenticación descrito en este documento.
Code	string	No	Código de autorización utilizado en flujos OAuth cuando corresponda. Reservado para un posible flujo OAuth alternativo; no se procesa en el flujo actual (ver "Flujo del registro").
Datos obtenidos desde Facebook
Después de validar correctamente el Access Token, el backend consulta la Graph API para obtener la información del perfil del usuario. Los campos solicitados son:
•	id
•	name
•	email
•	picture
El correo electrónico es un dato obligatorio para completar el registro. Si Facebook no devuelve el correo, el proceso finaliza con un error de autenticación.
Mapeo de campos
La información obtenida desde Facebook se transforma al modelo de usuario utilizado por OpenPaw de la siguiente manera:
Campo obtenido desde Facebook	Campo del usuario en OpenPaw
name	Nombre
email	Email
picture.data.url	FotoUrl
id	Utilizado únicamente durante el paso de consulta a la Graph API (ver paso 6 del flujo); no se persiste como campo independiente en el modelo de usuario.
Cuando el usuario no existe previamente, el sistema completa automáticamente los siguientes valores:
•	Contraseña aleatoria cifrada mediante BCrypt.
•	Rol Cliente.
•	Estado Activo.
•	Fecha de registro con la fecha y hora actuales.
Flujo del registro
1.	El usuario selecciona la opción Continuar con Facebook desde el frontend.
2.	Facebook autentica al usuario y devuelve un Access Token.
3.	El frontend envía el token al endpoint POST /api/Auth/login-facebook.
4.	El controlador delega el procesamiento al método LoginWithFacebookAsync() del servicio de autenticación.
5.	El servicio valida el Access Token mediante el endpoint debug_token de la Graph API.
6.	Si el token es válido, se consulta la información del usuario solicitando los campos id, name, email y picture.
7.	El sistema busca un usuario registrado con el mismo correo electrónico.
8.	Si el usuario no existe, crea automáticamente una nueva cuenta utilizando la información obtenida desde Facebook.
9.	Si el usuario ya existe, utiliza la cuenta registrada para iniciar sesión.
10.	Finalmente, el sistema genera un JWT, un Refresh Token y devuelve ambos al cliente.
Manejo de errores
Durante el proceso de autenticación y registro pueden presentarse los siguientes errores:
Código HTTP	Situación
200 OK	El usuario fue autenticado correctamente y se devuelve el JWT junto con el Refresh Token.
401 Unauthorized	El Access Token es inválido o expiró.
401 Unauthorized	Error al validar el token mediante la Graph API de Facebook.
401 Unauthorized	No fue posible obtener la información del usuario desde Facebook.
401 Unauthorized	Facebook no devolvió un correo electrónico asociado a la cuenta.
500 Internal Server Error	Error no controlado durante el proceso (por ejemplo, falla de conexión con la Graph API, o excepción al crear/consultar el usuario en la base de datos).
En todos los casos de error el controlador responde con un mensaje descriptivo similar al siguiente:
json
{
  "mensaje": "Descripción del error"
}
Nota de diseño: el caso "Facebook no devolvió un correo electrónico" se maneja como 401 Unauthorized en lugar de 400 Bad Request, ya que se trata como una falla del proceso de autenticación (no se puede completar la identificación del usuario) y no como un error de validación de la solicitud del cliente. Esta es una decisión de diseño intencional, no una omisión.
Consideraciones de seguridad
•	El Access Token recibido desde el cliente siempre es validado directamente con los servidores de Meta antes de permitir cualquier acceso.
•	El AppSecret permanece únicamente en el backend y nunca se expone al cliente.
•	Las cuentas creadas automáticamente utilizan una contraseña aleatoria protegida mediante BCrypt.
•	Una vez completada la autenticación, el cliente utiliza exclusivamente el JWT emitido por OpenPaw, sin volver a utilizar el Access Token de Facebook para consumir la API.
Vigencia de tokens
•	JWT: Pendiente de confirmar duración de expiración configurada en el proyecto.
•	Refresh Token: Pendiente de confirmar duración de expiración y política de renovación.

