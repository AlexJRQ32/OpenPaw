import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'
import './RegisterPage.css'

export function RegisterPage() {
  return (
    <main className="register-page">
      <div className="register-card">
        <div className="register-brand">
          <img src="/logo.png" alt="OpenPaw" className="register-logo" />
          <h1 className="register-title">OpenPaw</h1>
          <p className="register-subtitle">Crear cuenta</p>
        </div>

        <RegisterForm />

        <p className="register-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage

