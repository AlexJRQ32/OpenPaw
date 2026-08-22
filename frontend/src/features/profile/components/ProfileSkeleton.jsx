import './ProfileSkeleton.css'

/**
 * ProfileSkeleton — esqueleto del perfil rediseñado (T28): avatar grande
 * rounded-2xl + líneas del header + bloques de cards, con pulse suave.
 * Los skeletons son decorativos (aria-hidden) y el texto real llega con
 * los datos.
 */
export function ProfileSkeleton() {
  return (
    <div className="prof-skeleton-wrap" aria-hidden="true">
      <div className="prof-skeleton-header">
        <div className="prof-skeleton-avatar"></div>
        <div className="prof-skeleton-lines">
          <div className="prof-skeleton-line prof-skeleton-line--w60"></div>
          <div className="prof-skeleton-line prof-skeleton-line--w40"></div>
          <div className="prof-skeleton-line prof-skeleton-line--w30"></div>
        </div>
      </div>
      <div className="prof-skeleton-grid">
        {[0, 1, 2, 3].map((i) => <div key={i} className="prof-skeleton-card" />)}
      </div>
      <div className="prof-skeleton-card prof-skeleton-card--wide" />
    </div>
  )
}

export function ErrorBox({ msg }) {
  return (
    <div className="prof-error-box" role="alert">
      {msg || 'Error al cargar el perfil.'}
    </div>
  )
}