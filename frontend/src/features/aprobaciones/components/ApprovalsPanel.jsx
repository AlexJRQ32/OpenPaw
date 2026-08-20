import { useState, useEffect } from 'react'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Button } from '../../../shared/components/Button/Button'
import { authFetch } from '../../../shared/utils/api'
import { API_BASE_URL } from '../../../constants'
import { useToast } from '../../../shared/context/ToastContext'
import { useApprovals } from '../hooks/useApprovals'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-CR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDateFull(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getEstado(s) {
  if (s.aprobada) return 'aprobado'
  if (s.rechazada) return 'rechazado'
  return 'pendiente'
}

function statusBadge(estado) {
  if (estado === 'aprobado') return { variant: 'success', label: 'Aprobado' }
  if (estado === 'rechazado') return { variant: 'error', label: 'Rechazado' }
  return { variant: 'info', label: 'Pendiente' }
}

export function ApprovalsPanel() {
  const {
    solicitudes, listStatus, listError,
    loadingId, rechazar, fetchSolicitudes,
  } = useApprovals()
  const toast = useToast()

  const [almacenes, setAlmacenes] = useState([])
  const [almacenesStatus, setAlmacenesStatus] = useState("loading")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await authFetch(`${API_BASE_URL}/almacenes`)
        if (!r.ok) throw new Error()
        const d = await r.json()
        if (!cancelled) { setAlmacenes(Array.isArray(d) ? d : []); setAlmacenesStatus("loaded") }
      } catch { if (!cancelled) setAlmacenesStatus("error") }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const [detailSolicitud, setDetailSolicitud] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [rechazarOpen, setRechazarOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAprobar = async (id) => {
    setSubmitting(true)
    try {
      const isAlmacen = detailSolicitud && "tipo" in detailSolicitud
      const url = isAlmacen ? `${API_BASE_URL}/almacenes/${id}/aprobar` : `${API_BASE_URL}/veterinarias/${id}/aprobar`
      await authFetch(url, { method: "PUT" })
      setConfirmAction(null); setDetailSolicitud(null)
      if (isAlmacen) {
        const r = await authFetch(`${API_BASE_URL}/almacenes`)
        const d = await r.json()
        setAlmacenes(Array.isArray(d) ? d : [])
      } else { await fetchSolicitudes() }
      toast.success('Solicitud aprobada.')
    }
    catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const handleRechazar = async (id) => {
    if (!motivo.trim()) return
    setSubmitting(true)
    try {
      const isAlmacen = detailSolicitud && "tipo" in detailSolicitud
      if (isAlmacen) {
        const response = await authFetch(`${API_BASE_URL}/almacenes/${id}/rechazar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivoRechazo: motivo.trim() }),
        })
        if (!response.ok) throw new Error("No se pudo rechazar la solicitud.")
        const r = await authFetch(`${API_BASE_URL}/almacenes`)
        const d = await r.json()
        setAlmacenes(Array.isArray(d) ? d : [])
      } else {
        await rechazar(id, motivo.trim())
      }
      window.dispatchEvent(new CustomEvent('pending-changed')); setRechazarOpen(false); setMotivo(''); setDetailSolicitud(null)
      toast.error('Solicitud rechazada.')
    }
    catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const allItems = [...solicitudes, ...(almacenesStatus === "loaded" ? almacenes : [])]
  const pendingCount = allItems.filter((s) => getEstado(s) === 'pendiente').length
  const approvedCount = allItems.filter((s) => s.aprobada).length
  const rejectedCount = allItems.filter((s) => s.rechazada).length

  return (
    <div className="approvals-panel">
      <div className="approvals-stats">
        <div className="approvals-stat">
          <span className="approvals-stat-number">{allItems.length}</span>
          <span className="approvals-stat-label">Total</span>
        </div>
        <div className="approvals-stat">
          <span className="approvals-stat-number">{pendingCount}</span>
          <span className="approvals-stat-label">Pendientes</span>
        </div>
        <div className="approvals-stat">
          <span className="approvals-stat-number">{approvedCount}</span>
          <span className="approvals-stat-label">Aprobadas</span>
        </div>
        <div className="approvals-stat">
          <span className="approvals-stat-number">{rejectedCount}</span>
          <span className="approvals-stat-label">Rechazadas</span>
        </div>
      </div>

      <div className="approvals-table-card">
        <div className="approvals-table-wrap"><table className="approvals-table">
          <thead>
            <tr>
              <th>Comercio</th>
              <th>Cedula</th>
              <th>Email</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listStatus === 'loading' && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            )}
            {listStatus === 'error' && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#b42318' }}>{listError}</td></tr>
            )}
            {listStatus === 'loaded' && solicitudes.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#888' }}>No hay solicitudes de registro.</td></tr>
            )}
            {listStatus === 'loaded' && solicitudes.map((s) => {
              const badge = statusBadge(getEstado(s))
              return (
                <tr key={s.id || s.nombre}>
                  <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                  <td>{s.cedulaJuridica || '---'}</td>
                  <td>{s.email || '---'}</td>
                  <td>{formatDate(s.fechaRegistro || s.fechaCreacion || s.fecha)}</td>
                  <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                  <td>
                    <div className="approval-actions">
                      <button className="btn-view" onClick={() => setDetailSolicitud(s)}>Ver</button>
                      {(getEstado(s) === 'pendiente') && (
                        <>
                          <button className="btn-approve" onClick={() => { setDetailSolicitud(s); setConfirmAction('aprobar') }} disabled={loadingId === s.id}>
                            {loadingId === s.id ? '...' : 'Aprobar'}
                          </button>
                          <button className="btn-reject" onClick={() => { setDetailSolicitud(s); setRechazarOpen(true) }} disabled={loadingId === s.id}>
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>

      {/* Store registrations */}
      <h3 style={{margin:"24px 0 12px",fontSize:16,fontWeight:700,color:"#000"}}>Solicitudes de almacen</h3>
      <div className="approvals-table-card">
        <div className="approvals-table-wrap"><table className="approvals-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cedula</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {almacenesStatus === "loading" && <tr><td colSpan="6" style={{textAlign:"center",padding:40}}><span className="spinner" /></td></tr>}
            {almacenesStatus === "loaded" && almacenes.length === 0 && <tr><td colSpan="6" style={{textAlign:"center",padding:40,color:"#888"}}>No hay solicitudes de almacen.</td></tr>}
            {almacenesStatus === "loaded" && almacenes.map((a) => {
              const estado = a.aprobada ? "aprobado" : a.rechazada ? "rechazado" : "pendiente"
              return (
                <tr key={a.id || a.nombre}>
                  <td style={{fontWeight:600}}>{a.nombre}</td>
                  <td>{a.cedulaJuridica || "---"}</td>
                  <td>{a.email || "---"}</td>
                  <td>{a.telefono || "---"}</td>
                  <td><Badge variant={estado === "aprobado" ? "success" : estado === "rechazado" ? "error" : "info"}>{estado === "aprobado" ? "Aprobado" : estado === "rechazado" ? "Rechazado" : "Pendiente"}</Badge></td>
                  <td>
                    <div className="approval-actions">
                      <button className="btn-view" onClick={() => setDetailSolicitud(a)}>Ver</button>
                      {estado === "pendiente" && (
                        <>
                          <button className="btn-approve" onClick={() => { setDetailSolicitud(a); setConfirmAction("aprobar") }}>Aprobar</button>
                          <button className="btn-reject" onClick={() => { setDetailSolicitud(a); setRechazarOpen(true) }}>Rechazar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>      {/* Modal redisenado */}
      <Modal open={!!detailSolicitud} onClose={() => { setDetailSolicitud(null); setConfirmAction(null); setRechazarOpen(false); setMotivo('') }}>
        {detailSolicitud && (
          <div>
            <div className="approval-modal-header" style={{ margin: '-24px -24px 0', padding: 24, background: 'linear-gradient(135deg, #dfeaff 0%, #b3d4ff 100%)', borderBottom: '1px solid #e0e0e0', borderRadius: '16px 16px 0 0', position: 'relative' }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: '#003399' }}>{detailSolicitud.nombre}</h2>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Solicitado {formatDateFull(detailSolicitud.fechaRegistro || detailSolicitud.fechaCreacion || detailSolicitud.fecha)}</p>
              </div>
              <span style={{ position: 'absolute', top: 12, right: 12 }}>
                <Badge variant={statusBadge(getEstado(detailSolicitud)).variant}>{statusBadge(getEstado(detailSolicitud)).label}</Badge>
              </span>
              <button onClick={() => { setDetailSolicitud(null); setConfirmAction(null); setRechazarOpen(false); setMotivo('') }}
                style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.7)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18, color: '#666', display: 'grid', placeItems: 'center' }}
                aria-label="Cerrar">&times;</button>
            </div>

            <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="Informacion del comercio" fields={[
                { label: 'Nombre', value: detailSolicitud.nombre },
                { label: 'Cedula juridica', value: detailSolicitud.cedulaJuridica },
                { label: 'Telefono', value: detailSolicitud.telefono },
                { label: 'Email', value: detailSolicitud.email },
                { label: 'Direccion', value: detailSolicitud.direccion, full: true },
                { label: 'Descripcion', value: detailSolicitud.descripcion, full: true },
              ]} />

              <div className="approval-modal-section">
                <span className="approval-info-label" style={{ display: 'block', marginBottom: 8 }}>Documentacion</span>
                <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                  {detailSolicitud.documentoPersoneriaJuridica ? 'Documento de personeria juridica adjunto' : 'Sin documentacion adjunta'}
                </p>
              </div>

              {(getEstado(detailSolicitud) === 'Pendiente' || getEstado(detailSolicitud) === 'pendiente') && !confirmAction && !rechazarOpen && (
                <div className="approval-modal-actions">
                  <Button variant="danger" onClick={() => setRechazarOpen(true)}>Rechazar</Button>
                  <Button variant="primary" onClick={() => setConfirmAction('aprobar')}>Aprobar</Button>
                </div>
              )}

              {confirmAction === 'aprobar' && (
                <div className="approval-confirm-panel approval-confirm-panel--approve">
                  <p>Esta seguro de aprobar esta solicitud?</p>
                  <div className="approval-confirm-actions">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} disabled={submitting}>Cancelar</Button>
                    <Button variant="primary" size="sm" onClick={() => handleAprobar(detailSolicitud.id)} disabled={submitting}>
                      {submitting ? 'Aprobando...' : 'Confirmar aprobacion'}
                    </Button>
                  </div>
                </div>
              )}

              {rechazarOpen && (
                <div className="approval-confirm-panel approval-confirm-panel--reject">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#b42318' }}>Motivo de rechazo</label>
                  <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Indique el motivo del rechazo..." rows={3}
                    style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                  <div className="approval-confirm-actions">
                    <Button variant="ghost" size="sm" onClick={() => { setRechazarOpen(false); setMotivo('') }} disabled={submitting}>Cancelar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleRechazar(detailSolicitud.id)} disabled={submitting || !motivo.trim()}>
                      {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Section({ title, fields }) {
  return (
    <div className="approval-modal-section">
      <span className="approval-info-label" style={{ display: 'block', marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
      <div className="approval-info-grid">
        {fields.map((f, i) => (
          <div key={i} style={f.full ? { gridColumn: '1 / -1' } : {}}>
            <span className="approval-info-label">{f.label}</span>
            <p className="approval-info-value">{f.value || '---'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
