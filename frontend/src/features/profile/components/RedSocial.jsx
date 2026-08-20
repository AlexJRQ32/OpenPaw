import './RedSocial.css'

export function RedSocial({ icon, label, value, color }) {
  return (
    <div className="prof-social-item">
      <div className="prof-social-icon" style={{background:`${color}15`,color}}><i className={icon}></i></div>
      <div className="prof-social-info">
        <div className="prof-social-name">{label}</div>
        <div className="prof-social-value">{value}</div>
      </div>
      <button className="prof-social-btn">Conectar</button>
    </div>
  )
}
