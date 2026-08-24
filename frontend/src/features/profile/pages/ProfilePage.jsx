import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProfile, REDES_PREDETERMINADAS } from '../../../hooks/useProfile'
import { useStats } from '../../../hooks/useStats'
import { useAuth } from '../../auth/context/AuthContext'
import { ROLE_LABELS, ROLE_IDS, getUserRoleId } from '../../../constants'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Button } from '../../../shared/components/Button/Button'
import { Icon } from '../../../shared/components/Icon/Icon'
import { CampoFormulario } from '../components/CampoFormulario'
import { ProfileSkeleton, ErrorBox } from '../components/ProfileSkeleton'
import { ProfileStats } from '../components/ProfileStats'
import { ProfileMap } from '../components/ProfileMap'
import { SocialIcon } from '../components/SocialIcon'

import './ProfilePage.css'

const roleMap = { 1: 'Administrador', 2: 'Veterinaria', 3: 'Almacen', 4: 'Cliente' }

/* Variante M3 del Badge de rol (misma semántica que AppShell #18). */
const ROLE_BADGE_VARIANTS = {
  [ROLE_IDS.ADMINISTRADOR]: 'primary',
  [ROLE_IDS.VETERINARIA]: 'success',
  [ROLE_IDS.ALMACEN]: 'warning',
  [ROLE_IDS.CLIENTE]: 'neutral',
}

// T28 — Bento grid de stats con datos REALES de /usuarios/me/stats por rol
// (misma fuente que el dashboard T24). El wireframe pide métricas demo de
// veterinaria (pacientes, calificación, cirugías, años); se mapean a los
// stats que el backend expone para cada rol, sin inventar valores.
const PROFILE_STATS = {
  [ROLE_IDS.ADMINISTRADOR]: [
    { key: 'vets', icon: 'local_hospital', tone: 'primary', label: 'Veterinarias activas' },
    { key: 'stores', icon: 'inventory_2', tone: 'tertiary', label: 'Almacenes activos' },
    { key: 'users', icon: 'group', tone: 'secondary', label: 'Usuarios activos' },
    { key: 'pending', icon: 'warning', tone: 'error', label: 'Solicitudes pendientes' },
  ],
  [ROLE_IDS.VETERINARIA]: [
    { key: 'veterinarias', icon: 'local_hospital', tone: 'secondary', label: 'Mis veterinarias' },
    { key: 'citas', icon: 'calendar_month', tone: 'tertiary', label: 'Citas registradas' },
    { key: 'mascotas', icon: 'pets', tone: 'primary', label: 'Mascotas atendidas' },
    { key: 'pendientes', icon: 'fact_check', tone: 'error', label: 'Solicitudes pendientes' },
  ],
  [ROLE_IDS.ALMACEN]: [
    { key: 'almacenes', icon: 'inventory_2', tone: 'tertiary', label: 'Mis almacenes' },
    { key: 'pendientes', icon: 'fact_check', tone: 'error', label: 'Solicitudes pendientes' },
  ],
  [ROLE_IDS.CLIENTE]: [
    { key: 'mascotas', icon: 'pets', tone: 'primary', label: 'Mis mascotas' },
    { key: 'citas', icon: 'calendar_month', tone: 'tertiary', label: 'Mis citas' },
    { key: 'veterinarias', icon: 'local_hospital', tone: 'secondary', label: 'Veterinarias vinculadas' },
  ],
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
  const { profile, form, errors, status, confirmation, socialLinks, editingSocial, socialInput, socialError, startEditing, cancelEditing, updateField, submitUpdate, startEditingSocial, setSocialInput, saveSocialLink, cancelEditingSocial } = useProfile()
  const { stats, loading: statsLoading } = useStats()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Conserva el sync del nombre/foto hacia el AuthContext (comportamiento previo).
  useEffect(() => {
    if (profile?.nombre && profile.nombre !== user?.name) {
      updateUser({ name: profile.nombre, nombre: profile.nombre })
    }
    if (profile && profile.fotoUrl !== user?.fotoUrl) {
      updateUser({ fotoUrl: profile.fotoUrl })
    }
  }, [profile?.nombre, profile?.fotoUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flujo de registro: "completar teléfono" entra directo al modo edición.
  useEffect(() => {
    if (completarTelefono && status === 'viewing') startEditing()
  }, [completarTelefono, status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cierra el menú (kebab) al hacer clic fuera.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  if (status === 'loading') return <AppShell><ProfileSkeleton /></AppShell>
  if (status === 'error' && !profile) return <AppShell><ErrorBox msg={errors.submit} /></AppShell>

  const isEditing = status === 'editing' || status === 'submitting'
  const roleId = getUserRoleId(user) || Number(profile?.rolId) || ROLE_IDS.CLIENTE
  const rolLabel = ROLE_LABELS[roleId] || roleMap[profile?.rolId] || 'Usuario'
  const vigente = profile?.activo !== false && profile?.estado !== 'Inactivo' && profile?.estado !== 'Vacaciones'

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const connectedCount = Object.values(socialLinks).filter(Boolean).length
  const primeraSinVincular = REDES_PREDETERMINADAS.find((red) => !socialLinks[red.plataforma])

  return (
    <AppShell>
      <div className="profile-page">
        {isEditing ? (
          <div className="profile-edit">
            <div className="profile-card">
              <h2 className="profile-card-title">
                <Icon name="edit_note" size={20} />
                Editar perfil
              </h2>
              <form onSubmit={submitUpdate} noValidate>
                <div className="profile-edit-avatar">
                  <div className="profile-avatar profile-avatar--edit">
                    {form.fotoUrl
                      ? <img src={form.fotoUrl} alt="" className="profile-avatar-img" referrerPolicy="no-referrer" />
                      : <span className="profile-avatar-fallback">{form.nombre?.[0]?.toUpperCase() || 'U'}</span>}
                  </div>
                  <label className="profile-photo-btn">
                    <Icon name="photo_camera" size={16} />
                    <span>Foto de perfil (URL)</span>
                    <input type="text" name="fotoUrl" value={form.fotoUrl} onChange={updateField} placeholder="https://..." className="profile-url-input" aria-label="URL de foto de perfil" />
                  </label>
                </div>
                {completarTelefono && (
                  <p className="profile-error" role="alert">
                    Ingresa tu teléfono para completar tu registro.
                  </p>
                )}
                <div className="profile-edit-fields">
                  <CampoFormulario label="Nombre completo" name="nombre" value={form.nombre} onChange={updateField} error={errors.nombre} />
                  <CampoFormulario label="Teléfono" name="telefono" value={form.telefono} onChange={updateField} error={errors.telefono} />
                  <CampoFormulario label="Dirección" name="direccion" value={form.direccion} onChange={updateField} error={errors.direccion} />
                  <div className="prof-field">
                    <span className="prof-label">Email</span>
                    <input type="email" value={profile?.email || ''} disabled className="prof-input prof-input--disabled" aria-label="Email" />
                  </div>
                  {errors.submit && <p className="profile-error" role="alert">{errors.submit}</p>}
                  <div className="profile-actions">
                    <Button type="submit" loading={status === 'submitting'}>Guardar cambios</Button>
                    <Button type="button" variant="ghost" onClick={cancelEditing}>Cancelar</Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Header (wireframe perfil_openpaw): avatar grande con botón de
                edición + badge Activo, nombre, email, badges de credenciales
                y acciones (Editar perfil / menú kebab con Cerrar sesión). */}
            <header className="profile-header">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {profile?.fotoUrl
                    ? <img src={profile.fotoUrl} alt={`Foto de ${profile.nombre}`} className="profile-avatar-img" referrerPolicy="no-referrer" />
                    : <span className="profile-avatar-fallback">{profile?.nombre?.[0]?.toUpperCase() || 'U'}</span>}
                </div>
                <button type="button" className="profile-avatar-edit" onClick={startEditing} aria-label="Cambiar foto de perfil" title="Cambiar foto de perfil">
                  <Icon name="edit" size={18} />
                </button>
                <Badge variant={vigente ? 'active' : 'danger'} icon="verified" className="profile-status-badge">
                  {vigente ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="profile-header-info">
                <h1 className="profile-name">{profile?.nombre}</h1>
                <p className="profile-email">
                  <Icon name="mail" size={18} />
                  {profile?.email}
                </p>
                <div className="profile-badges">
                  <Badge variant={ROLE_BADGE_VARIANTS[roleId] ?? 'neutral'} icon="badge">{rolLabel}</Badge>
                  {profile?.especialidad && <Badge variant="warning" icon="school">{profile.especialidad}</Badge>}
                  {profile?.sede && <Badge variant="neutral" icon="location_on">{profile.sede}</Badge>}
                  {profile?.idCorporativo && <Badge variant="neutral" icon="fingerprint">{profile.idCorporativo}</Badge>}
                </div>
              </div>

              <div className="profile-header-actions">
                <Button variant="primary" icon="edit_note" onClick={startEditing}>Editar Perfil</Button>
                <div className="profile-menu" ref={menuRef}>
                  <Button
                    variant="secondary"
                    icon="more_horiz"
                    aria-label="Más opciones"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((value) => !value)}
                    className="profile-menu-btn"
                  />
                  {menuOpen && (
                    <div className="profile-menu-dropdown" role="menu">
                      <button type="button" role="menuitem" className="profile-menu-item" onClick={handleLogout}>
                        <Icon name="logout" size={16} />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Bento grid de stats — datos reales por rol */}
            <ProfileStats config={PROFILE_STATS[roleId]} data={stats} loading={statsLoading} />

            <div className="profile-grid">
              <div className="profile-grid-main">
                {/* Información personal: teléfono móvil, emergencia, dirección,
                    licencia médica y fecha de incorporación (perfil extendido). */}
                <section className="profile-card" aria-label="Información personal">
                  <h2 className="profile-card-title">
                    <Icon name="badge" size={20} />
                    Información Personal
                  </h2>
                  <div className="profile-info-grid">
                    <div className="profile-info-field">
                      <span className="profile-info-label">Teléfono móvil</span>
                      <div className="profile-info-value">
                        <Icon name="phone_iphone" size={20} />
                        {profile?.telefono || 'No registrado'}
                      </div>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-info-label">Teléfono emergencia</span>
                      <div className="profile-info-value profile-info-value--emergency">
                        <Icon name="emergency" size={20} />
                        {profile?.telefonoEmergencia || 'No registrado'}
                      </div>
                    </div>
                    <div className="profile-info-field profile-info-field--wide">
                      <span className="profile-info-label">Dirección de residencia</span>
                      <div className="profile-info-value">
                        <Icon name="home_pin" size={20} />
                        {profile?.direccion || 'No registrada'}
                      </div>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-info-label">Licencia médica</span>
                      <div className="profile-info-value profile-info-value--mono">
                        <Icon name="id_card" size={20} />
                        {profile?.licenciaMedica || 'No registrada'}
                      </div>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-info-label">Fecha de incorporación</span>
                      <div className="profile-info-value">
                        <Icon name="calendar_month" size={20} />
                        {formatFecha(profile?.fechaIncorporacion ?? profile?.fechaRegistro)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Mapa Leaflet (decisión PO): sin API key, posicional en CR.
                    El chip de ubicación es HTML accesible, fuera del div del mapa. */}
                <section className="profile-map-card" aria-label="Mapa de ubicación">
                  <ProfileMap />
                  <div className="profile-map-chip">
                    <Icon name="location_on" size={20} filled />
                    <div className="profile-map-chip-text">
                      <span className="profile-map-chip-title">Ubicación Actual</span>
                      <span className="profile-map-chip-sub">Zona de cobertura activa</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="profile-grid-side">
                {/* Redes & Contacto: logos SVG de marca en grid 2×N, edición
                    inline conservada (mismo flujo que el hook useProfile). */}
                <section className="profile-card" aria-label="Redes y contacto">
                  <div className="profile-card-head">
                    <h2 className="profile-card-title">
                      <Icon name="hub" size={20} />
                      Redes & Contacto
                    </h2>
                    <Badge
                      variant={connectedCount > 0 ? 'active' : 'neutral'}
                      className="profile-social-count"
                    >
                      {connectedCount} Conectadas
                    </Badge>
                  </div>
                  <div className="profile-social-grid">
                    {REDES_PREDETERMINADAS.map((red) => {
                      const url = socialLinks[red.plataforma] || null
                      const username = url ? url.replace(red.link, '') : ''
                      const editing = editingSocial === red.plataforma
                      if (editing) {
                        return (
                          <div key={red.plataforma} className="profile-social-tile profile-social-tile--editing">
                            <div className="profile-social-logo" style={{ color: red.color }}>
                              <SocialIcon plataforma={red.plataforma} size={24} />
                            </div>
                            <div className="profile-social-edit">
                              <span className="profile-social-base">{red.link}</span>
                              <input
                                className="profile-social-input"
                                value={socialInput}
                                placeholder={red.placeholder}
                                aria-label={`Usuario de ${red.label}`}
                                onChange={(event) => setSocialInput(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') { event.preventDefault(); saveSocialLink() }
                                }}
                                autoFocus
                              />
                              <div className="profile-social-edit-actions">
                                <Button size="sm" onClick={saveSocialLink}>Guardar</Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditingSocial}>Cancelar</Button>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={red.plataforma}
                          type="button"
                          className="profile-social-tile"
                          onClick={() => startEditingSocial(red.plataforma)}
                          aria-label={`${url ? 'Editar' : 'Conectar'} ${red.label}`}
                        >
                          <div className="profile-social-logo" style={{ color: red.color }}>
                            <SocialIcon plataforma={red.plataforma} size={24} />
                          </div>
                          <span className="profile-social-name">{red.label}</span>
                          {url
                            ? <span className="profile-social-handle">@{username}</span>
                            : <span className="profile-social-empty">No conectado</span>}
                          <Icon name={url ? 'edit' : 'add_link'} size={16} className="profile-social-action" />
                        </button>
                      )
                    })}
                    {primeraSinVincular && (
                      <button
                        type="button"
                        className="profile-social-tile profile-social-tile--add"
                        onClick={() => startEditingSocial(primeraSinVincular.plataforma)}
                        aria-label="Vincular nueva cuenta"
                      >
                        <div className="profile-social-logo profile-social-logo--add">
                          <Icon name="add" size={20} />
                        </div>
                        <span className="profile-social-name">Vincular Nueva Cuenta</span>
                      </button>
                    )}
                  </div>
                  {/* QA T28 Fix 2: feedback real si el PUT de una red falla
                      (ej. plataforma no permitida o URL inválida); nunca un
                      estado optimista falso. */}
                  {socialError && (
                    <p className="profile-error" role="alert">
                      <Icon name="error" size={16} />
                      {socialError}
                    </p>
                  )}
                </section>

                {/* Credenciales profesionales (wireframe "Certificación"): se
                    renderiza solo cuando el backend expone datos reales
                    (especialidad / id corporativo). Sin datos -> sin card. */}
                {(profile?.especialidad || profile?.idCorporativo) && (
                  <section className="profile-cred" aria-label="Credenciales profesionales">
                    <div className="profile-cred-icon">
                      <Icon name="workspace_premium" size={32} />
                    </div>
                    <div className="profile-cred-body">
                      <h3 className="profile-cred-title">{profile.especialidad || 'Credencial profesional'}</h3>
                      <p className="profile-cred-sub">{profile.idCorporativo || profile.sede || 'Perfil profesional'}</p>
                    </div>
                    <Badge variant={vigente ? 'success' : 'error'} dot>
                      {vigente ? 'Vigente' : 'Inactivo'}
                    </Badge>
                  </section>
                )}
              </div>
            </div>

            {confirmation && (
              <div className="profile-success" role="status">
                <Icon name="check_circle" size={18} />
                <p>{confirmation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}