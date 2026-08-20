import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch } from '../shared/utils/api'

export function useMascotas() {
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { if (d) setMascotas(d.mascotas ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { mascotas, loading }
}
