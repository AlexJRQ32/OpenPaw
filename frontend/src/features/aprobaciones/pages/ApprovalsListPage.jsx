import { ApprovalsPanel } from '../components/ApprovalsPanel'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import './ApprovalsListPage.css'

export function ApprovalsListPage() {
  return (
    <AppShell>
      <div className="approvals-page">
        <ApprovalsPanel />
      </div>
    </AppShell>
  )
}

export default ApprovalsListPage