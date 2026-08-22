import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS, getUserRoleId } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  nombre: '',
  especie: '',
  raza: '',
  sexo: '',
  fechaNacimiento: '',
  peso: '',
  color: '',
  identificacion: '',
  fotoUrl: '',
}

function validar(form) {
  const errors = {}
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!form.especie) errors.especie = 'Selecciona la especie'
  if (!form.sexo) errors.sexo = 'Selecciona el sexo'
  if (form.peso !== '' && (Number.isNaN(Number(form.peso)) || Number(form.peso) < 0)) {
    errors.peso = 'El peso debe ser un numero mayor o igual a 0'
  }
  return errors
}

export function useMascotas() {
  const { user } = useAuth()
  const esCliente = getUserRoleId(user) === ROLE_IDS.CLIENTE
  const toast = useToast()

  const [mascotas, setMascotas] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  const cargarMascotas = useCallback(async () => {
    setListStatus('loading')
    setListError('')
    try {
      // T26 — Conectar los campos de salud del Sprint 1 (FotoUrl, EstadoSalud,
      // ProximaVacuna, ProximaVacunaFecha, MedicacionActual,
      // ProximaMedicacionFecha, Sexo, Peso, Color, Identificacion).
      // /usuarios/me/veterinaria-info devuelve un DTO reducido (id, nombre,
      // especie, raza, veterinaria, ultimaCita) y es la fuente de QUÉ mascotas
      // ver por rol (cliente → propias; veterinaria → las de su clínica).
      // /mascotas devuelve el MascotaDto completo con los campos nuevos;
      // se hace merge por id para enriquecer sin cambiar el filtrado por rol.
      // QA A1: allSettled convertía fallos totales en "sin mascotas" y
      // descartaba datos usables cuando solo fallaba veterinaria-info.
      const [infoRes, fullRes] = await Promise.allSettled([
        authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`),
        authFetch(`${API_BASE_URL}/mascotas`),
      ])

      const infoOk = infoRes.status === 'fulfilled' && infoRes.value?.ok
      const fullOk = fullRes.status === 'fulfilled' && fullRes.value?.ok
      const info = infoOk ? await infoRes.value.json() : null
      const full = fullOk ? await fullRes.value.json() : null

      // Ambos endpoints fallaron: error real visible, nunca EmptyState.
      if (!infoOk && !fullOk) {
        setListError('No se pudieron cargar tus mascotas.')
        setListStatus('error')
        return
      }

      const completas = Array.isArray(full) ? full : []
      const porId = new Map(completas.map((m) => [m.id, m]))
      let lista

      if (infoOk) {
        // Caso normal: merge por id (info define el filtrado por rol, las
        // completas enriquecen con los campos nuevos de salud).
        lista = (info?.mascotas ?? []).map((m) => ({ ...porId.get(m.id), ...m }))
      } else if (esCliente) {
        // Fallo solo veterinaria-info y usuario CLIENTE: /mascotas ya filtra
        // por dueño en MascotasController (GetByDuenioIdAsync) → seguro usarlas
        // como driver, no se pierden datos disponibles.
        lista = completas
      } else {
        // Fallo solo veterinaria-info y rol funcionario: /mascotas devuelve las
        // mascotas de TODO el sistema (no filtra por clínica) → NO usar fallback
        // (expondría mascotas ajenas): error visible.
        setListError('No se pudieron cargar las mascotas de tu clínica.')
        setListStatus('error')
        return
      }

      setMascotas(lista)
      setListStatus('loaded')
    } catch {
      setListError('No se pudieron cargar tus mascotas.')
      setListStatus('error')
    }
  }, [esCliente])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (cancelled) return
      await cargarMascotas()
    }
    load()
    return () => { cancelled = true }
  }, [cargarMascotas])

  const abrir = () => {
    setForm({ ...emptyForm })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const cerrar = () => {
    setModalOpen(false)
    setSubmitError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    const validation = validar(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    const payload = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      raza: form.raza.trim() || undefined,
      sexo: Number(form.sexo),
      fechaNacimiento: form.fechaNacimiento
        ? new Date(form.fechaNacimiento).toISOString()
        : undefined,
      peso: form.peso !== '' ? Number(form.peso) : undefined,
      color: form.color.trim() || undefined,
      identificacion: form.identificacion.trim() || undefined,
      fotoUrl: form.fotoUrl.trim() || undefined,
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/mascotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo guardar la mascota.')
      setSubmitStatus('sent')
      cerrar()
      toast.success('Mascota agregada correctamente.')
      await cargarMascotas()
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
      toast.error(error.message)
    }
  }

  return {
    esCliente,
    mascotas,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrir,
    cerrar,
    handleChange,
    guardar,
  }
}