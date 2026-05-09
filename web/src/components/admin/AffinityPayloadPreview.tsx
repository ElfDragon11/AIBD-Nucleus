import type { buildAffinityPayload } from '@/features/admin/affinityPayload'

type Props = {
  payload: ReturnType<typeof buildAffinityPayload>
}

/** Read-only JSON-style preview for mock CRM sync (build plan §22). */
export function AffinityPayloadPreview({ payload }: Props) {
  return (
    <pre className="max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-[11px] leading-relaxed text-foreground">
      {JSON.stringify(payload, null, 2)}
    </pre>
  )
}
