import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildPopupHtml } from '../utils/popupMapa'
import './InventarioMap.css'

/**
 * InventarioMap — mapa Leaflet de almacenes/ubicaciones (T34, decisión PO:
 * mapa de almacenes del inventario; Leaflet open-source, sin API key).
 *
 * El backend no expone coordenadas de los almacenes (solo `nombre` y
 * `direccion` en texto libre), así que el mapa es posicional: centro en Costa
 * Rica (locale es-CR de OpenPaw) con un marcador agregado (popup con la lista
 * de almacenes cargados). Sin geocodificación inventada (criterio ProfileMap
 * T28).
 *
 * Robustez (heredado de ProfileMap):
 *  - Inicialización en useEffect con guard try/catch (jsdom degrada a un
 *    contenedor vacío sin romper la página).
 *  - cleanup con map.remove() al desmontar.
 *  - DivIcon inline (pin SVG con token M3) para no depender de los assets
 *    por defecto de Leaflet.
 *  - prefers-reduced-motion: desactiva animaciones de zoom/fade del mapa.
 *  - a11y: contenedor role="img" + aria-label; los nombres de almacén van en
 *    el chip de la card (fuera del div del mapa) y en el popup.
 *  - Seguridad (QA T34): el HTML del popup se construye con buildPopupHtml,
 *    que escapa nombre/dirección (fix XSS stored).
 *
 * Props:
 *   almacenes  Array de { id, nombre, direccion }.
 *   ariaLabel  Descripción para lectores de pantalla.
 */
const CENTRO = [9.9281, -84.0907] // Costa Rica

const PIN_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="var(--md-primary)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`

export function InventarioMap({ almacenes = [], ariaLabel = 'Mapa de ubicaciones de almacenamiento de inventario' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return undefined

    try {
      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const pin = L.divIcon({
        className: 'inventario-map-pin',
        html: PIN_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30],
      })

      const map = L.map(container, {
        center: CENTRO,
        zoom: 8,
        zoomControl: true,
        attributionControl: true,
        zoomAnimation: !reduceMotion,
        fadeAnimation: !reduceMotion,
        markerZoomAnimation: !reduceMotion,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      /* Un solo marcador con popup agregado. El HTML del popup SIEMPRE pasa
         por buildPopupHtml → escapeHtml (fix XSS stored QA). */
      L.marker(CENTRO, { icon: pin, title: 'Almacenes OpenPaw' })
        .addTo(map)
        .bindPopup(buildPopupHtml(almacenes))

      mapRef.current = map
    } catch {
      // Sin layout real (jsdom) o Leaflet no disponible: contenedor vacío;
      // el chip de la card mantiene la info textual accesible.
      mapRef.current = null
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [almacenes])

  return <div className="inventario-map" ref={containerRef} role="img" aria-label={ariaLabel} />
}

export default InventarioMap