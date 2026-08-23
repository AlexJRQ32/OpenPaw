import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { StoreRegistrationForm } from '../components/StoreRegistrationForm'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './StoreRegistrationPage.css'

/**
 * StoreRegistrationPage — Rediseño Sprint 2 / Task #38.
 * Wireframe "registro_de_almac_n_openpaw": header con eyebrow de
 * onboarding + badge de estado, título y subtítulo del wireframe, y pill de
 * asistencia; debajo, el formulario único de registro (StoreRegistrationForm).
 */
export function StoreRegistrationPage() {
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
              <h1 className="vetreg-title">Solicitud de registro de almacén veterinario</h1>
              <p className="vetreg-subtitle">
                Registre el almacén para ofrecer productos veterinarios a dueños
                de mascotas. Este proceso nos ayuda a garantizar la calidad y
                procedencia de los suministros.
              </p>
            </div>
            <a
              className="vetreg-help"
              href="#asistencia"
              onClick={(e) => e.preventDefault()}
              title="Centro de asistencia OpenPaw"
            >
              <Icon name="support_agent" size={18} />
              Asistencia
            </a>
          </div>
        </header>

        <StoreRegistrationForm />
      </div>
    </AppShell>
  )
}

export default StoreRegistrationPage
