import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { Pagination } from '../../../shared/components/Pagination/Pagination'
import { PetSelector } from '../../../shared/components/PetSelector/PetSelector'
import { useAportes, tipoMeta } from '../hooks/useAportes'
import {
  esUrlAdjuntoSegura,
  formatFechaHora,
  formatFechaLarga,
  iconoAdjunto,
  nombreArchivoAdjunto,
  parseMedicamentos,
  tiempoRelativo,
} from '../utils/aportesFormat'
import './AportesPage.css'

/* Aportes por página (cards grandes de ancho completo, como el wireframe). */
const PAGE_SIZE = 4

const TIPO_OPCIONES = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Tratamiento', label: 'Tratamiento' },
  { value: 'Vacuna', label: 'Vacuna' },
  { value: 'Emergencia', label: 'Emergencia' },
]

function nombreMascotaDe(id, mascotas) {
  return mascotas.find((m) => String(m.id) === String(id))?.nombre || null
}

/* ---------------------------------------------------------------------------
   Chips de medicación (wireframe: píldoras dentro del box "Medicación").
   El backend guarda texto libre; se separa y se muestra un chip por fármaco.
   --------------------------------------------------------------------------- */
function MedicacionChips({ medicamentos }) {
  const chips = parseMedicamentos(medicamentos)
  if (chips.length === 0) {
    return <p className="apr-card__detalle-vacio">Sin medicación indicada.</p>
  }
  return (
    <ul className="apr-chips" aria-label="Medicamentos indicados">
      {chips.map((med, i) => (
        <li key={`${i}-${med.toLowerCase()}`} className="apr-chip">
          <Icon name="medication" size={12} aria-hidden="true" />
          {med}
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------------------
   Columna "Adjuntos" (wireframe): enlace al archivo con icono según tipo,
   aviso si la URL no es segura (http/https), o mini estado "Sin adjuntos".
   --------------------------------------------------------------------------- */
function AdjuntosAporte({ url }) {
  const tieneUrl = Boolean(url)
  const segura = tieneUrl && esUrlAdjuntoSegura(url)

  if (!tieneUrl) {
    return (
      <div className="apr-sin-adjunto">
        <span className="apr-sin-adjunto__icono" aria-hidden="true">
          <Icon name="attachment" size={20} />
        </span>
        <p>Sin adjuntos</p>
      </div>
    )
  }

  if (!segura) {
    /* URL presente pero con protocolo no permitido: nunca como href. */
    return (
      <p className="apr-adjunto-invalido">
        <Icon name="link_off" size={18} />
        Adjunto con URL no válida
      </p>
    )
  }

  return (
    <a
      className="apr-adjunto"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir adjunto ${nombreArchivoAdjunto(url)} en una nueva pestaña`}
    >
      <Icon name={iconoAdjunto(url)} size={20} className="apr-adjunto__icono" />
      <span className="apr-adjunto__texto">
        <span className="apr-adjunto__nombre">{nombreArchivoAdjunto(url)}</span>
        <span className="apr-adjunto__hint">Abre en una pestaña nueva</span>
      </span>
      <Icon name="open_in_new" size={16} className="apr-adjunto__go" />
    </a>
  )
}

/* ---------------------------------------------------------------------------
   Card de aporte (wireframe): borde de color por tipo, badge + fecha,
   acciones editar/eliminar, título, veterinaria, box diagnóstico/medicación
   y columna de adjuntos a la derecha.
   El botón Editar (✎ del wireframe) solo se renderiza si puedeEditar
   (propietario del aporte o admin — gating del PUT en backend).
   --------------------------------------------------------------------------- */
function AporteCard({ aporte, mostrarMascota, nombreMascota, puedeEditar, onEditar, onEliminar }) {
  const meta = tipoMeta(aporte.tipoAtencion)
  const fechaLarga = formatFechaLarga(aporte.fechaAtencion)
  const etiquetaAccion = `aporte de ${aporte.veterinariaNombre || 'veterinaria externa'}`

  return (
    <article className={`apr-card apr-card--${meta.tono}`} aria-label={`${meta.label}: ${aporte.descripcion}`}>
      <span className="apr-card__edge" aria-hidden="true" />

      <div className="apr-card__body">
        <header className="apr-card__top">
          <div className="apr-card__tags">
            <Badge variant={meta.variant} icon={meta.icono}>{meta.label}</Badge>
            {fechaLarga && (
              <span className="apr-card__fecha">
                <Icon name="calendar_today" size={14} />
                {fechaLarga}
              </span>
            )}
            {mostrarMascota && nombreMascota && (
              <span className="apr-card__pet">
                <Icon name="pets" size={14} />
                {nombreMascota}
              </span>
            )}
          </div>
          {puedeEditar && (
            <button
              type="button"
              className="apr-iconbtn"
              title="Editar"
              aria-label={`Editar ${etiquetaAccion}`}
              onClick={() => onEditar(aporte)}
            >
              <Icon name="edit" size={18} />
            </button>
          )}
          <button
            type="button"
            className="apr-iconbtn apr-iconbtn--danger"
            title="Eliminar"
            aria-label={`Eliminar ${etiquetaAccion}`}
            onClick={() => onEliminar(aporte)}
          >
            <Icon name="delete" size={18} />
          </button>
        </header>

        <h3 className="apr-card__titulo">{aporte.descripcion || 'Aporte sin descripción'}</h3>

        <p className="apr-card__vet">
          <Icon name="local_hospital" size={16} />
          {aporte.veterinariaNombre || 'Veterinaria externa'}
        </p>

        {(aporte.diagnostico || parseMedicamentos(aporte.medicamentos).length > 0) && (
          <div className="apr-card__detalles">
            <div>
              <h4 className="apr-side-label">Diagnóstico / Notas</h4>
              <p className="apr-card__diagnostico">{aporte.diagnostico || 'Sin diagnóstico registrado.'}</p>
            </div>
            <div>
              <h4 className="apr-side-label">Medicación</h4>
              <MedicacionChips medicamentos={aporte.medicamentos} />
            </div>
          </div>
        )}

        {aporte.fechaRegistro && (
          <p className="apr-card__registro">Registrado el {formatFechaHora(aporte.fechaRegistro)}</p>
        )}
      </div>

      <aside className="apr-card__adjuntos" aria-label="Adjuntos del aporte">
        <h4 className="apr-side-label">Adjuntos</h4>
        <AdjuntosAporte url={aporte.archivoAdjuntoUrl} />
      </aside>
    </article>
  )
}

export function AportesPage() {
  const {
    mascotas,
    infoMascotas,
    aportes,
    seleccion,
    setSeleccion,
    infoStatus,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNuevo,
    cerrar,
    handleChange,
    guardar,
    confirmState,
    confirmLoading,
    solicitarEliminar,
    cancelarConfirmacion,
    ejecutarEliminacion,
    puedeEditarAporte,
    edicion,
    editForm,
    editErrors,
    editStatus,
    editError,
    abrirEdicion,
    cerrarEdicion,
    handleEditChange,
    editarAporte,
  } = useAportes()

  const [page, setPage] = useState(1)

  /* Cambiar de píldora siempre vuelve a la primera página. Patrón React de
     "ajuste de estado durante render" (sin effects): cubre tanto cambios del
     usuario como el salto interno del hook tras registrar en otra mascota. */
  const [paginaDe, setPaginaDe] = useState(seleccion)
  if (paginaDe !== seleccion) {
    setPaginaDe(seleccion)
    setPage(1)
  }

  const verTodas = seleccion === 'all'

  /* Paginación client-side con clamp sin effects (patrón Funcionarios T32). */
  const totalPages = Math.max(1, Math.ceil(aportes.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const visibles = useMemo(
    () => aportes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [aportes, safePage]
  )

  const stats = useMemo(() => {
    let ultima = ''
    for (const a of aportes) {
      const t = new Date(a.fechaAtencion || 0).getTime()
      if (!Number.isNaN(t) && t > new Date(ultima || 0).getTime()) ultima = a.fechaAtencion
    }
    return { total: aportes.length, ultimaVisita: ultima }
  }, [aportes])

  const tituloResumen = verTodas
    ? 'todas las mascotas'
    : nombreMascotaDe(seleccion, mascotas) || 'tu mascota'
  const proximaVacuna = verTodas ? null : infoMascotas[String(seleccion)]?.proximaVacuna

  const maxDatetime = new Date().toISOString().slice(0, 16)

  return (
    <AppShell>
      <div className="apr-page">
        {/* ------------------------------------------------------------ header */}
        <header className="apr-header">
          <div>
            <span className="apr-eyebrow">Expediente médico</span>
            <h1 className="apr-title">Mis Aportes Médicos</h1>
            <p className="apr-subtitle">
              Revisa el historial de atenciones médicas y aportes registrados para tus
              mascotas por veterinarias externas.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon="add_circle"
            onClick={abrirNuevo}
            disabled={mascotas.length === 0}
          >
            Registrar aporte
          </Button>
        </header>

        {infoStatus === 'loading' && (
          <div className="spinner-wrap" role="status" aria-label="Cargando expediente">
            <span className="spinner" />
          </div>
        )}
        {infoStatus === 'error' && <p className="apr-error" role="alert">{listError}</p>}

        {infoStatus === 'loaded' && mascotas.length === 0 && (
          <EmptyState
            icon="pets"
            title="Sin mascotas"
            description="No tienes mascotas registradas para gestionar su expediente."
          />
        )}

        {infoStatus === 'loaded' && mascotas.length > 0 && (
          <>
            <PetSelector
              pets={mascotas}
              value={seleccion}
              onChange={setSeleccion}
              showAllOption
            />

            <div className="apr-main">
            {/* ---------------------------------------------------- resumen */}
            <aside className="apr-side" aria-label="Resumen de aportes médicos">
              <section className="apr-resumen">
                <div className="apr-resumen__head">
                  <span className="apr-resumen__icono" aria-hidden="true">
                    <Icon name="monitoring" size={22} />
                  </span>
                  <h2>Resumen</h2>
                  <span className="apr-resumen__quien">{tituloResumen}</span>
                </div>
                <dl className="apr-resumen__filas">
                  <div className="apr-resumen__fila">
                    <dt>Total aportes</dt>
                    <dd>{stats.total}</dd>
                  </div>
                  <div className="apr-resumen__fila">
                    <dt>Última visita</dt>
                    <dd>{tiempoRelativo(stats.ultimaVisita)}</dd>
                  </div>
                  {!verTodas && (
                    <div className="apr-resumen__fila">
                      <dt>Próxima vacuna</dt>
                      <dd className={!proximaVacuna ? 'is-vacio' : 'is-proxima'}>
                        {proximaVacuna || 'Sin registro'}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="apr-nota" aria-hidden="true">
                <Icon name="health_and_safety" size={30} />
                <h4>Mantén el control</h4>
                <p>
                  Registrar los aportes médicos asegura que el historial de tu mascota esté
                  siempre completo y accesible ante cualquier emergencia.
                </p>
              </section>
            </aside>

            {/* ------------------------------------------------------- listado */}
            <section className="apr-content" aria-label="Historial de aportes médicos">
              {(listStatus === 'loading' || listStatus === 'idle') && (
                <div className="spinner-wrap" role="status" aria-label="Cargando aportes">
                  <span className="spinner" />
                </div>
              )}
              {listStatus === 'error' && <p className="apr-error" role="alert">{listError}</p>}

              {listStatus === 'loaded' && !seleccion && (
                <EmptyState
                  icon="pets"
                  title="Selecciona una mascota"
                  description="Elige una mascota para ver su expediente."
                />
              )}

              {listStatus === 'loaded' && seleccion && aportes.length === 0 && (
                <EmptyState
                  icon="medical_services"
                  title="Sin aportes"
                  description={`No hay aportes registrados para ${verTodas ? 'tus mascotas' : tituloResumen}.`}
                  action={
                    <Button variant="primary" size="md" icon="add_circle" onClick={abrirNuevo}>
                      Registrar aporte
                    </Button>
                  }
                />
              )}

              {listStatus === 'loaded' && visibles.length > 0 && (
                <div className="apr-lista">
                  {visibles.map((aporte) => (
                    <AporteCard
                      key={aporte.id}
                      aporte={aporte}
                      mostrarMascota={verTodas}
                      nombreMascota={nombreMascotaDe(aporte.mascotaId, mascotas)}
                      puedeEditar={puedeEditarAporte(aporte)}
                      onEditar={abrirEdicion}
                      onEliminar={solicitarEliminar}
                    />
                  ))}
                </div>
              )}

              {aportes.length > PAGE_SIZE && (
                <div className="apr-pagination">
                  <Pagination
                    page={safePage}
                    pageSize={PAGE_SIZE}
                    total={aportes.length}
                    onChange={setPage}
                  />
                </div>
              )}
            </section>
            </div>
          </>
        )}

        {/* --------------------------------------------------- modal crear */}
        <Modal open={modalOpen} onClose={cerrar} className="apr-modal">
          <div>
            <h2>Registrar aporte de expediente</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Mascota</span>
                  <select name="mascotaId" value={form.mascotaId} onChange={handleChange}>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  {errors.mascotaId && <small>{errors.mascotaId}</small>}
                </label>
                <label className="field">
                  <span>Veterinaria</span>
                  <input
                    type="text"
                    name="veterinariaNombre"
                    value={form.veterinariaNombre}
                    onChange={handleChange}
                    placeholder="Nombre de la veterinaria externa"
                  />
                  {errors.veterinariaNombre && <small>{errors.veterinariaNombre}</small>}
                </label>
                <label className="field">
                  <span>Fecha de atención</span>
                  <input
                    type="datetime-local"
                    name="fechaAtencion"
                    value={form.fechaAtencion}
                    onChange={handleChange}
                    max={maxDatetime}
                  />
                  {errors.fechaAtencion && <small>{errors.fechaAtencion}</small>}
                </label>
                <label className="field">
                  <span>Tipo de atención</span>
                  <select name="tipoAtencion" value={form.tipoAtencion} onChange={handleChange}>
                    <option value="">Seleccionar tipo...</option>
                    {TIPO_OPCIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.tipoAtencion && <small>{errors.tipoAtencion}</small>}
                </label>
                <label className="field field--full">
                  <span>Descripción</span>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe la atención recibida"
                  />
                  {errors.descripcion && <small>{errors.descripcion}</small>}
                </label>
                <label className="field field--full">
                  <span>Diagnóstico (opcional)</span>
                  <textarea
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Diagnóstico de la atención"
                  />
                </label>
                <label className="field field--full">
                  <span>Medicamentos (opcional)</span>
                  <input
                    type="text"
                    name="medicamentos"
                    value={form.medicamentos}
                    onChange={handleChange}
                    placeholder="Separados por coma: Meloxicam 1mg/kg, Amoxicilina 15mg/kg"
                  />
                </label>
                <label className="field field--full">
                  <span>URL de archivo adjunto (opcional)</span>
                  <input
                    type="url"
                    name="archivoAdjuntoUrl"
                    value={form.archivoAdjuntoUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="apr-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : 'Registrar aporte'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* -------------------------------------------------- modal editar */}
        <Modal open={!!edicion} onClose={cerrarEdicion} className="apr-modal">
          <div>
            <h2>Editar aporte</h2>
            <p className="apr-modal__nota">
              <Icon name="lock" size={14} />
              Mascota: <strong>{nombreMascotaDe(edicion?.mascotaId, mascotas) || `#${edicion?.mascotaId ?? '?'}`}</strong>
              {' '}— la pertenencia del aporte no se puede cambiar.
            </p>
            <form onSubmit={editarAporte} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Veterinaria</span>
                  <input
                    type="text"
                    name="veterinariaNombre"
                    value={editForm.veterinariaNombre}
                    onChange={handleEditChange}
                  />
                  {editErrors.veterinariaNombre && <small>{editErrors.veterinariaNombre}</small>}
                </label>
                <label className="field">
                  <span>Fecha de atención</span>
                  <input
                    type="datetime-local"
                    name="fechaAtencion"
                    value={editForm.fechaAtencion}
                    onChange={handleEditChange}
                    max={maxDatetime}
                  />
                  {editErrors.fechaAtencion && <small>{editErrors.fechaAtencion}</small>}
                </label>
                <label className="field">
                  <span>Tipo de atención</span>
                  <select name="tipoAtencion" value={editForm.tipoAtencion} onChange={handleEditChange}>
                    <option value="">Seleccionar tipo...</option>
                    {TIPO_OPCIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {editErrors.tipoAtencion && <small>{editErrors.tipoAtencion}</small>}
                </label>
                <label className="field field--full">
                  <span>Descripción</span>
                  <textarea
                    name="descripcion"
                    value={editForm.descripcion}
                    onChange={handleEditChange}
                    rows="3"
                  />
                  {editErrors.descripcion && <small>{editErrors.descripcion}</small>}
                </label>
                <label className="field field--full">
                  <span>Diagnóstico</span>
                  <textarea
                    name="diagnostico"
                    value={editForm.diagnostico}
                    onChange={handleEditChange}
                    rows="2"
                  />
                </label>
                <label className="field field--full">
                  <span>Medicamentos</span>
                  <input
                    type="text"
                    name="medicamentos"
                    value={editForm.medicamentos}
                    onChange={handleEditChange}
                  />
                </label>
                <label className="field field--full">
                  <span>URL de archivo adjunto</span>
                  <input
                    type="url"
                    name="archivoAdjuntoUrl"
                    value={editForm.archivoAdjuntoUrl}
                    onChange={handleEditChange}
                    placeholder="https://..."
                  />
                </label>
              </div>
              {/* Errores del servidor (400/403/404) dentro del modal, sin cerrarlo */}
              {editError && <p className="submit-error" role="alert">{editError}</p>}
              <div className="apr-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrarEdicion}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={editStatus === 'submitting'}>
                  {editStatus === 'submitting' ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* ---------------------------------------------- confirmar eliminar */}
        <ConfirmDialog
          open={!!confirmState}
          title="¿Eliminar aporte?"
          message={confirmState?.aporte
            ? `Se eliminará el aporte de "${confirmState.aporte.veterinariaNombre}" del ${formatFechaLarga(confirmState.aporte.fechaAtencion)}.`
            : ''}
          confirmLabel="Eliminar"
          variant="danger"
          loading={confirmLoading}
          onConfirm={ejecutarEliminacion}
          onCancel={cancelarConfirmacion}
        />
      </div>
    </AppShell>
  )
}

export default AportesPage
