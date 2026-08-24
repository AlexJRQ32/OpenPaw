/* ==========================================================================
   Aportes médicos — utilidades de formato (Sprint 2, tarea #36).
   Funciones puras sin React (fáciles de testear) usadas por AportesPage.
   ========================================================================== */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fechaValida(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/* "12 de Agosto, 2023" — formato de fecha del wireframe aportes_médicos. */
export function formatFechaLarga(iso) {
  const d = fechaValida(iso)
  if (!d) return ''
  return `${d.getDate()} de ${MESES[d.getMonth()]}, ${d.getFullYear()}`
}

/* Fecha + hora corta es-CR para metadatos (pie de tarjeta: "Registrado el…"). */
export function formatFechaHora(iso) {
  const d = fechaValida(iso)
  if (!d) return ''
  return d.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* "Hace 2 meses" — fila "Última visita" del resumen (wireframe). */
export function tiempoRelativo(iso) {
  const d = fechaValida(iso)
  if (!d) return 'Sin visitas'
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 31) return `Hace ${dias} días`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`
  const anios = Math.floor(dias / 365)
  return anios === 1 ? 'Hace 1 año' : `Hace ${anios} años`
}

/* El backend guarda Medicamentos como texto libre; el wireframe los muestra
   como chips. Se separa por coma, punto y coma, salto de línea o " + "
   (dosis combinadas), se recorta y se deduplica sin alterar el orden. */
export function parseMedicamentos(texto) {
  if (!texto) return []
  const bruto = String(texto)
    .split(/[,;\n]|\s\+\s/)
    .map((s) => s.trim())
    .filter(Boolean)
  const unicos = []
  const vistos = new Set()
  for (const med of bruto) {
    const clave = med.toLowerCase()
    if (!vistos.has(clave)) {
      vistos.add(clave)
      unicos.push(med)
    }
  }
  return unicos
}

/* Hardening XSS: solo http/https puede usarse como href de un adjunto
   (bloquea javascript:, data:, vbscript:, etc.). */
export function esUrlAdjuntoSegura(url) {
  try {
    const u = new URL(String(url))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/* Nombre legible del adjunto a partir del último segmento de la ruta. */
export function nombreArchivoAdjunto(url) {
  try {
    const u = new URL(String(url))
    const ultimo = u.pathname.split('/').filter(Boolean).pop()
    if (!ultimo) return 'Archivo adjunto'
    try {
      return decodeURIComponent(ultimo) || 'Archivo adjunto'
    } catch {
      return ultimo
    }
  } catch {
    return 'Archivo adjunto'
  }
}

const EXT_IMAGEN = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic'])

/* Icono Material Symbols según extensión (pdf → documento, imagen → image). */
export function iconoAdjunto(url) {
  let ext = ''
  try {
    const u = new URL(String(url))
    ext = (u.pathname.split('.').pop() || '').toLowerCase()
  } catch {
    /* URL inválida → icono genérico */
  }
  if (!ext || ext.length > 5) return 'attachment'
  if (ext === 'pdf') return 'description'
  if (EXT_IMAGEN.has(ext)) return 'image'
  return 'attachment'
}
