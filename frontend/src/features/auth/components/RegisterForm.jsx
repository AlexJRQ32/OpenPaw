import { Field } from '../../../shared/components/Field/Field'
import { useRegister } from '../../../hooks/useRegister'

export function RegisterForm() {
  const {
    form,
    errors,
    status,
    successMessage,
    updateField,
    submitRegister,
  } = useRegister()

  return (
    <form className="registration-form" onSubmit={submitRegister} noValidate>
      <h2>Registro de Cliente</h2>

      <div className="field-grid">

        <Field
          className="wide"
          label="Nombre completo"
          name="nombre"
          value={form.nombre}
          error={errors.nombre}
          onChange={updateField}
        />

        <Field
          label="Correo electronico"
          name="email"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={updateField}
        />

        <Field
          label="Contrasena"
          name="password"
          type="password"
          value={form.password}
          error={errors.password}
          onChange={updateField}
        />

        <Field
          className="wide"
          label="Confirmar contrasena"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={updateField}
        />

        <Field
          label="Telefono"
          name="telefono"
          value={form.telefono}
          error={errors.telefono}
          onChange={updateField}
        />

        <Field
          label="Direccion"
          name="direccion"
          value={form.direccion}
          error={errors.direccion}
          onChange={updateField}
        />

      </div>

      {errors.submit && (
        <p className="submit-error">{errors.submit}</p>
      )}

      {successMessage && (
        <p className="submit-success">{successMessage}</p>
      )}

      <div className="actions">
        <button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </div>

    </form>
  )
}