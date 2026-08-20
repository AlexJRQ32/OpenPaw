import { Badge } from '../../../shared/components/Badge/Badge'
import { StoreRegistrationForm } from '../components/StoreRegistrationForm'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './StoreRegistrationPage.css'

export function StoreRegistrationPage() {
  return (
    <AppShell>
      <div className="vetreg-wrapper">
        <div className="vetreg-page">
          <div className="vetreg-header">
            <div className="vetreg-header-row">
              <h1 className="vetreg-title">Solicitud de registro de almacen veterinario</h1>
              <Badge variant="pending">Pendiente de aprobacion</Badge>
            </div>
            <p className="vetreg-subtitle">Registre el almacen para ofrecer productos veterinarios a duenos de mascotas.</p>
          </div>

          <StoreRegistrationForm />
        </div>
      </div>
    </AppShell>
  )
}

export default StoreRegistrationPage

