// SSE 客户端：优先连真实后端，失败时降级到内置模拟引擎
// 设计原则：演示体验与后端可用性解耦

export type SSEHandler = (event: string, data: any) => void

const BACKEND = import.meta.env.VITE_API_BASE ?? 'http://localhost:8765'

export async function streamFromBackend(
  path: string,
  onEvent: SSEHandler,
  timeoutMs = 2500,
): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(`${BACKEND}${path}`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok || !res.body) return false
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''
      for (const part of parts) {
        const evMatch = part.match(/^event: (.+)$/m)
        const dataMatch = part.match(/^data: (.*)$/m)
        if (evMatch && dataMatch) onEvent(evMatch[1], JSON.parse(dataMatch[1]))
      }
    }
    return true
  } catch {
    return false
  }
}
