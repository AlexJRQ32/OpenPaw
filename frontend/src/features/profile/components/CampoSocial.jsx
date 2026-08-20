import './RedSocial.css'

export function CampoSocial({ red, onChange }) {
  return (
    <div className="prof-social-item">
      <div className="prof-social-icon" style={{ background: `${red.color}15`, color: red.color }}>
        <i className={red.icon}></i>
      </div>
      <div className="prof-social-info">
        <div className="prof-social-name">{red.label}</div>
        <input
          type="url"
          className="prof-social-input"
          placeholder={`URL de ${red.label}...`}
          value={red.url}
          onChange={(e) => onChange(red.plataforma, e.target.value)}
        />
      </div>
    </div>
  )
}
