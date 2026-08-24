import './CampoFormulario.css'

/**
 * CampoFormulario — campo de texto del formulario de edición de perfil.
 * T28: el label ahora está asociado al input (htmlFor/id) y el error se
 * expone con aria-invalid + role=alert para lectores de pantalla.
 */
export function CampoFormulario({ label, name, value, onChange, error, type = 'text' }) {
  const id = `campo-${name}`
  return (
    <div className="prof-field">
      <label className="prof-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={'prof-input' + (error ? ' prof-input-error' : '')}
        aria-invalid={error ? true : undefined}
      />
      {error && <small className="prof-field-error" role="alert">{error}</small>}
    </div>
  )
}