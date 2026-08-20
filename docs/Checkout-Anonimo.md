Checkout Anónimo con Registro Express
Esta funcionalidad permite que un cliente compre en OpenPaw sin tener que llenar un formulario largo de registro. Solo pedimos email y contraseña, creamos la cuenta en segundo plano, le devolvemos su sesión iniciada y puede pagar al instante.
Usamos la misma lógica del registro tradicional para no duplicar código ni saltarnos reglas de seguridad.
1.	Diagrama de Flujo
Flujo de Registro Express (Checkout Anónimo)

[Usuario no registrado]
       |
       v
[Ingresa email y contraseña]
       |
       v
[POST /api/Auth/register-express]
       |
       v
[AuthController]
       |
       v
[AuthService.RegisterExpressAsync()]
       |
       v
[Extrae y limpia el nombre]
       |
       v
[RegisterAsync()]
       |
       v
[¿El correo ya está registrado?]
       |
   Sí  |  No
   +---+---+
   |       |
   v       v
[400 Bad   [Guardar usuario]
 Request]   BCrypt hash + rol cliente
               |
               v
          [Emitir JWT]
          + Refresh Token
               |
               v
        [Sesión activa / comprando]
2. Cómo Funciona el Registro Express paso a paso
Paso 1: Petición mínima
El cliente consume la ruta:
POST /api/Auth/register-express
El cuerpo del JSON (RegistroExpressDto) solo necesita dos datos:
•	Email
•	Password
Paso 2: Formateo automático del nombre
Para no frenar la compra pidiendo nombre y apellido, el sistema los deduce a partir del correo. Toma el texto previo al @, busca separadores comunes (., -, _) y pone la primera letra de cada palabra en mayúscula.
Email recibido	Nombre asignado
juan.perez@gmail.com	Juan Perez
maria_lopez@hotmail.com	Maria Lopez
carlos-rojas@outlook.com	Carlos Rojas
Paso 3: Alta de la cuenta
El método RegisterExpressAsync llama internamente a RegisterAsync. Esto nos asegura que se corran los mismos chequeos de siempre:
•	Validar que el email no esté repetido (si existe, devuelve 400 Bad Request).
•	Hashear la contraseña con BCrypt antes de tocar la base de datos.
•	Asignar el rol Cliente, marcar la cuenta como Activa y guardar la fecha de alta.
Paso 4: Login transparente
Apenas se guarda el usuario, el backend genera su token JWT y su Refresh Token con su respectiva fecha de expiración. El cliente recibe las llaves de acceso en la misma respuesta HTTP, quedando autenticado de golpe sin tener que ir a una pantalla de login.
3. Desacoplamiento con el Módulo de Pedidos
El sistema cuenta con un controlador para procesar las compras:
POST /api/Pedidos
Cada pedido guarda la veterinaria de origen, destino, comentarios, fecha y arranca en estado Pendiente.
Conviene aclarar que RegisterExpressAsync y PedidosController no están amarrados en el mismo método. El registro express autentica al usuario y entrega el JWT; con ese token en mano, el frontend lanza la petición hacia /api/Pedidos. No hay un controlador único que fusione ambas llamadas en una sola transacción backend.
4. Razones de Arquitectura
•	Cero código duplicado: RegisterExpressAsync apoya toda la inserción sobre RegisterAsync. Cambiar las reglas de contraseñas o roles impacta a ambos flujos por igual.
•	Menos abandono en el carrito: Reducir la fricción inicial aumenta la conversión. El usuario no pierde tiempo escribiendo datos redundantes.
•	Seguridad base: No se recortan medidas de protección. Se usa hashing con BCrypt y sesiones firmadas por JWT.
•	Responsabilidades claras: El servicio de autenticación solo se preocupa por la identidad. La creación del pedido sigue siendo tarea exclusiva del PedidosController.

