import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildPopupHtml, esCoordenadaValida } from '../utils/coordsTraslado'
import './TrasladoMap.css'

/**
 * TrasladoMap — mapa Leaflet punto a punto origen→destino (T35, decisión PO:
 * mezcla del dominio de aprobación de traslados con el wireframe de mapa
 * entre veterinarias; Leaflet open-source, sin API key).
 *
 * Coordenadas (tres capas, documentadas en utils/coordsTraslado):
 *   1. Coordenadas REALES del traslado (OrigenLatitud/Longitud +
 *      DestinoLatitud/Longitud) si están presentes y son válidas.
 *   2. Coordenadas REALES de las veterinarias del listado (Latitud/Longitud).
 *   3. APROXIMACIÓN POSICIONAL en el GAM de Costa Rica derivada del id de la
 *      veterinaria (criterio posicional de ProfileMap T28 / InventarioMap T34,
 *      sin geocodificación inventada). La caption de la página muestra el
 *      badge "Coordenadas aproximadas" cuando esReal=false.
 *
 * Robustez (heredado de ProfileMap/InventarioMap):
 *  - Inicialización en useEffect con guard try/catch (jsdom degrada a un
 *    contenedor vacío sin romper la página).
 *  - cleanup con map.remove() al desmontar; se re-crea si cambia la ruta.
 *  - DivIcon inline (pines SVG con token M3) para no depender de los assets
 *    por defecto de Leaflet.
 *  - prefers-reduced-motion: desactiva animaciones de zoom/fade del mapa.
 *  - a11y: contenedor role="img" + aria-label; los nombres de origen/destino
 *    van en la caption de la card (fuera del div del mapa) y en el popup.
 *  - Seguridad (patrón QA T34): el popup usa buildPopupHtml (escapeHtml) para
 *    evitar XSS stored con nombres de veterinaria maliciosos.
 *
 * Props:
 *   origen   { lat, lng, nombre, esReal }
 *   destino  { lat, lng, nombre, esReal }
 *   estadoLogistica  Programado | EnTransito | Completado (color de la ruta).
 *   ariaLabel        Descripción para lectores de pantalla.
 */
const CENTRO = [9.9281, -84.0907] // Costa Rica (GAM)

/* Pines SVG: origen en primary, destino en secondary. El fill usa tokens M3
   (var(--md-*)) para que sigan el tema activo. */
const PIN_ORIGEN_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="var(--md-primary)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`

const PIN_DESTINO_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="var(--md-secondary)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`

/* Resuelve el valor de un token M3 al color concreto (Leaflet pinta SVG paths
   con atributos de estilo; var() se resuelve con getComputedStyle). El
   fallback repite los valores de marca de tokens.css (M3: primary/secondary/
   tertiary). */
function tokenValor(nombre, fallback) {
  try {
    const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
    return valor || fallback
  } catch {
    return fallback
  }
}

export function TrasladoMap({
  origen,
  destino,
  estadoLogistica = 'Programado',
  ariaLabel = 'Mapa de ruta del traslado entre veterinarias',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  /* Ruta válida solo si ambos puntos existen y son coordenadas geográficas
     correctas (jsdom/estado vacío degradan a contenedor vacío). Se extraen
     primitivas para mantener deps del effect sin objetos inestables. */
  const tieneRuta = Boolean(
    origen && destino &&
    esCoordenadaValida(origen.lat, origen.lng) &&
    esCoordenadaValida(destino.lat, destino.lng)
  )
  const origenLat = tieneRuta ? Number(origen.lat) : null
  const origenLng = tieneRuta ? Number(origen.lng) : null
  const destinoLat = tieneRuta ? Number(destino.lat) : null
  const destinoLng = tieneRuta ? Number(destino.lng) : null
  const origenNombre = origen?.nombre || 'Veterinaria de origen'
  const destinoNombre = destino?.nombre || 'Veterinaria de destino'
  const origenEsReal = Boolean(origen?.esReal)
  const destinoEsReal = Boolean(destino?.esReal)

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current || !tieneRuta) return undefined

    try {
      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const pinOrigen = L.divIcon({
        className: 'traslado-map__pin traslado-map__pin--origen',
        html: PIN_ORIGEN_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30],
      })

      const pinDestino = L.divIcon({
        className: 'traslado-map__pin traslado-map__pin--destino',
        html: PIN_DESTINO_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30],
      })

      const origenLL = L.latLng(origenLat, origenLng)
      const destinoLL = L.latLng(destinoLat, destinoLng)

      const map = L.map(container, {
        center: CENTRO,
        zoom: 10,
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

      /* Línea de ruta: casing blanco (on-primary) + trazo principal con el
         color del estado logístico (programado=primary, en tránsito=tertiary,
         completado=secondary). */
      const rutaColor =
        estadoLogistica === 'EnTransito' ? tokenValor('--md-tertiary', '#7c4900')
          : estadoLogistica === 'Completado' ? tokenValor('--md-secondary', '#226a54')
            : tokenValor('--md-primary', '#004fb7')

      L.polyline([origenLL, destinoLL], {
        color: tokenValor('--md-on-primary', '#ffffff'),
        weight: 7,
        opacity: 0.9,
        interactive: false,
      }).addTo(map)
      L.polyline([origenLL, destinoLL], {
        color: rutaColor,
        weight: 3,
        dashArray: '7 8',
        interactive: false,
      }).addTo(map)

      /* El popup SIEMPRE pasa por buildPopupHtml → escapeHtml (fix XSS stored). */
      L.marker(origenLL, { icon: pinOrigen, title: origenNombre })
        .addTo(map)
        .bindPopup(buildPopupHtml({ nombre: origenNombre, esReal: origenEsReal }, { nombre: destinoNombre, esReal: destinoEsReal }))
      L.marker(destinoLL, { icon: pinDestino, title: destinoNombre })
        .addTo(map)
        .bindPopup(buildPopupHtml({ nombre: origenNombre, esReal: origenEsReal }, { nombre: destinoNombre, esReal: destinoEsReal }))

      try {
        map.fitBounds(L.latLngBounds([origenLL, destinoLL]).pad(0.4), { maxZoom: 14 })
      } catch {
        map.setView(CENTRO, 10)
      }

      mapRef.current = map
    } catch {
      // Sin layout real (jsdom) o Leaflet no disponible: el contenedor queda
      // vacío; la caption de la card mantiene la info textual accesible.
      mapRef.current = null
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [
    tieneRuta,
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    origenNombre,
    destinoNombre,
    origenEsReal,
    destinoEsReal,
    estadoLogistica,
  ])

  return <div className="traslado-map" ref={containerRef} role="img" aria-label={ariaLabel} />
}

export default TrasladoMap