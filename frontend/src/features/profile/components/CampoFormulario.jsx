import './CampoFormulario.css'

export function CampoFormulario({ label, name, value, onChange, error }) {
  return (
    <div className="prof-field">
      <span className="prof-label">{label}</span>
      <input name={name} value={value} onChange={onChange} className={'prof-input' + (error?' prof-input-error':'')} />
      {error && <small className="prof-field-error">{error}</small>}
    </div>
  )
}
