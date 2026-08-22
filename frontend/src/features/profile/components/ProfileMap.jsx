import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * ProfileMap — mapa Leaflet (T28, decisión PO: open-source, sin API key).
 *
 * El backend no expone coordenadas del usuario (solo `direccion` en texto
 * libre), así que el mapa es posicional: centro por defecto en Costa Rica
 * (locale es-CR de OpenPaw) con un marcador de "zona de cobertura activa",
 * igual que el chip del wireframe. Sin geocodificación inventada.
 *
 * Robustez:
 *  - Inicialización en useEffect con guard try/catch (entornos sin layout
 *    real, ej. jsdom, degradan a un contenedor vacío sin romper la página).
 *  - cleanup con map.remove() al desmontar.
 *  - DivIcon inline (pin SVG con token M3) para no depender de los assets
 *    por defecto de Leaflet que rompen con bundlers.
 *  - prefers-reduced-motion: desactiva animaciones de zoom/fade del mapa.
 *  - a11y: contenedor role="img" + aria-label (el chip HTML con texto va
 *    fuera del div del mapa, en la card).
 */
const CENTRO = [9.9281, -84.0907] // Costa Rica

const PIN_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="var(--md-primary)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`

export function ProfileMap({ ariaLabel = 'Mapa de ubicación de cobertura activa' }) {
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
        className: 'profile-map-pin',
        html: PIN_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30],
      })

      const map = L.map(container, {
        center: CENTRO,
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
        zoomAnimation: !reduceMotion,
        fadeAnimation: !reduceMotion,
        markerZoomAnimation: !reduceMotion,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      L.marker(CENTRO, { icon: pin, title: 'Zona de cobertura activa' }).addTo(map)

      mapRef.current = map
    } catch {
      // Sin layout real (jsdom) o Leaflet no disponible: el contenedor queda
      // vacío; el chip de la card mantiene la info textual accesible.
      mapRef.current = null
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div className="profile-map" ref={containerRef} role="img" aria-label={ariaLabel} />
}