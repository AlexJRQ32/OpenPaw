/**
 * exportarCSV — exportación de inventario a CSV generada en frontend (T34).
 *
 * El backend no expone un endpoint de exportación; se genera el CSV desde los
 * datos ya cargados en la página (decisión: sin inventar endpoints nuevos).
 * Soporta CSV (Excel es-CR) con BOM UTF-8 para acentos.
 */

/**
 * escaparCSV — escapa un valor para CSV.
 *  - Comillas/commas/saltos: entrecomillado estándar.
 *  - CSV/formula injection (QA T34): si el valor empieza con = + - @ se
 *    antepone un apóstrofo para que Excel lo trate como texto, no fórmula.
 */
function escaparCSV(valor) {
  let texto = String(valor ?? '')
  if (/^[=+\-@]/.test(texto.trimStart())) {
    texto = `'${texto}`
  }
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

/**
 * Convierte los registros de inventario a texto CSV.
 * @param {Array} inventario Registros con { producto, almacen, cantidad, stockMinimo, stockMaximo }
 * @param {(item) => { label: string }} estadoStock Fn que resuelve el estado (label) de un registro.
 * @returns {string} CSV con BOM UTF-8.
 */
export function inventarioACSV(inventario, estadoStock) {
  const encabezados = ['Producto', 'Categoría', 'Almacén', 'Cantidad', 'Stock mínimo', 'Stock máximo', 'Estado']
  const filas = (Array.isArray(inventario) ? inventario : []).map((item) => [
    item.producto?.nombre || `Producto #${item.productoId ?? '?'}`,
    item.producto?.categoria || '',
    item.almacen?.nombre || `Almacén #${item.almacenId ?? '?'}`,
    item.cantidad ?? '',
    item.stockMinimo ?? '',
    item.stockMaximo ?? '',
    estadoStock ? estadoStock(item).label : '',
  ])

  const cuerpo = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCSV).join(','))
    .join('\r\n')
  return `\uFEFF${cuerpo}`
}

/**
 * Descarga el inventario como archivo CSV (client-side).
 * @param {Array} inventario Registros de inventario.
 * @param {(item) => { label: string }} estadoStock Resolvedor de estado.
 * @param {string} nombreArchivo Nombre del archivo descargado.
 */
export function descargarInventarioCSV(inventario, estadoStock, nombreArchivo = 'inventario-openpaw.csv') {
  const csv = inventarioACSV(inventario, estadoStock)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // revoke diferido (QA T34): revocar síncrono tras click puede abortar la
  // descarga en Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export default descargarInventarioCSV