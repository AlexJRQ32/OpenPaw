import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProfile } from '../../../hooks/useProfile'
import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { CampoFormulario } from '../components/CampoFormulario'
import { REDES_PREDETERMINADAS } from '../../../hooks/useProfile'
import { ProfileSkeleton, ErrorBox } from '../components/ProfileSkeleton'

import './ProfilePage.css'

const roleMap = { 1: 'Administrador', 2: 'Veterinaria', 3: 'Almacen', 4: 'Cliente' }

const iconMap = {
  email: 'fas fa-envelope',
  telefono: 'fas fa-phone',
  direccion: 'fas fa-location-dot',
  fecha: 'fas fa-calendar',
}

function formatFecha(f) {
  if (!f) return '-'
  return new Date(f).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const completarTelefono = Boolean(location.state?.completarTelefono)
  const { profile, form, errors, status, confirmation, socialLinks, editingSocial, socialInput, startEditing, cancelEditing, updateField, submitUpdate, startEditingSocial, setSocialInput, saveSocialLink, cancelEditingSocial } = useProfile()

  useEffect(() => {
    if (profile?.nombre && profile.nombre !== user?.name) {
      updateUser({ name: profile.nombre, nombre: profile.nombre })
    }
    if (profile && profile.fotoUrl !== user?.fotoUrl) {
      updateUser({ fotoUrl: profile.fotoUrl })
    }
  }, [profile?.nombre, profile?.fotoUrl])

  useEffect(() => {
    if (completarTelefono && status === 'viewing') {
      startEditing()
    }
  }, [completarTelefono, status])

  if (status === 'loading') return <AppShell><ProfileSkeleton /></AppShell>
  if (status === 'error' && !profile) return <AppShell><ErrorBox msg={errors.submit} /></AppShell>

  const isEditing = status === 'editing' || status === 'submitting'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const details = [
    { key: 'email', label: 'Email', value: profile?.email },
    { key: 'telefono', label: 'Telefono', value: profile?.telefono || 'No registrado' },
    { key: 'direccion', label: 'Direccion', value: profile?.direccion || 'No registrada' },
    { key: 'fecha', label: 'Miembro desde', value: formatFecha(profile?.fechaRegistro) },
  ]

  return (
    <AppShell>
      <div className="prof-wrap">
        {isEditing ? (
          <div className="prof-card">
            <h2 className="prof-card-title">Editar perfil</h2>
            <form onSubmit={submitUpdate}>
              <div className="prof-edit-avatar">
                <div className="prof-avatar prof-avatar--sm">
                  {form.fotoUrl ? <img src={form.fotoUrl} alt="" className="prof-img-fit" referrerPolicy="no-referrer" /> : (profile?.nombre?.[0]?.toUpperCase() || 'U')}
                </div>
                <label className="prof-photo-btn">
                  <input type="text" name="fotoUrl" value={form.fotoUrl} onChange={updateField} placeholder="URL de foto..." className="prof-url-input" />
                </label>
              </div>
              <div className="prof-edit-fields">
                {completarTelefono && (
                  <p className="prof-error" role="alert">Ingresa tu telefono para completar tu registro.</p>
                )}
                <CampoFormulario label="Nombre completo" name="nombre" value={form.nombre} onChange={updateField} error={errors.nombre} />
                <CampoFormulario label="Telefono" name="telefono" value={form.telefono} onChange={updateField} error={errors.telefono} />
                <CampoFormulario label="Direccion" name="direccion" value={form.direccion} onChange={updateField} error={errors.direccion} />
                <div className="prof-field">
                  <span className="prof-label">Email</span>
                  <input type="email" value={profile?.email || ''} disabled className="prof-input-disabled" />
                </div>
                {errors.submit && <p className="prof-error">{errors.submit}</p>}
                <div className="prof-actions">
                  <button type="submit" className="prof-btn-primary" disabled={status==='submitting'}>Guardar cambios</button>
                  <button type="button" className="prof-btn-secondary" onClick={cancelEditing}>Cancelar</button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="prof-header">
              <div className="prof-avatar-wrap">
                <div className="prof-avatar">
                  {profile?.fotoUrl ? <img src={profile.fotoUrl} alt="" className="prof-img-cover" referrerPolicy="no-referrer" /> : <span>{(profile?.nombre?.[0]?.toUpperCase() || 'U')}</span>}
                </div>
              </div>
              <h1 className="prof-name">{profile?.nombre}</h1>
              <p className="prof-email">{profile?.email}</p>
              <span className="prof-role-badge">{roleMap[profile?.rolId] || 'Usuario'}</span>
              <div className="prof-header-actions">
                <button className="prof-btn-edit" onClick={startEditing}>Editar perfil</button>
                <button className="prof-btn-logout" onClick={handleLogout}>Cerrar sesion</button>
              </div>
            </div>

            <div className="prof-card">
              <h2 className="prof-card-title">Informacion personal</h2>
              {details.map((d) => (
                <div key={d.key} className="prof-row">
                  <div className="prof-row-icon"><i className={iconMap[d.key]}></i></div>
                  <div className="prof-row-content">
                    <div className="prof-row-label">{d.label}</div>
                    <div className="prof-row-value">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="prof-card">
              <h2 className="prof-card-title">Redes sociales</h2>
              {REDES_PREDETERMINADAS.map((red) => {
                const url = socialLinks[red.plataforma]
                const username = url ? url.replace(red.link, '') : ''
                const editing = editingSocial === red.plataforma
                return (
                  <div key={red.plataforma} className="prof-social-item">
                    <div className="prof-social-icon" style={{ background: `${red.color}15`, color: red.color }}>
                      <i className={red.icon}></i>
                    </div>
                    <div className="prof-social-info">
                      <div className="prof-social-name">{red.label}</div>
                      {editing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <span className="prof-social-base">{red.link}</span>
                          <input type="text" className="prof-social-input" value={socialInput} placeholder={red.placeholder} onChange={(e) => setSocialInput(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveSocialLink()} style={{ flex: 1 }} />
                        </div>
                      ) : url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="prof-social-url">{red.link}{username}</a>
                      ) : (
                        <div className="prof-social-value">No conectado</div>
                      )}
                    </div>
                    {editing ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="prof-social-btn" onClick={saveSocialLink}>Guardar</button>
                        <button className="prof-social-btn" onClick={cancelEditingSocial}>Cancelar</button>
                      </div>
                    ) : url ? (
                      <button className="prof-social-btn" onClick={() => { startEditingSocial(red.plataforma); setSocialInput(username) }}>Editar</button>
                    ) : (
                      <button className="prof-social-btn" onClick={() => startEditingSocial(red.plataforma)}>Conectar</button>
                    )}
                  </div>
                )
              })}
            </div>

            {confirmation && (
              <div className="prof-success"><p>{confirmation}</p></div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
