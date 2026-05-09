/** OpenAI text-embedding-3-small — 1536 dims (matches `embedding vector(1536)`). */

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings'

export async function embedText(
  input: string,
): Promise<{ ok: true; vector: number[] } | { ok: false; error: string }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false, error: 'OPENAI_API_KEY is not set' }

  const trimmed = input.trim().slice(0, 8000)
  if (!trimmed) return { ok: false, error: 'empty embedding input' }

  try {
    const res = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: trimmed,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { ok: false, error: `OpenAI embed HTTP ${res.status}: ${errText.slice(0, 400)}` }
    }
    const body = await res.json() as {
      data?: { embedding?: number[] }[]
    }
    const emb = body.data?.[0]?.embedding
    if (!Array.isArray(emb) || emb.length !== 1536) {
      return { ok: false, error: 'invalid embedding dimensions' }
    }
    return { ok: true, vector: emb }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/** Parse Postgres / JSON vector string to numbers (Supabase often returns string). */
export function parseVector(
  raw: string | number[] | null | undefined,
): number[] | null {
  if (raw == null) return null
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'number')) {
    return raw as number[]
  }
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (s.startsWith('[')) {
      try {
        const arr = JSON.parse(s) as unknown
        if (Array.isArray(arr) && arr.every((x) => typeof x === 'number')) {
          return arr as number[]
        }
      } catch {
        return null
      }
    }
  }
  return null
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}
