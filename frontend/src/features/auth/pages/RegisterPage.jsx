import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'
import { Icon } from '../../../shared/components/Icon/Icon'
import './RegisterPage.css'

/**
 * RegisterPage — Rediseño Sprint 1 / Task #22 (wireframe Stitch "registro_openpaw").
 * Mismo estilo del login (#20/#21): logo círculo pets + anillo ping, card glass
 * y fondos decorativos con blur. Subtítulo y orden de campos según wireframe.
 * Funcionalidad intacta: RegisterForm conserva validaciones, éxito y errores.
 */
export function RegisterPage() {
  return (
    <main className="register-page">
      <div className="register-bg" aria-hidden="true">
        <span className="register-bg-blob register-bg-blob--primary" />
        <span className="register-bg-blob register-bg-blob--secondary" />
      </div>

      <div className="register-card">
        <header className="register-brand">
          <div className="register-logo">
            <Icon name="pets" size={32} filled className="register-logo-icon" />
            <span className="register-logo-ring" aria-hidden="true" />
          </div>
          <h1 className="register-title">Crear cuenta</h1>
          <p className="register-subtitle">
            Únete a OpenPaw para gestionar la salud de tu mascota.
          </p>
        </header>

        <RegisterForm />

        <p className="register-footer">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="register-footer-link">
            Inicia sesión
            <Icon name="login" size={16} className="register-footer-icon" />
          </Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage
