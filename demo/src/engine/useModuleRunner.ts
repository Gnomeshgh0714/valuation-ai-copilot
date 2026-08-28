import { useState, useCallback } from 'react'
import { streamFromBackend, type SSEHandler } from './sseClient'

// 通用 hook：跑一个模块，真实后端优先，降级用本地模拟
export function useModuleRunner(
  apiPath: string,
  simulate: (onEvent: SSEHandler) => Promise<void>,
) {
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'idle' | 'backend' | 'simulator'>('idle')

  const run = useCallback(async (onEvent: SSEHandler) => {
    setRunning(true)
    // 先试真实后端（短超时，只测连通）
    let usedBackend = false
    const probe = await fetch(`${(import.meta.env.VITE_API_BASE ?? 'http://localhost:8765')}/api/health`)
      .then(r => r.ok).catch(() => false)
    if (probe) {
      usedBackend = await streamFromBackend(apiPath, onEvent, 30000)
    }
    if (!usedBackend) {
      setMode('simulator')
      await simulate(onEvent)
    } else {
      setMode('backend')
    }
    setRunning(false)
  }, [apiPath, simulate])

  return { run, running, mode }
}
