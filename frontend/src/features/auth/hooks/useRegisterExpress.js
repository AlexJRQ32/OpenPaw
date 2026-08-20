import { useState } from 'react'
import { validateRegisterExpressForm } from '../../../validation'
import { registerExpressApi } from '../../../shared/utils/api'
import { useForm } from '../../../shared/hooks/useForm'
import { useAuth } from '../context/AuthContext'

const initialExpressForm = {
  email: '',
  password: '',
  confirmPassword: '',
}

export function useRegisterExpress(onSuccess) {
  const { loginWithSocial } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    values: form, errors, updateField, reset, handleSubmit,
  } = useForm(initialExpressForm, validateRegisterExpressForm)

  const submitExpress = handleSubmit(async (data) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await registerExpressApi({ email: data.email, password: data.password })
      const decoded = loginWithSocial(result)
      reset(initialExpressForm)
      if (onSuccess) onSuccess(decoded?.sub)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  })

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    form, errors: allErrors, submitting, updateField, submitExpress,
  }
}
