/**
 * coordsTraslado — helpers de coordenadas, popup del mapa y timeline de
 * traslados (T35, rediseño Sprint 2).
 *
 * El backend expone coordenadas en dos capas:
 *   1. TrasladoExpedienteDto: OrigenLatitud/Longitud + DestinoLatitud/Longitud
 *      (decimal?, solo se pueblan si el cliente las envía al crear/actualizar).
 *   2. VeterinariaDto (GET /veterinarias/aprobadas): Latitud/Longitud de cada
 *      veterinaria registrada (decimal?).
 *
 * Estrategia de resolución del punto (mejor → peor):
 *   a) Coordenadas REALES del traslado (si las 4 son válidas).
 *   b) Coordenadas REALES de la veterinaria origen/destino del listado
 *      cargado por el hook (si la veterinaria las tiene).
 *   c) APROXIMACIÓN POSICIONAL documentada: offset determinístico en el Gran
 *      Área Metropolitana de Costa Rica (locale es-CR de OpenPaw), derivado
 *      del id de la veterinaria — mismo criterio posicional de ProfileMap
 *      (T28) e InventarioMap (T34). Sin geocodificación inventada.
 *
 * Seguridad (patrón popupMapa T34): los nombres de veterinaria se interpolan
 * en el HTML del popup de Leaflet; TODO texto se escapa con escapeHtml.
 */

/** Centro del GAM de Costa Rica (locale es-CR de OpenPaw). */
const CENTRO_LAT = 9.9281
const CENTRO_LNG = -84.0907

/** Rangos válidos de una coordenada geográfica. null/undefined/'' se
    rechazan ANTES de Number() (los DTOs serializan los decimales nulos como
    null; Number(null) === 0 pasaría la validación por error). */
export function esCoordenadaValida(lat, lng) {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return false
  }
  const latNum = Number(lat)
  const lngNum = Number(lng)
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 && latNum <= 90 &&
    lngNum >= -180 && lngNum <= 180
  )
}

/**
 * coordsPosicionales — aproximación posicional DOCUMENTADA para cuando el
 * backend no expone coordenadas del traslado ni de la veterinaria.
 * Desplaza el centro del GAM con un patrón determinístico basado en el id
 * (±0.09° lat / ±0.12° lng ≈ ±10–13 km, distancias plausibles entre clínicas
 * del GAM). Los ids origen/destino siempre difieren (validación backend), así
 * que los dos puntos nunca colapsan en el mismo lugar.
 */
export function coordsPosicionales(id) {
  const lat = CENTRO_LAT + (((id % 7) - 3) * 0.03)
  const lng = CENTRO_LNG + ((((id * 3) % 9) - 4) * 0.03)
  return { lat, lng }
}

/**
 * resolverPunto — resuelve un punto origen/destino con la estrategia de tres
 * capas documentada arriba.
 *
 * @param {object} coordsTraslado  { lat, lng } del DTO de traslado (nullable).
 * @param {object} vetCoords       { lat, lng } de la veterinaria del listado (nullable).
 * @param {number} idFallback      id de la veterinaria para la aproximación posicional.
 * @returns {{ lat: number, lng: number, esReal: boolean }}
 *   esReal=true → coordenadas reales del backend; esReal=false → aproximación.
 */
export function resolverPunto(coordsTraslado, vetCoords, idFallback) {
  if (esCoordenadaValida(coordsTraslado?.lat, coordsTraslado?.lng)) {
    return { lat: Number(coordsTraslado.lat), lng: Number(coordsTraslado.lng), esReal: true }
  }
  if (esCoordenadaValida(vetCoords?.lat, vetCoords?.lng)) {
    return { lat: Number(vetCoords.lat), lng: Number(vetCoords.lng), esReal: true }
  }
  return { ...coordsPosicionales(Number(idFallback) || 1), esReal: false }
}

/** Punto ORIGEN de un traslado (coordenadas reales o aproximación posicional). */
export function puntoOrigen(traslado, veterinarias = []) {
  const vet = veterinarias.find((v) => Number(v.id) === Number(traslado.veterinariaOrigenId))
  return resolverPunto(
    { lat: traslado.origenLatitud, lng: traslado.origenLongitud },
    { lat: vet?.latitud, lng: vet?.longitud },
    traslado.veterinariaOrigenId
  )
}

/** Punto DESTINO de un traslado (coordenadas reales o aproximación posicional). */
export function puntoDestino(traslado, veterinarias = []) {
  const vet = veterinarias.find((v) => Number(v.id) === Number(traslado.veterinariaDestinoId))
  return resolverPunto(
    { lat: traslado.destinoLatitud, lng: traslado.destinoLongitud },
    { lat: vet?.latitud, lng: vet?.longitud },
    traslado.veterinariaDestinoId
  )
}

/* ---------------------------------------------------------------------------
   Formateo de fechas (locale es-CR)
   --------------------------------------------------------------------------- */

export function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ---------------------------------------------------------------------------
   Popup del mapa (XSS-safe, patrón popupMapa T34)
   --------------------------------------------------------------------------- */

/** escapeHtml — escapa texto plano para inyección segura en HTML. */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch])
}

/**
 * buildPopupHtml — HTML del popup de la ruta punto a punto.
 * Origen/destino reciben { nombre, esReal }. Exportado para testing (QA):
 * verifica que nombres maliciosos se escapan (XSS stored).
 */
export function buildPopupHtml(origen, destino) {
  const origenNombre = escapeHtml(origen?.nombre || 'Veterinaria de origen')
  const destinoNombre = escapeHtml(destino?.nombre || 'Veterinaria de destino')
  const aproximado = !origen?.esReal || !destino?.esReal
  return [
    '<strong>Ruta de traslado</strong>',
    `<p class="traslado-map__popup-route"><span>${origenNombre}</span> → <span>${destinoNombre}</span></p>`,
    aproximado ? '<p class="traslado-map__popup-note">Coordenadas aproximadas (posición en Costa Rica)</p>' : '',
  ].join('')
}

/* ---------------------------------------------------------------------------
   Timeline del historial del traslado (Timeline del DS, Task #16)
   ---------------------------------------------------------------------------
   El backend expone el ciclo de aprobación (FechaSolicitud, FechaRespuesta,
   Estado, MotivoRechazo) y el ciclo logístico paralelo (EstadoLogistica,
   Salida, EtaLlegada). Cada evento se construye SOLO con datos reales; los
   campos logísticos nulos simplemente omiten su evento.
   --------------------------------------------------------------------------- */

/**
 * construirEventosTimeline — eventos del historial de un traslado.
 *
 * @param {object} traslado DTO de TrasladoExpediente (backend).
 * @param {object} nombres  { mascota, origen, destino } nombres resueltos.
 * @returns {Array} items compatibles con <Timeline items={...}/> del DS.
 */
export function construirEventosTimeline(traslado, nombres = {}) {
  const mascota = nombres.mascota || 'Mascota'
  const origen = nombres.origen || 'Veterinaria de origen'
  const destino = nombres.destino || 'Veterinaria de destino'
  const eventos = []

  eventos.push({
    key: `solicitud-${traslado.id}`,
    icono: 'send',
    tipo: 'primary',
    tipoLabel: 'Solicitud',
    titulo: 'Solicitud de traslado',
    descripcion: `${mascota} · ${origen} → ${destino}`,
    fecha: formatFechaHora(traslado.fechaSolicitud),
    ubicacion: origen,
  })

  if (traslado.estadoLogistica === 'EnTransito' || traslado.salida) {
    eventos.push({
      key: `salida-${traslado.id}`,
      icono: 'local_shipping',
      tipo: 'tertiary',
      tipoLabel: 'En tránsito',
      titulo: `Salida de ${origen}`,
      descripcion: 'El expediente viaja hacia la veterinaria destino.',
      fecha: formatFechaHora(traslado.salida ?? traslado.fechaSolicitud),
      ubicacion: origen,
    })
  }

  if (traslado.estadoLogistica === 'Completado') {
    eventos.push({
      key: `llegada-${traslado.id}`,
      icono: 'flag',
      tipo: 'secondary',
      tipoLabel: 'Completado',
      titulo: `Llegada a ${destino}`,
      descripcion: 'Expediente entregado en la veterinaria destino.',
      fecha: formatFechaHora(traslado.etaLlegada ?? traslado.fechaRespuesta ?? traslado.fechaSolicitud),
      ubicacion: destino,
    })
  }

  if (traslado.estado === 'Aceptado') {
    eventos.push({
      key: `aceptado-${traslado.id}`,
      icono: 'check_circle',
      tipo: 'secondary',
      tipoLabel: 'Aceptado',
      titulo: 'Traslado aceptado',
      descripcion: `La veterinaria de cabecera de ${mascota} ahora es ${destino}.`,
      fecha: formatFechaHora(traslado.fechaRespuesta),
      ubicacion: destino,
    })
  } else if (traslado.estado === 'Rechazado') {
    eventos.push({
      key: `rechazado-${traslado.id}`,
      icono: 'cancel',
      tipo: 'error',
      tipoLabel: 'Rechazado',
      titulo: 'Traslado rechazado',
      descripcion: traslado.motivoRechazo || 'Sin motivo registrado.',
      fecha: formatFechaHora(traslado.fechaRespuesta),
      ubicacion: destino,
    })
  } else {
    eventos.push({
      key: `pendiente-${traslado.id}`,
      icono: 'schedule',
      tipo: 'tertiary',
      tipoLabel: 'Pendiente',
      titulo: 'A la espera de aprobación',
      descripcion: 'La veterinaria destino aún no responde la solicitud.',
    })
  }

  return eventos
}