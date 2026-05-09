const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

function extractJsonText(raw: string): string {
  const t = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t)
  if (fence?.[1]) return fence[1].trim()
  return t
}

export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callOpenAiJson<T>(
  messages: LlmMessage[],
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    return { ok: false, error: 'OPENAI_API_KEY is not set' }
  }
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

  const run = async (): Promise<string> => {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 400)}`)
    }
    const body = await res.json() as {
      choices?: { message?: { content?: string | null } }[]
    }
    const content = body.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Empty LLM response')
    }
    return content.trim()
  }

  try {
    let text: string
    try {
      text = await run()
    } catch (e1) {
      console.error('callOpenAiJson first attempt:', e1)
      text = await run()
    }
    const stripped = extractJsonText(text)
    const data = JSON.parse(stripped) as T
    return { ok: true, data }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('callOpenAiJson parse error:', msg)
    return { ok: false, error: msg }
  }
}

export async function callOpenAiText(
  messages: LlmMessage[],
  options?: { temperature?: number; max_tokens?: number },
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    return { ok: false, error: 'OPENAI_API_KEY is not set' }
  }
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

  const run = async (): Promise<string> => {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: options?.temperature ?? 0.65,
        max_tokens: options?.max_tokens ?? 1200,
        messages,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 400)}`)
    }
    const body = await res.json() as {
      choices?: { message?: { content?: string | null } }[]
    }
    const content = body.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Empty LLM response')
    }
    return content.trim()
  }

  try {
    let text: string
    try {
      text = await run()
    } catch (e1) {
      console.error('callOpenAiText first attempt:', e1)
      text = await run()
    }
    return { ok: true, text }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('callOpenAiText error:', msg)
    return { ok: false, error: msg }
  }
}
