import { useState } from 'react'
import { initialRegisterForm } from '../constants'
import { validateRegisterForm } from '../validation'
import { registerApi } from '../shared/utils/api'
import { useLoading } from '../shared/context/LoadingContext'
import { useForm } from '../shared/hooks/useForm'

export function useRegister() {
  const { showLoader, hideLoader } = useLoading()
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, reset, handleSubmit,
  } = useForm(initialRegisterForm, validateRegisterForm)

  const submitRegister = handleSubmit(async (data) => {
    showLoader()
    setSubmitError('')
    try {
      await registerApi({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        direccion: data.direccion,
      })
      setSuccessMessage('Usuario registrado correctamente.')
      reset(initialRegisterForm)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      hideLoader()
    }
  })

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    form, errors: allErrors, status: successMessage ? 'success' : 'idle', successMessage,
    updateField, submitRegister,
  }
}