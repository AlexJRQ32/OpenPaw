export function Field({ className = '', label, name, type = 'text', value, error, onChange, placeholder = '' }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />
      {error && <small>{error}</small>}
    </label>
  )
}
