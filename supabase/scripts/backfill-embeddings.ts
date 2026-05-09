/**
 * One-off: embed `embedding_text` into `people.embedding` / `opportunities.embedding`.
 *
 * Run from repo root (requires Deno + local Supabase env):
 *   deno run --allow-net --allow-env supabase/scripts/backfill-embeddings.ts
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MODEL = 'text-embedding-3-small'

async function embedText(input: string, key: string): Promise<number[]> {
  const trimmed = input.trim().slice(0, 8000)
  if (!trimmed) throw new Error('empty embedding_text')
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: trimmed }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 400)}`)
  }
  const body = (await res.json()) as { data?: { embedding?: number[] }[] }
  const emb = body.data?.[0]?.embedding
  if (!Array.isArray(emb) || emb.length !== 1536) {
    throw new Error('invalid embedding')
  }
  return emb
}

function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}

async function main() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openai = Deno.env.get('OPENAI_API_KEY')
  if (!url || !key || !openai) {
    console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
    Deno.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of ['people', 'opportunities'] as const) {
    const { data: rows, error } = await supabase
      .from(table)
      .select('id, embedding_text, embedding')
      .is('embedding', null)
    if (error) throw error

    const need = (rows ?? []).filter(
      (r) => r.embedding_text && String(r.embedding_text).trim(),
    )
    console.log(`${table}: ${need.length} rows need embeddings`)

    for (const row of need) {
      const vec = await embedText(String(row.embedding_text), openai)
      const { error: uErr } = await supabase
        .from(table)
        .update({ embedding: toVectorLiteral(vec) })
        .eq('id', row.id)
      if (uErr) throw uErr
      console.log(`  ok ${row.id}`)
    }
  }

  console.log('Done.')
}

await main()
