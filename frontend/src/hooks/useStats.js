import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch } from '../shared/utils/api'

export function useStats() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authFetch(`${API_BASE_URL}/usuarios/me/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { if (d) setStats(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { stats, loading }
}
