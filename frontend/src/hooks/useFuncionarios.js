import { useEffect, useState } from 'react'
import { API_BASE_URL, initialFuncionarioForm, ROLE_IDS } from '../constants'
import { authFetch } from '../shared/utils/api'
import { validateFuncionarioForm } from '../validation'
import { useForm } from '../shared/hooks/useForm'
import { useAuth } from '../features/auth/context/AuthContext'

const ROL_CLIENTE = 4

export function useFuncionarios() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const [funcionarios, setFuncionarios] = useState([])
  const [admins, setAdmins] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState(null)
  const [status, setStatus] = useState('idle')
  const [ultimoCreado, setUltimoCreado] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, setValue, reset, handleSubmit,
  } = useForm({ ...initialFuncionarioForm, comercioId: '' }, validateFuncionarioForm)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        let url = `${API_BASE_URL}/usuarios`
        let comercioId = null

        if (userRol !== ROLE_IDS.ADMINISTRADOR) {
          const res = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
          if (cancelled) return
          const info = res.ok ? await res.json() : null
          if (info?.veterinariaId || info?.almacenId) {
            comercioId = info.veterinariaId ?? info.almacenId
            setValue('comercioId', comercioId)
          }
          if (comercioId) {
            if (userRol === ROLE_IDS.VETERINARIA) url += `?veterinariaId=${comercioId}`
            else if (userRol === ROLE_IDS.ALMACEN) url += `?almacenId=${comercioId}`
          }
        }

        const response = await authFetch(url)
        if (!response.ok) throw new Error('No se pudo cargar la lista de funcionarios.')
        if (cancelled) return

        const data = await response.json()
        const adminsList = data.filter((u) => u.rolId === 1 && u.activo)

        let filtered = data.filter((usuario) =>
          usuario.rolId !== ROL_CLIENTE && usuario.rolId !== 1 &&
          (usuario.veterinariaId || usuario.almacenId)
        )

        if (comercioId) {
          filtered = filtered.filter((u) =>
            Number(u.veterinariaId) === Number(comercioId) ||
            Number(u.almacenId) === Number(comercioId)
          )
        }

        setFuncionarios(filtered)
        setAdmins(adminsList)
        setListStatus('loaded')
        setListError(null)
      } catch (error) {
        if (!cancelled) {
          setListError(error.message)
          setListStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [userRol]) // eslint-disable-line react-hooks/exhaustive-deps

  const cargarFuncionarios = async () => {
    try {
      let url = `${API_BASE_URL}/usuarios`
      let comercioId = null

      if (userRol === ROLE_IDS.VETERINARIA || userRol === ROLE_IDS.ALMACEN) {
        const res = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
        const info = res.ok ? await res.json() : null
        if (info?.veterinariaId || info?.almacenId) {
          comercioId = info.veterinariaId ?? info.almacenId
          if (comercioId) {
            if (userRol === ROLE_IDS.VETERINARIA) url += `?veterinariaId=${comercioId}`
            else url += `?almacenId=${comercioId}`
          }
        }
      }

      const response = await authFetch(url)
      if (!response.ok) throw new Error('No se pudo cargar la lista de funcionarios.')

      let data = await response.json()
      const adminsList = data.filter((u) => u.rolId === 1 && u.activo)

      let filtered = data.filter((usuario) =>
        usuario.rolId !== ROL_CLIENTE && usuario.rolId !== 1 &&
        (usuario.veterinariaId || usuario.almacenId)
      )

      if (comercioId) {
        filtered = filtered.filter((u) =>
          Number(u.veterinariaId) === Number(comercioId) ||
          Number(u.almacenId) === Number(comercioId)
        )
      }

      setFuncionarios(filtered)
      setAdmins(adminsList)
      setListStatus('loaded')
      setListError(null)
    } catch (error) {
      setListError(error.message)
      setListStatus('error')
    }
  }

  const handleUpdateField = (event) => {
    const { name, value } = event.target
    if (name === 'rolId') {
      setValue(name, Number(value))
    } else {
      updateField(event)
    }
  }

  const ejecutarCreacion = async (data) => {
    setStatus('submitting')
    setUltimoCreado(null)
    setSubmitError('')

    const body = { nombre: data.nombre, email: data.email, rolId: data.rolId }
    if (data.comercioId) body.comercioId = data.comercioId

    try {
      const response = await authFetch(`${API_BASE_URL}/usuarios/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos ingresados.')
      }

      if (!response.ok) {
        throw new Error('No se pudo crear el funcionario. Intente nuevamente.')
      }

      const resData = await response.json()
      setUltimoCreado(resData)
      // M3 (QA): preservar comercioId al resetear. Sin esto, un no-admin (campo
      // comercio oculto) perdia el vinculo a su comercio en el 2º alta.
      reset({ ...initialFuncionarioForm, comercioId: data.comercioId || '' })
      setStatus('idle')
      await cargarFuncionarios()
      return true
    } catch (error) {
      setStatus('idle')
      setSubmitError(error.message)
      return false
    }
  }

  // M1 (QA): crearFuncionario resuelve true SOLO si el alta fue exitosa. Con
  // error del servidor (400) o validacion cliente devuelve false para que la
  // pagina no cierre el modal y pueda mostrar errors.submit.
  const crearFuncionario = (event) => {
    let exito = false
    const submit = handleSubmit(async (data) => {
      exito = await ejecutarCreacion(data)
    })
    return submit(event).then(() => exito)
  }

  const cambiarRol = async (id, rolId) => {
    const response = await authFetch(`${API_BASE_URL}/usuarios/${id}/rol`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolId }),
    })

    if (response.status === 400) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.mensaje ?? 'No se pudo cambiar el rol.')
    }

    if (!response.ok) {
      throw new Error('No se pudo cambiar el rol.')
    }

    await cargarFuncionarios()
  }

  const alternarActivo = async (funcionario) => {
    const endpoint = funcionario.activo
      ? `${API_BASE_URL}/usuarios/${funcionario.id}`
      : `${API_BASE_URL}/usuarios/${funcionario.id}/reactivar`

    const response = await authFetch(endpoint, {
      method: funcionario.activo ? 'DELETE' : 'PUT',
    })

    if (response.status === 400) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.mensaje ?? 'No se pudo actualizar el estado.')
    }

    if (!response.ok) {
      throw new Error('No se pudo actualizar el estado.')
    }

    await cargarFuncionarios()
  }

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    funcionarios, admins, listStatus, listError,
    form, errors: allErrors, status, ultimoCreado,
    updateField: handleUpdateField, setValue, crearFuncionario, cambiarRol, alternarActivo,
  }
}
