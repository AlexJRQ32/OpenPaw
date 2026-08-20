import './ProfileSkeleton.css'

export function ProfileSkeleton() {
  return (
    <div className="prof-skeleton">
      <div className="prof-skeleton-avatar"></div>
      <div className="prof-skeleton-lines">
        <div className="prof-skeleton-line prof-skeleton-line--w60"></div>
        <div className="prof-skeleton-line prof-skeleton-line--w40"></div>
        <div className="prof-skeleton-line prof-skeleton-line--w30"></div>
      </div>
    </div>
  )
}

export function ErrorBox({ msg }) {
  return <div className="prof-error-box">{msg || 'Error al cargar el perfil.'}</div>
}
