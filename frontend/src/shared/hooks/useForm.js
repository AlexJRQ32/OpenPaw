import { useState } from 'react'

export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (name, value, allValues) => {
    const partial = { ...allValues, [name]: value }
    const allErrors = validate(partial)
    return allErrors[name]
  }

  const updateField = (event) => {
    const { name, value, type, checked, files } = event.target
    const val = type === 'checkbox' ? checked : files ? files[0] ?? null : value

    setTouched((prev) => ({ ...prev, [name]: true }))

    setValues((prev) => {
      const next = { ...prev, [name]: val }
      const fieldError = validateField(name, val, next)
      setErrors((prevErrors) => ({ ...prevErrors, [name]: touched[name] ? fieldError : undefined }))
      return next
    })
  }

  const setValue = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    setValues((prev) => {
      const next = { ...prev, [name]: value }
      const fieldError = validateField(name, value, next)
      setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldError }))
      return next
    })
  }

  const handleSubmit = (onSubmit) => {
    return async (event) => {
      event.preventDefault()
      const allErrors = validate(values)
      const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {})
      setErrors(allErrors)
      setTouched(allTouched)
      if (Object.keys(allErrors).length > 0) return
      await onSubmit(values)
    }
  }

  const reset = (newValues) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouched({})
  }

  const visibleErrors = {}
  Object.keys(errors).forEach((key) => {
    if (touched[key]) visibleErrors[key] = errors[key]
  })

  return {
    values, errors: visibleErrors, updateField, setValue, handleSubmit, reset,
    setErrors, setTouched,
  }
}
