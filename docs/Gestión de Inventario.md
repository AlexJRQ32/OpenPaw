API de Inventario
El módulo de Inventario de la plataforma OpenPaw se encarga de gestionar la disponibilidad real de los productos veterinarios en los distintos almacenes registrados. Su función principal es centralizar las existencias, definir umbrales de alerta (mínimos y máximos) y exponer datos confiables para que el Marketplace muestre únicamente el stock disponible a los compradores.
Toda la comunicación se realiza a través de servicios REST en el controlador InventarioController. El acceso a estos recursos exige un token Bearer válido mediante autenticación JWT.
1. Arquitectura e Infraestructura
El diseño sigue el patrón de diseño Repository, desacoplando la lógica de negocio del acceso a los datos.
Arquitectura de Gestión de Inventario

[Cliente / Marketplace]
       |
       | (Llama API para CRUD)
       v
[InventarioController] (HTTP REST)
       |
       | (Inyecta Interfaz)
       v
[IInventarioRepository] (Interfaz)
       |
       | (Implementa Interfaz)
       v
[InventarioRepository] (Implementación con EF Core)
       |
       | (Usa DbContext EF Core)
       v
[Base de Datos] ---- [Entidad: Producto]
                  |
                  |-- [Entidad: Almacen]
                  |
                  |-- [Entidad: Inventario]
•	InventarioController: Atiende las peticiones HTTP, gestiona el estado de las respuestas y valida las entradas.
•	IInventarioRepository / InventarioRepository: Capa de datos estructurada con Entity Framework Core que resuelve consultas optimizadas mediante carga de entidades relacionadas (eager loading).
•	Entidades Principales: Producto, Almacen e Inventario.
2. Modelo de Datos
Existe una relación de un producto a muchos registros de inventario (1:N): un mismo Producto puede tener registros independientes de stock en diferentes almacenes.
Entidad: Producto
Campo	Tipo	Descripción
Id	Guid / int	Identificador único del producto en la plataforma.
Nombre	string	Nombre comercial del artículo veterinario.
Descripcion	string	Ficha técnica o detalle descriptivo.
Precio	decimal	Precio unitario de venta al público.
Categoria	string	Clasificación del producto (p. ej., Medicamentos, Alimentos).
Proveedor	string	Distribuidor o fabricante asociado.
ImagenUrl	string	Enlace relativo o remoto de la imagen principal.
UnidadMedida	string	Presentación del ítem (Caja, Frasco, Kg, Unidad).
Activo	bool	Define si el producto está habilitado para comercialización.
FechaRegistro	DateTime	Marca de tiempo sobre cuándo se dio de alta.
Entidad: Inventario
Campo	Tipo	Descripción
Id	Guid / int	Clave primaria del registro de inventario.
ProductoId	Guid / int	Llave foránea conectada a la entidad Producto.
AlmacenId	Guid / int	Llave foránea conectada al módulo de almacenes.
Cantidad	int	Unidades disponibles actualmente físicas y vendibles.
StockMinimo	int	Umbral para disparar alertas de reabastecimiento.
StockMaximo	int	Límite máximo de capacidad sugerido para ese almacén.
FechaActualizacion	DateTime	Registro automático del último movimiento o cambio.
3. Especificación de Endpoints (API Reference)
Consultar todo el inventario
•	Método: GET
•	Ruta: /api/Inventario
•	Respuesta exitosa: 200 OK (Devuelve una lista con el inventario e información anidada de producto y almacén).
Consultar registro por ID
•	Método: GET
•	Ruta: /api/Inventario/{id}
•	Respuestas:
o	200 OK si el registro existe.
o	404 Not Found si la clave enviada no corresponde a ningún registro.
Consultar existencias por Almacén
•	Método: GET
•	Ruta: /api/Inventario/almacen/{almacenId}
•	Respuesta exitosa: 200 OK (Filtra todos los ítems guardados en la ubicación solicitada).
Consultar existencias por Producto
•	Método: GET
•	Ruta: /api/Inventario/producto/{productoId}
•	Respuesta exitosa: 200 OK (Devuelve las existencias de este producto repartidas en los distintos almacenes).
Consultar productos con stock bajo
•	Método: GET
•	Ruta: /api/Inventario/stock-bajo
•	Respuesta exitosa: 200 OK (Filtra los registros donde Cantidad <= StockMinimo).
Registrar nuevo inventario
•	Método: POST
•	Ruta: /api/Inventario
•	Cuerpo de la petición (application/json):
JSON
{
  "productoId": 105,
  "almacenId": 2,
  "cantidad": 50,
  "stockMinimo": 10,
  "stockMaximo": 100
}
•	Respuestas:
o	201 Created: El registro se creó correctamente.
o	400 Bad Request: Si no se cumplen las reglas de validación de cantidades.
o	409 Conflict: Si el producto ya tiene un inventario registrado en ese almacén.
Actualizar inventario
•	Método: PUT
•	Ruta: /api/Inventario/{id}
•	Cuerpo de la petición (application/json):
JSON
{
  "cantidad": 45,
  "stockMinimo": 10,
  "stockMaximo": 100
}
•	Respuestas:
o	204 No Content: Modificación procesada con éxito.
o	400 Bad Request: Datos de cantidades incoherentes.
o	404 Not Found: El registro no existe.
Eliminar inventario
•	Método: DELETE
•	Ruta: /api/Inventario/{id}
•	Respuestas:
o	204 No Content: Registro removido.
o	404 Not Found: Registro no ubicado.
4. Reglas de Negocio y Validaciones
La API aplica una serie de filtros lógicos antes de procesar inserciones o cambios. En caso de fallos, responderá con un código 400 Bad Request indicando el motivo:
1.	Valores positivos: Ningún parámetro numérico (Cantidad, StockMinimo, StockMaximo) puede ser un valor negativo.
2.	Coherencia de límites: El StockMaximo no puede ser inferior al StockMinimo.
3.	Límite superior: La Cantidad enviada no puede sobrepasar el valor fijado en StockMaximo.
4.	Existencia previa: Tanto el ProductoId como el AlmacenId deben estar previamente registrados y activos en la base de datos.
5.	Unicidad: La combinación ProductoId + AlmacenId es única. Si ya existe, se debe usar la ruta de actualización (PUT) en lugar de creación (POST).
5. Guía Operativa para Comercios
Si administras una veterinaria o comercio dentro de OpenPaw, estos son los procesos habituales para controlar tu mercancía:
1.	Ingreso de mercancía nueva:
o	Selecciona el producto del catálogo general y el almacén de destino.
o	Define la cantidad inicial disponible y un límite de StockMinimo (por ejemplo, 5 unidades).
o	Envía la solicitud. Si el ítem ya existía en esa sede, modifica el registro existente en lugar de intentar crearlo de nuevo.
2.	Ajuste diario por ventas o faltantes:
o	Cuando vendas productos por fuera del sistema central o recibas nuevas cajas del proveedor, utiliza el endpoint de actualización enviando la cifra real disponible.
o	La plataforma actualizará de forma automática el campo FechaActualizacion.
3.	Revisión de stock crítico:
o	Revisa periódicamente la sección de stock bajo. Esta vista recopila automáticamente todos los productos cuyas existencias hayan alcanzado o bajado de la marca mínima, evitándote sorpresas o quiebres de inventario.
6. Flujo de Sincronización con el Marketplace
El Marketplace consulta la API de Inventario para ofrecer disponibilidad en tiempo real a los compradores.
Diagrama de Sincronización de Inventario

[Comercio / ERP]
       |
       | (1. Registra o actualiza inventario)
       v
[InventarioController] <-----------------------------------------+
       |                                                          |
       | (2. Verifica: Existencia, Cantidades, Evita duplicados)  |
       v                                                          |
[Validaciones OK]                                                 |
       |                                                          |
       | (3. Guarda datos y actualiza marcas de tiempo)           |
       v                                                          |
[Base de Datos / EF Core]                                         |
                                                                   |
                        [Marketplace OpenPaw] ----------(4. Consulta de disponibilidad
                               |                          en tiempo real)-------------^
                               |
                               | (5. Muestra catálogo actualizado al usuario final)
                               v
                        [Cliente Final]

Detalle de la sincronización:
•	Asignación Multialmacén: Si un comercio posee tres sucursales registradas, el sistema acumulará las existencias de los tres almacenes para ese producto o permitirá filtrar por la ubicación elegida por el comprador.
•	Cero Overselling: Cada transacción realizada a través del Marketplace verifica las existencias guardadas en InventarioRepository. Si la cantidad baja a cero, el Marketplace deshabilita el botón de compra al instante para ese ítem en específico.

