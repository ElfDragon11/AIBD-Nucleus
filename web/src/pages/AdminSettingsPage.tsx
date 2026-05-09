import type { Session } from '@supabase/supabase-js'
import { useOutletContext } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminSettingsPage() {
  useOutletContext<{ session: Session }>()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mock integrations and lightweight tooling for the hackathon demo.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affinity CRM</CardTitle>
          <CardDescription>Integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Mode:</span> mock preview only
          </p>
          <p className="text-muted-foreground">
            Lead detail includes a JSON payload preview and a simulated “Sync to Affinity” action.
            No API keys or outbound calls in MVP.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matching</CardTitle>
          <CardDescription>Edge Functions</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Re-run matching invokes the <code className="text-xs">find-matches</code> Edge Function
            when deployed (Phase 5). If the function is missing, the UI surfaces a clear error.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Introduction emails (Resend)</CardTitle>
          <CardDescription>Mutual intros from the match workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            The <code className="text-xs">send-intro-email</code> Edge Function sends one message to
            both the lead and the counterparty (person email or opportunity{' '}
            <code className="text-xs">contact_email</code>).
          </p>
          <p>
            Configure: <code className="text-xs">RESEND_API_KEY</code> and{' '}
            <code className="text-xs">RESEND_FROM</code> via{' '}
            <code className="text-xs">supabase secrets set</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
