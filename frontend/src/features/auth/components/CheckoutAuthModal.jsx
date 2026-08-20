import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Button } from '../../../shared/components/Button/Button'
import { Field } from '../../../shared/components/Field/Field'
import { useAuth } from '../context/AuthContext'
import { useRegisterExpress } from '../hooks/useRegisterExpress'
import { useForm } from '../../../shared/hooks/useForm'
import './CheckoutAuthModal.css'

function validateLoginForm(form) {
  const errors = {}
  if (!form.email.trim()) {
    errors.email = 'El correo electronico es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingrese un correo electronico valido.'
  }
  if (!form.password) {
    errors.password = 'La contrasena es obligatoria.'
  }
  return errors
}

export function CheckoutAuthModal({ open, onClose, onSuccess, title = 'Para continuar con tu compra' }) {
  const { login } = useAuth()
  const [tab, setTab] = useState('login')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  const {
    values: loginForm, errors: loginErrors, updateField: updateLoginField, handleSubmit: loginSubmit,
  } = useForm({ email: '', password: '' }, validateLoginForm)

  const {
    form: registerForm, errors: registerErrors, submitting: registerSubmitting,
    updateField: updateRegisterField, submitExpress,
  } = useRegisterExpress(onSuccess)

  const handleLogin = loginSubmit(async (values) => {
    setLoginSubmitting(true)
    setLoginError('')
    try {
      const decoded = await login(values.email, values.password)
      onSuccess?.(decoded?.sub)
    } catch (err) {
      setLoginError(err.message || 'Credenciales invalidas')
    } finally {
      setLoginSubmitting(false)
    }
  })

  return (
    <Modal open={open} onClose={onClose} className="cauth-modal">
      <div className="cauth">
        <div className="cauth-head">
          <span className="cauth-icon"><i className="fas fa-shopping-bag" /></span>
          <div>
            <h2>{title}</h2>
            <p>Inicia sesion o crea tu cuenta al instante.</p>
          </div>
        </div>

        <div className="cauth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={`cauth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setLoginError('') }}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={`cauth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            Crear cuenta
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} noValidate className="cauth-form">
            <Field
              className="wide"
              label="Correo electronico"
              name="email"
              type="email"
              value={loginForm.email}
              error={loginErrors.email}
              onChange={updateLoginField}
              placeholder="tucorreo@ejemplo.com"
            />
            <Field
              label="Contrasena"
              name="password"
              type="password"
              value={loginForm.password}
              error={loginErrors.password}
              onChange={updateLoginField}
              placeholder="Tu contrasena"
            />
            {loginError && <p className="cauth-error" role="alert">{loginError}</p>}
            <div className="cauth-actions">
              <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" type="submit" disabled={loginSubmitting}>
                {loginSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}
              </Button>
            </div>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={submitExpress} noValidate className="cauth-form">
            <Field
              className="wide"
              label="Correo electronico"
              name="email"
              type="email"
              value={registerForm.email}
              error={registerErrors.email}
              onChange={updateRegisterField}
              placeholder="tucorreo@ejemplo.com"
            />
            <Field
              label="Contrasena"
              name="password"
              type="password"
              value={registerForm.password}
              error={registerErrors.password}
              onChange={updateRegisterField}
              placeholder="Minimo 8 caracteres"
            />
            <Field
              label="Confirmar contrasena"
              name="confirmPassword"
              type="password"
              value={registerForm.confirmPassword}
              error={registerErrors.confirmPassword}
              onChange={updateRegisterField}
            />
            {registerErrors.submit && <p className="cauth-error" role="alert">{registerErrors.submit}</p>}
            <div className="cauth-actions">
              <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" type="submit" disabled={registerSubmitting}>
                {registerSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
