import { MAX_FILE_SIZE } from './constants'
import { isKnownBusiness, isKnownStore } from './utils'

const CR_ID_REGEX = /^\d{1,2}-\d{3,4}-\d{4,6}$/

export function validateForm(form) {
  const errors = {}
  const requiredFields = [
    'nombreComercio', 'cedulaJuridica', 'direccion', 'telefono', 'email',
    'descripcion',
  ]

  requiredFields.forEach((field) => {
    if (!form[field].trim()) {
      errors[field] = 'Este campo es obligatorio.'
    }
  })

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un email válido.'
  }

  if (isKnownBusiness(form)) {
    errors.cedulaJuridica = 'Este comercio ya tiene una solicitud registrada.'
  }

  return errors
}

export function validateStoreRegistrationForm(form) {
  const errors = {}
  const requiredFields = ['nombreAlmacen', 'cedulaJuridica', 'direccion', 'telefono', 'email']

  requiredFields.forEach((field) => {
    if (!form[field].trim()) {
      errors[field] = 'Este campo es obligatorio.'
    }
  })

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un email válido.'
  }

  if (isKnownStore(form)) {
    errors.cedulaJuridica = 'Este almacén ya tiene una solicitud registrada.'
  }

  return errors
}

// ==========================
// Validación del registro de usuarios
// ==========================
export function validateRegisterForm(form) {
  const errors = {}

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
  }

  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un correo electrónico válido.'
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.'
  } else if (form.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Debe confirmar la contraseña.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}

export function validateRegisterExpressForm(form) {
  const errors = {}

  if (!form.email.trim()) {
    errors.email = 'El correo electronico es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un correo electronico valido.'
  }

  if (!form.password) {
    errors.password = 'La contrasena es obligatoria.'
  } else if (form.password.length < 8) {
    errors.password = 'La contrasena debe tener al menos 8 caracteres.'
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Debe confirmar la contrasena.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contrasenas no coinciden.'
  }

  return errors
}

export function validateProfileForm(form) {
  const errors = {}

  if (!form.nombre.trim()) {
    errors.nombre = 'Este campo es obligatorio.'
  }

  if (form.telefono && !/^[0-9+\-\s]{8,15}$/.test(form.telefono)) {
    errors.telefono = 'Ingrese un teléfono válido (8 a 15 dígitos).'
  }

  if (form.fotoUrl) {
    try {
      new URL(form.fotoUrl)
    } catch {
      errors.fotoUrl = 'Ingrese una URL válida.'
    }
  }

  return errors
}

export function validateFuncionarioForm(form) {
  const errors = {}

  if (!form.nombre.trim()) {
    errors.nombre = 'Este campo es obligatorio.'
  }

  if (!form.email.trim()) {
    errors.email = 'Este campo es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un email válido.'
  }

  if (!form.rolId) {
    errors.rolId = 'Seleccione un rol.'
  }

  return errors
}
