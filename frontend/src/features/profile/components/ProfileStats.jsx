import { Icon } from '../../../shared/components/Icon/Icon'
import './ProfileStats.css'

/**
 * ProfileStats — bento grid de métricas (T28, wireframe perfil_openpaw).
 * Misma fuente de datos que el dashboard (T24): /usuarios/me/stats por rol.
 * El wireframe muestra métricas demo de veterinaria; se mapean a los stats
 * reales del backend sin inventar valores (patrón T23/T24).
 */
function formatValue(raw) {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n.toLocaleString('es-CR') : '0'
}

export function ProfileStats({ config, data, loading }) {
  if (loading) {
    return (
      <div className="profile-stats" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="profile-stat profile-stat--skeleton" />)}
      </div>
    )
  }
  if (!config?.length) return null

  return (
    <div className="profile-stats">
      {config.map((card) => (
        <div key={card.key} className={`profile-stat profile-stat--${card.tone}`}>
          <span className="profile-stat__icon">
            <Icon name={card.icon} size={28} filled />
          </span>
          <span className="profile-stat__value">{formatValue(data?.[card.key])}</span>
          <span className="profile-stat__label">{card.label}</span>
        </div>
      ))}
    </div>
  )
}