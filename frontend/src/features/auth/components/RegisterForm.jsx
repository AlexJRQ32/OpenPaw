import { Button } from '../../../shared/components/Button/Button'
import { Icon } from '../../../shared/components/Icon/Icon'
import { useRegister } from '../../../hooks/useRegister'

/**
 * Campo con icono Material a la izquierda + label flotante CSS puro
 * (patrón del login #20) + mensaje de validación por campo (small rojo).
 */
function RegisterField({ id, name, label, type = 'text', icon, value, error, onChange, autoComplete }) {
  const errorId = `${id}-error`
  return (
    <div className="register-group">
      <div className="register-field">
        <Icon name={icon} size={20} className="register-field-icon" />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={label}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && (
        <small id={errorId} className="register-error" role="alert">{error}</small>
      )}
    </div>
  )
}

/**
 * RegisterForm — Rediseño Sprint 1 / Task #22 (wireframe Stitch "registro_openpaw").
 * Orden de campos: Nombre → Correo → Teléfono → Dirección (textarea 2 filas) →
 * Contraseña + Confirmar lado a lado. Lógica 100% conservada vía useRegister:
 * validaciones por campo, mensaje de éxito, errores de submit y estado submitting.
 */
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
    <form className="register-form" onSubmit={submitRegister} noValidate>
      <div className="register-fields">
        <RegisterField
          id="register-nombre"
          name="nombre"
          label="Nombre completo"
          icon="person"
          value={form.nombre}
          error={errors.nombre}
          onChange={updateField}
          autoComplete="name"
        />

        <RegisterField
          id="register-email"
          name="email"
          type="email"
          label="Correo electrónico"
          icon="mail"
          value={form.email}
          error={errors.email}
          onChange={updateField}
          autoComplete="email"
        />

        <RegisterField
          id="register-telefono"
          name="telefono"
          type="tel"
          label="Teléfono"
          icon="phone"
          value={form.telefono}
          error={errors.telefono}
          onChange={updateField}
          autoComplete="tel"
        />

        <div className="register-group">
          <div className="register-field register-field--area">
            <Icon name="location_on" size={20} className="register-field-icon register-field-icon--top" />
            <textarea
              id="register-direccion"
              name="direccion"
              rows={2}
              value={form.direccion}
              onChange={updateField}
              placeholder="Dirección"
              autoComplete="street-address"
              aria-invalid={errors.direccion ? true : undefined}
              aria-describedby={errors.direccion ? 'register-direccion-error' : undefined}
            />
            <label htmlFor="register-direccion">Dirección</label>
          </div>
          {errors.direccion && (
            <small id="register-direccion-error" className="register-error" role="alert">
              {errors.direccion}
            </small>
          )}
        </div>

        <div className="register-row">
          <RegisterField
            id="register-password"
            name="password"
            type="password"
            label="Contraseña"
            icon="lock"
            value={form.password}
            error={errors.password}
            onChange={updateField}
            autoComplete="new-password"
          />
          <RegisterField
            id="register-confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirmar contraseña"
            icon="lock_clock"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={updateField}
            autoComplete="new-password"
          />
        </div>
      </div>

      {errors.submit && (
        <p className="register-alert register-alert--error" role="alert">{errors.submit}</p>
      )}

      {successMessage && (
        <p className="register-alert register-alert--success" role="status">{successMessage}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="register-submit"
        icon={status === 'submitting' ? undefined : 'arrow_forward'}
        iconPosition="right"
        loading={status === 'submitting'}
      >
        {status === 'submitting' ? 'Registrando...' : 'Crear cuenta'}
      </Button>
    </form>
  )
}
