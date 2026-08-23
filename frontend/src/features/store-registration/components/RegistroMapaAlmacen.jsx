import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from '../../../shared/components/Icon/Icon'

/**
 * RegistroMapaAlmacen — mapa Leaflet posicional (T38, MISMO patrón que el
 * RegistroMapaUbicacion de T37: decisión PO #28/#34/#35).
 *
 * El DTO backend (`CrearAlmacenDto`) SÍ acepta Latitud/Longitud
 * (opcionales), pero el frontend no tiene geocodificación: no existe forma de
 * derivar coordenadas reales desde la dirección de texto libre. Enviar las
 * coordenadas FIJAS del pin contaminaría la BD con ubicaciones falsas, así que
 * el mapa es POSICIONAL — centro por defecto en Costa Rica (locale es-CR de
 * OpenPaw) con marcador fijo y chip que refleja la dirección tecleada — y el
 * payload de registro sigue siendo texto-only (sin lat/lng).
 *
 * Sin popup: el chip es texto plano renderizado por React FUERA del div del
 * mapa (los hijos de role="img" se ocultan a lectores de pantalla), por lo que
 * no aplica el patrón escapeHtml/buildPopupHtml de T34.
 *
 * Robustez (heredado de ProfileMap/RegistroMapaUbicacion):
 *  - Inicialización en useEffect con guard try/catch (entornos sin layout
 *    real, ej. jsdom, degradan a un contenedor vacío sin romper la página).
 *  - Cleanup con map.remove() al desmontar.
 *  - DivIcon inline (pin SVG con token M3) para no depender de los assets
 *    por defecto de Leaflet que rompen con bundlers.
 *  - El botón "centrar" usa setView (sin animación): seguro con
 *    prefers-reduced-motion y determinista en jsdom.
 */

const CENTRO = [9.9281, -84.0907] // San José, Costa Rica
const ZOOM = 12

const PIN_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="var(--md-primary)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`

export function RegistroMapaAlmacen({
  direccion = '',
  ariaLabel = 'Mapa referencial de la ubicación del almacén',
}) {
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
        className: 'sreg-map-pin',
        html: PIN_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
      })

      const map = L.map(container, {
        center: CENTRO,
        zoom: ZOOM,
        zoomControl: false,
        attributionControl: true,
        zoomAnimation: !reduceMotion,
        fadeAnimation: !reduceMotion,
        markerZoomAnimation: !reduceMotion,
        scrollWheelZoom: false, /* evita "secuestro" del scroll al llenar el formulario */
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      L.marker(CENTRO, { icon: pin, title: 'Ubicación referencial' }).addTo(map)

      mapRef.current = map
    } catch {
      // Sin layout real (jsdom): el contenedor queda vacío; el chip mantiene
      // la dirección accesible como texto.
      mapRef.current = null
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const recentrar = () => {
    try {
      mapRef.current?.setView(CENTRO, ZOOM)
    } catch {
      /* mapa nunca inicializado (jsdom): recentrar es un no-op seguro */
    }
  }

  const zonaTexto = String(direccion || '').trim() || 'San José, Costa Rica'

  return (
    <div className="sreg-map">
      <div
        className="sreg-map__canvas"
        ref={containerRef}
        role="img"
        aria-label={`${ariaLabel}. Zona: ${zonaTexto}`}
      />
      <div className="sreg-map__overlay">
        <span className="sreg-map__chip">{zonaTexto}</span>
        <button
          type="button"
          className="sreg-map__locate"
          onClick={recentrar}
          aria-label="Centrar el mapa en Costa Rica"
          title="Centrar mapa"
        >
          <Icon name="my_location" size={20} />
        </button>
      </div>
    </div>
  )
}

export default RegistroMapaAlmacen
