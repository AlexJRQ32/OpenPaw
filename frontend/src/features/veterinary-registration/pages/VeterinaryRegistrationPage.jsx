import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { RegistrationForm } from '../components/RegistrationForm'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './VeterinaryRegistrationPage.css'

/**
 * VeterinaryRegistrationPage — Rediseño Sprint 2 / Task #37.
 * Wireframe "registro_de_veterinaria_openpaw": header con eyebrow de
 * onboarding + badge de estado, título, subtítulo y pill de asistencia;
 * debajo, el formulario único de registro (RegistrationForm).
 */
export function VeterinaryRegistrationPage() {
  return (
    <AppShell>
      <div className="vetreg-page">
        <header className="vetreg-header">
          <div className="vetreg-header__badges">
            <span className="vetreg-eyebrow">Onboarding</span>
            <Badge variant="pending" dot>Pendiente de aprobación</Badge>
          </div>

          <div className="vetreg-header__row">
            <div>
              <h1 className="vetreg-title">Registro de comercio</h1>
              <p className="vetreg-subtitle">
                Completa la información para solicitar el registro de tu
                veterinaria y unirte a la red OpenPaw.
              </p>
            </div>
            <a
              className="vetreg-help"
              href="#asistencia"
              onClick={(e) => e.preventDefault()}
              title="Centro de asistencia OpenPaw"
            >
              <Icon name="help" size={18} />
              Asistencia
            </a>
          </div>
        </header>

        <RegistrationForm />
      </div>
    </AppShell>
  )
}

export default VeterinaryRegistrationPage
