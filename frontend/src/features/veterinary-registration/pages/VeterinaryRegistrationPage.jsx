import { Badge } from '../../../shared/components/Badge/Badge'
import { RegistrationForm } from '../components/RegistrationForm'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './VeterinaryRegistrationPage.css'

export function VeterinaryRegistrationPage() {
  return (
    <AppShell>
      <div className="vetreg-wrapper">
        <div className="vetreg-page">
          <div className="vetreg-header">
            <div className="vetreg-header-row">
              <h1 className="vetreg-title">Registro de comercio</h1>
              <Badge variant="pending">Pendiente de aprobacion</Badge>
            </div>
            <p className="vetreg-subtitle">Completa la informacion para solicitar el registro de tu veterinaria.</p>
          </div>

          <RegistrationForm />
        </div>
      </div>
    </AppShell>
  )
}

export default VeterinaryRegistrationPage

