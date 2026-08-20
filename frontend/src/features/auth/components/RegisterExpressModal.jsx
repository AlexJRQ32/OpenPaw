import { Modal } from '../../../shared/components/Modal/Modal'
import { Button } from '../../../shared/components/Button/Button'
import { Field } from '../../../shared/components/Field/Field'
import { useRegisterExpress } from '../hooks/useRegisterExpress'
import './RegisterExpressModal.css'

export function RegisterExpressModal({ open, onClose, title = 'Crear cuenta para continuar', onSuccess }) {
  const { form, errors, submitting, updateField, submitExpress } = useRegisterExpress(onSuccess)

  return (
    <Modal open={open} onClose={onClose} className="reg-express-modal">
      <div className="reg-express">
        <div className="reg-express-head">
          <span className="reg-express-icon"><i className="fas fa-bolt" /></span>
          <div>
            <h2>{title}</h2>
            <p>Solo correo y contrasena. Tu cuenta queda lista al instante.</p>
          </div>
        </div>
        <form onSubmit={submitExpress} noValidate>
          <div className="field-grid">
            <Field
              className="wide"
              label="Correo electronico"
              name="email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={updateField}
              placeholder="tucorreo@ejemplo.com"
            />
            <Field
              label="Contrasena"
              name="password"
              type="password"
              value={form.password}
              error={errors.password}
              onChange={updateField}
              placeholder="Minimo 8 caracteres"
            />
            <Field
              label="Confirmar contrasena"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={updateField}
            />
          </div>
          {errors.submit && <p className="submit-error">{errors.submit}</p>}
          <div className="reg-express-actions">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
