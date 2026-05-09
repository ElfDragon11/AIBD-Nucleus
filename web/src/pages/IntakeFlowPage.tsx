import { Link, Navigate, useParams } from 'react-router-dom'

import { IntakeShell } from '@/features/intake/IntakeShell'
import {
  clearIntakeSession,
  getStoredIntakeSession,
} from '@/features/intake/publicSession'

export function IntakeFlowPage() {
  const { leadId } = useParams()

  const session = getStoredIntakeSession()

  if (!leadId) {
    return <Navigate replace to="/intake" />
  }

  if (!session || session.leadId !== leadId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-serif text-2xl">Session mismatch</h1>
        <p className="max-w-md text-muted-foreground">
          This intake link expects the same browser profile where you entered your
          name and email—or your storage was cleared mid-flow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link className="text-sm font-medium underline" to="/intake">
            Start intake
          </Link>
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => clearIntakeSession()}
          >
            Reset session storage keys
          </button>
        </div>
      </div>
    )
  }

  return <IntakeShell leadId={leadId} session={session} />
}
