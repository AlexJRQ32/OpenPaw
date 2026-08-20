import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL } from '../../../constants'

export function useMarketplaceProducts() {
  const [inventory, setInventory] = useState([])
  const [veterinarias, setVeterinarias] = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        // El marketplace es publico: usar fetch simple (no redirige a login en 401)
        const [invRes, vetRes, srvRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventario`),
          fetch(`${API_BASE_URL}/veterinarias/aprobadas`),
          fetch(`${API_BASE_URL}/serviciosveterinarios`),
        ])
        if (cancelled) return
        if (!invRes.ok) throw new Error('No se pudo cargar el inventario del marketplace.')
        const invData = await invRes.json()
        const vetData = vetRes.ok ? await vetRes.json() : []
        const srvData = srvRes.ok ? await srvRes.json() : []
        setInventory(Array.isArray(invData) ? invData : [])
        setVeterinarias(Array.isArray(vetData) ? vetData : [])
        setServicios(Array.isArray(srvData) ? srvData : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar el marketplace.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  // Productos con stock disponible, normalizados
  const products = inventory
    .filter((item) => item.cantidad > 0 && item.producto?.activo !== false)
    .map((item) => ({
      id: item.producto.id,
      inventarioId: item.id,
      nombre: item.producto.nombre,
      descripcion: item.producto.descripcion,
      precio: item.producto.precio,
      categoria: item.producto.categoria,
      proveedor: item.producto.proveedor,
      imagenUrl: item.producto.imagenUrl,
      unidadMedida: item.producto.unidadMedida,
      stock: item.cantidad,
      stockMinimo: item.stockMinimo,
      stockMaximo: item.stockMaximo,
      almacenId: item.almacenId,
      almacenNombre: item.almacen?.nombre || `Almacen #${item.almacenId}`,
      veterinariaId: item.almacen?.veterinariaId ?? null,
      veterinariaNombre: item.almacen?.veterinaria?.nombre || null,
    }))

  // Servicios activos, normalizados
  const services = servicios
    .filter((s) => s.activo !== false)
    .map((s) => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: s.precio,
      categoria: s.categoria,
      duracionMinutos: s.duracionMinutos,
      veterinariaId: s.veterinariaId,
      veterinariaNombre: s.veterinariaNombre,
    }))

  const veterinariasById = useCallback(() => {
    const map = new Map()
    veterinarias.forEach((v) => map.set(v.id, v))
    return map
  }, [veterinarias])

  const categoriesInStock = useCallback(() => {
    const cats = new Set()
    products.forEach((p) => { if (p.categoria) cats.add(p.categoria) })
    return ['Todas las categorias', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [products])

  const serviceCategories = useCallback(() => {
    const cats = new Set()
    services.forEach((s) => { if (s.categoria) cats.add(s.categoria) })
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'es'))
  }, [services])

  return { products, services, veterinariasById, categoriesInStock, serviceCategories, loading, error, reload }
}
