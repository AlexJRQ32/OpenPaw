/**
 * popupMapa — helpers de construcción del popup del mapa de almacenes (T34).
 *
 * Separado de InventarioMap.jsx por la regla react-refresh/only-export-components
 * (un archivo de componente solo puede exportar componentes).
 *
 * Seguridad (QA T34, XSS stored): `almacen.nombre`/`almacen.direccion` vienen
 * del backend y se interpolan en el HTML del popup; TODO texto se escapa con
 * escapeHtml antes de insertarlo.
 */

/**
 * escapeHtml — escapa texto plano para inyección segura en HTML.
 * Escapa & < > " '.
 */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]))
}

/**
 * buildPopupHtml — HTML del popup agregado del mapa con los almacenes.
 * Exportado para testing: QA exige verificar que el string generado escapa
 * nombres/direcciones maliciosas (ej. `<img src=x onerror=alert(1)>`).
 *
 * Un solo popup agregado (los marcadores apilados en el mismo punto solo
 * dejan clickeable al superior; un marcador con lista es accesible y simple,
 * sin cluster lib).
 */
export function buildPopupHtml(almacenes) {
  const items = Array.isArray(almacenes) ? almacenes.slice(0, 12) : []
  if (items.length === 0) {
    return '<strong>Red de almacenes OpenPaw</strong><br/>Sin almacenes registrados'
  }
  const filas = items
    .map((almacen) => {
      const nombre = almacen?.nombre || `Almacén #${almacen?.id ?? '?'}`
      const direccion = almacen?.direccion || 'Sin dirección registrada'
      return `<li><strong>${escapeHtml(nombre)}</strong><br/>${escapeHtml(direccion)}</li>`
    })
    .join('')
  const titulo = items.length === 1 ? '1 almacén' : `${items.length} almacenes`
  return `<strong>${titulo}</strong><ul class="inventario-map__popup-list">${filas}</ul>`
}

export default buildPopupHtml