import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { useMascotas } from '../hooks/useMascotas'
import './MascotasPage.css'

const SEXO_MAP = { 1: 'Macho', 2: 'Hembra' }

function valorONada(valor) {
  return valor ? valor : '—'
}

export function MascotasPage() {
  const {
    esCliente,
    mascotas,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrir,
    cerrar,
    handleChange,
    guardar,
  } = useMascotas()

  return (
    <AppShell>
      <div className="mascotas-page">
        <div className="mascotas-header">
          <div>
            <h1 className="mascotas-title">
              <i className="fas fa-paw"></i> Mis mascotas
            </h1>
            <p className="mascotas-subtitle">
              Consulta la informacion de las mascotas registradas a tu nombre.
            </p>
          </div>
          {esCliente && (
            <Button variant="primary" size="md" onClick={abrir}>
              <i className="fas fa-plus"></i> Agregar mascota
            </Button>
          )}
        </div>

        {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}

        {listStatus === 'error' && <p className="mascotas-error">{listError}</p>}

        {listStatus === 'loaded' && mascotas.length === 0 && (
          <EmptyState title="Aun no tienes mascotas" description="Cuando registres una mascota aparecera aqui." />
        )}

        {listStatus === 'loaded' && mascotas.length > 0 && (
          <div className="mascotas-grid">
            {mascotas.map((m) => (
              <div key={m.id} className="mascota-card">
                <div className="mascota-card-top">
                  <div className="mascota-icon">
                    <i className="fas fa-paw"></i>
                  </div>
                  <div className="mascota-name">{m.nombre}</div>
                </div>
                <div className="mascota-card-grid">
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-venus-mars"></i> Especie
                    </p>
                    <p className="mascota-detail-value">{valorONada(m.especie)}</p>
                  </div>
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-dog"></i> Raza
                    </p>
                    <p className="mascota-detail-value">{valorONada(m.raza)}</p>
                  </div>
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-venus-mars"></i> Sexo
                    </p>
                    <p className="mascota-detail-value">{SEXO_MAP[m.sexo] ?? '—'}</p>
                  </div>
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-weight-hanging"></i> Peso
                    </p>
                    <p className="mascota-detail-value">{m.peso != null ? `${m.peso} kg` : '—'}</p>
                  </div>
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-palette"></i> Color
                    </p>
                    <p className="mascota-detail-value">{valorONada(m.color)}</p>
                  </div>
                  <div className="mascota-detail">
                    <p className="mascota-detail-label">
                      <i className="fas fa-id-badge"></i> Identificacion
                    </p>
                    <p className="mascota-detail-value">{valorONada(m.identificacion)}</p>
                  </div>
                  {m.veterinaria && (
                    <div className="mascota-detail mascota-detail--full">
                      <p className="mascota-detail-label">
                        <i className="fas fa-hospital"></i> Veterinaria
                      </p>
                      <p className="mascota-detail-value">{m.veterinaria}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={cerrar} className="mascotas-modal">
        <div className="mascotas-modal-header">
          <div className="mascotas-modal-icon" aria-hidden="true">
            <i className="fas fa-paw"></i>
          </div>
          <div className="mascotas-modal-heading">
            <h2 className="mascotas-modal-title">Agregar mascota</h2>
            <p className="mascotas-modal-subtitle">Completa los datos de tu nueva mascota.</p>
          </div>
          <button type="button" className="mascotas-modal-close" onClick={cerrar} aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={guardar} noValidate>
          <fieldset className="mascotas-form-section">
            <legend className="mascotas-form-section-title">
              <i className="fas fa-paw"></i>
              Informacion basica
            </legend>
            <div className="mascotas-field-grid">
              <Field
                className={`mascotas-field--required${errors.nombre ? ' mascotas-field--error' : ''}`}
                label="Nombre"
                name="nombre"
                value={form.nombre}
                error={errors.nombre}
                onChange={handleChange}
                placeholder="Ej: Luna"
              />
              <label className={`field mascotas-field--required${errors.especie ? ' mascotas-field--error' : ''}`}>
                <span>Especie</span>
                <select name="especie" value={form.especie} onChange={handleChange}>
                  <option value="">Seleccionar especie...</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.especie && <small>{errors.especie}</small>}
              </label>
              <label className={`field mascotas-field--required${errors.sexo ? ' mascotas-field--error' : ''}`}>
                <span>Sexo</span>
                <select name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Seleccionar sexo...</option>
                  <option value="1">Macho</option>
                  <option value="2">Hembra</option>
                </select>
                {errors.sexo && <small>{errors.sexo}</small>}
              </label>
              <label className="field">
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="mascotas-form-section">
            <legend className="mascotas-form-section-title">
              <i className="fas fa-sliders-h"></i>
              Detalles opcionales
            </legend>
            <div className="mascotas-field-grid">
              <Field
                label="Raza"
                name="raza"
                value={form.raza}
                onChange={handleChange}
                placeholder="Ej: Golden Retriever"
              />
              <Field
                className={errors.peso ? 'mascotas-field--error' : ''}
                label="Peso (kg)"
                name="peso"
                type="number"
                min="0"
                step="0.1"
                value={form.peso}
                error={errors.peso}
                onChange={handleChange}
                placeholder="0"
              />
              <Field
                label="Color"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="Ej: Cafe con blanco"
              />
              <Field
                label="Identificacion"
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                placeholder="Microchip, placa, etc."
              />
              <Field
                className="mascotas-field--full"
                label="Foto URL"
                name="fotoUrl"
                value={form.fotoUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          <div className="mascotas-modal-footer">
            {submitError && (
              <p className="mascotas-submit-error" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                {submitError}
              </p>
            )}
            <div className="mascotas-modal-actions">
              <Button variant="secondary" type="button" onClick={cerrar} disabled={submitStatus === 'submitting'}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                {submitStatus === 'submitting' ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Guardar mascota
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

export default MascotasPage