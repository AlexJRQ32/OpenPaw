import { useState, useEffect } from 'react'
import { Field } from '../../../shared/components/Field/Field'
import { FileUploadField } from '../../../shared/components/FileUploadField/FileUploadField'

import { useVeterinaryRegistration } from '../hooks/useVeterinaryRegistration'

const FUNCIONARIO_ROLES = [
  { id: 2, nombre: 'Veterinaria' },
]

const STEPS = [
  { num: 1, label: 'Datos del comercio', fields: ['nombreComercio', 'cedulaJuridica', 'direccion', 'telefono', 'email', 'descripcion'] },
  { num: 2, label: 'Equipo de trabajo', fields: [] },
  { num: 3, label: 'Documentacion', fields: [] },
]

export function RegistrationForm() {
  const [step, setStep] = useState(1)
  const {
    form, errors, status, sent, clearSent, formVersion,
    fileSummary, updateField, submitRequest, validateStep,
  } = useVeterinaryRegistration()
  const [showToast, setShowToast] = useState(false)
  const [team, setTeam] = useState([])

  const addTeamMember = () => {
    setTeam((prev) => [...prev, { nombre: '', email: '', rolId: 2 }])
  }

  const removeTeamMember = (index) => {
    setTeam((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTeamMember = (index, field, value) => {
    setTeam((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  useEffect(() => {
    if (sent) {
      setShowToast(true)
      const t = setTimeout(() => { setShowToast(false); clearSent() }, 3500)
      return () => clearTimeout(t)
    }
  }, [sent])

  const currentStep = STEPS.find((s) => s.num === step)
  const nextStep = () => {
    if (!currentStep) return
    if (currentStep.fields.length > 0 && !validateStep(currentStep.fields)) return
    setStep(step + 1)
  }

  return (
    <form className="store-reg-form" noValidate >

      {/* Step Indicator */}
      <div className="steps-bar">
        {STEPS.map((s) => {
          const isActive = s.num === step
          const isDone = s.num < step
          return (
            <div key={s.num} className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-circle">
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Datos del comercio */}
      {step === 1 && (
        <div className="form-card">
          <h3>Datos del comercio</h3>
          <p className="form-card-sub">Informacion publica de la veterinaria.</p>
          <div className="field-grid">
            <Field label="Nombre del comercio" name="nombreComercio" value={form.nombreComercio} error={errors.nombreComercio} onChange={updateField} />
            <Field label="Cedula juridica" name="cedulaJuridica" value={form.cedulaJuridica} error={errors.cedulaJuridica} onChange={updateField} />
            <Field label="Telefono" name="telefono" type="tel" value={form.telefono} error={errors.telefono} onChange={updateField} />
            <Field label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={updateField} />
            <Field className="wide" label="Direccion" name="direccion" value={form.direccion} error={errors.direccion} onChange={updateField} />
            <label className="field wide">
              <span>Descripcion</span>
              <textarea name="descripcion" rows="4" value={form.descripcion} onChange={updateField} />
              {errors.descripcion && <small>{errors.descripcion}</small>}
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Equipo de trabajo (opcional) */}
      {step === 2 && (
        <div className="form-card">
          <h3>Equipo de trabajo <span className="optional-badge">Opcional</span></h3>
          <p className="form-card-sub">Agrega las personas que trabajaran en esta veterinaria. Los funcionarios deben ser usuarios registrados en OpenPaw. Puedes saltar este paso y agregarlos mas tarde desde el panel de funcionarios.</p>
          {team.length === 0 && (
            <p className="team-empty">Aun no has agregado funcionarios.</p>
          )}
          {team.map((member, i) => (
            <div key={i} className="team-member-row">
              <div className="team-member-header">
                <strong>Funcionario #{i + 1}</strong>
                {team.length > 0 && (
                  <button type="button" className="btn-remove" onClick={() => removeTeamMember(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <div className="field-grid three">
                <Field label="Nombre" name={`team-nombre-${i}`} value={member.nombre} onChange={(e) => updateTeamMember(i, 'nombre', e.target.value)} />
                <Field label="Email" name={`team-email-${i}`} type="email" value={member.email} onChange={(e) => updateTeamMember(i, 'email', e.target.value)} />
                <label className="field">
                  <span>Rol</span>
                  <select value={member.rolId} onChange={(e) => updateTeamMember(i, 'rolId', Number(e.target.value))}>
                    {FUNCIONARIO_ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </label>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-add" onClick={addTeamMember}>
            + Agregar otro funcionario
          </button>
        </div>
      )}

      {/* Step 3: Documentacion */}
      {step === 3 && (
        <div className="form-card">
          <h3>Documentacion <span className="optional-badge">Opcional</span></h3>
          <p className="form-card-sub">Personeria juridica en PDF.</p>
          <FileUploadField
            name="documentoPersoneriaJuridica"
            accept="application/pdf,.pdf"
            summary={fileSummary}
            error={errors.documentoPersoneriaJuridica}
            onChange={updateField}
          />
        </div>
      )}
      {showToast && (
        <div className="toast-success" role="status" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Solicitud enviada correctamente
        </div>
      )}
      {errors.submit && <p className="submit-error">{errors.submit}</p>}

      {/* Navigation Buttons */}
      <div className="form-nav">
        {step > 1 && (
          <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
            Atras
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        {step < 3 ? (
          <button type="button" className="btn btn-primary" onClick={nextStep}>
            Siguiente
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => submitRequest(team)} disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        )}
      </div>

      <style>{`
        .store-reg-form { max-width: 720px; margin: 0 auto; }
        .team-member-row { background: #f8f9fb; border: 1px solid #e8ecf1; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
        .team-member-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .team-member-header strong { font-size: 13px; color: #333; }
        .btn-remove { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 6px; background: #fef3f2; color: #b42318; cursor: pointer; transition: all 0.2s; }
        .btn-remove:hover { background: #fecdca; }
        .btn-add { margin-top: 8px; border-style: dashed; width: 100%; background: transparent; color: #0066e8; border: 1.5px dashed #b3d4ff; cursor: pointer; }
        .optional-badge { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 2px 10px; border-radius: 20px; vertical-align: middle; margin-left: 8px; }
        .team-empty { text-align: center; padding: 24px; color: #9ca3af; font-size: 14px; background: #f9fafb; border-radius: 10px; border: 1px dashed #d1d5db; }
        .steps-bar { display: flex; justify-content: center; gap: 40px; margin-bottom: 36px; position: relative; }
        .steps-bar::before { content: ''; position: absolute; top: 16px; left: 60px; right: 60px; height: 2px; background: #e0e0e0; z-index: 0; }
        .step-item { display: grid; place-items: center; gap: 8px; position: relative; z-index: 1; }
        .step-circle { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; background: #e0e0e0; color: #888; transition: all 0.3s; }
        .step-item.active .step-circle { background: #0066e8; color: white; box-shadow: 0 0 0 4px rgba(0,102,232,0.15); }
        .step-item.done .step-circle { background: #17624d; color: white; }
        .step-label { font-size: 12px; color: #888; font-weight: 500; text-align: center; }
        .step-item.active .step-label { color: #0066e8; font-weight: 600; }
        .step-item.done .step-label { color: #17624d; }

        .form-card { background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; }
        .form-card h3 { margin: 0 0 4px; font-size: 18px; color: #000; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .form-card-sub { margin: 0 0 20px; font-size: 14px; color: #555; }
        .form-card .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-card .field-grid.three { grid-template-columns: repeat(3, 1fr); }
        .form-card .field { display: grid; gap: 6px; }
        .form-card .field span { font-size: 13px; font-weight: 600; color: #333; }
        .form-card .field input, .form-card .field select, .form-card .field textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font: inherit; font-size: 14px; transition: border-color 0.2s; }
        .form-card .field input:focus, .form-card .field select:focus, .form-card .field textarea:focus { border-color: #0066e8; outline: 3px solid rgba(0,102,232,0.12); }
        .form-card .field.wide { grid-column: 1 / -1; }
        .form-card .field small { color: #b42318; font-size: 12px; }
        .form-card .field textarea { resize: vertical; }

        .form-nav { display: flex; gap: 12px; margin-top: 24px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 28px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .btn-primary { background: #000; color: #fff; }
        .btn-primary:hover { background: #1a1a1a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .btn-primary:disabled { background: #888; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { background: transparent; color: #333; border: 1.5px solid #d1d5db; }
        .btn-secondary:hover { border-color: #0066e8; color: #0066e8; }

        .submit-error { padding: 10px 14px; margin-bottom: 16px; color: #b42318; background: #fef3f2; border: 1px solid #fecdca; border-radius: 8px; font-size: 13px; }

        .toast-success {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999;
          display: flex; align-items: center; gap: 10px;
          padding: 14px 24px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); font-size: 14px; font-weight: 600; color: #065f46;
          animation: toast-in 0.3s ease-out;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </form>
  )
}

export default RegistrationForm