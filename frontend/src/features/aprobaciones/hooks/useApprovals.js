import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useToast } from '../../../shared/context/ToastContext'

export function useApprovals() {
  const toast = useToast()
  const [solicitudes, setSolicitudes] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const fetchSolicitudes = useCallback(async () => {
    setListStatus('loading')
    setListError(null)

    try {
      const response = await authFetch(`${API_BASE_URL}/veterinarias`)

      if (!response.ok) {
        throw new Error('No se pudieron cargar las solicitudes.')
      }

      const data = await response.json()
      setSolicitudes(Array.isArray(data) ? data : [])
      setListStatus('loaded')
    } catch (err) {
      setListError(err.message)
      setListStatus('error')
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchSolicitudes, 0)
    return () => clearTimeout(timeout)
  }, [fetchSolicitudes])

  const aprobar = async (id) => {
    setLoadingId(id)
    try {
      const response = await authFetch(`${API_BASE_URL}/veterinarias/${id}/aprobar`, {
        method: 'PUT',
      })

      if (response.status === 400) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.mensaje ?? 'No se pudo aprobar la solicitud.')
      }

      if (!response.ok) {
        throw new Error('No se pudo aprobar la solicitud.')
      }

      toast.success('Solicitud aprobada.')
      await fetchSolicitudes()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingId(null)
    }
  }

  const rechazar = async (id, motivo) => {
    setLoadingId(id)
    try {
      const response = await authFetch(`${API_BASE_URL}/veterinarias/${id}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivoRechazo: motivo || '' }),
      })

      if (response.status === 400) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.mensaje ?? 'No se pudo rechazar la solicitud.')
      }

      if (!response.ok) {
        throw new Error('No se pudo rechazar la solicitud.')
      }

      toast.warning('Solicitud rechazada.')
      await fetchSolicitudes()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingId(null)
    }
  }

  return {
    solicitudes, listStatus, listError,
    loadingId, aprobar, rechazar, fetchSolicitudes,
  }
}
