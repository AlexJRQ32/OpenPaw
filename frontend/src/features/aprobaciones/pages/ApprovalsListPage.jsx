import { ApprovalsPanel } from '../components/ApprovalsPanel'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './ApprovalsListPage.css'

export function ApprovalsListPage() {
  return (
    <AppShell>
      <div className="approvals-page">
        <div className="approvals-header">
          <div>
            <h1 className="approvals-title">Aprobaciones</h1>
            <p className="approvals-subtitle">Revisa y gestiona las solicitudes de registro de comercios veterinarios.</p>
          </div>
        </div>
        <ApprovalsPanel />
      </div>
    </AppShell>
  )
}

export default ApprovalsListPage

