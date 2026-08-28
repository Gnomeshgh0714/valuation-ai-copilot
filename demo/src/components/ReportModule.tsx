import { useState } from 'react'
import { useModuleRunner } from '../engine/useModuleRunner'
import { simulateReport } from '../engine/simulators'
import { ModuleHeader } from './ExcelModule'

export default function ReportModule() {
  const [sections, setSections] = useState<any[]>([])
  const [done, setDone] = useState<any>(null)
  const [streaming, setStreaming] = useState(false)
  const { run, running, mode } = useModuleRunner('/api/report', simulateReport)

  const start = () => {
    setSections([]); setDone(null)
    run((ev, d) => {
      if (ev === 'section-start') {
        setStreaming(true)
        setSections(p => [...p, { title: d.title, text: '', check: null }])
      }
      if (ev === 'delta') {
        setSections(p => {
          const next = [...p]
          next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + d.text }
          return next
        })
      }
      if (ev === 'section-check') {
        setStreaming(false)
        setSections(p => {
          const next = [...p]
          next[next.length - 1] = { ...next[next.length - 1], check: d }
          return next
        })
      }
      if (ev === 'done') setDone(d)
    })
  }

  return (
    <section className="space-y-4">
      <ModuleHeader title="模块 4 · 报告生成 + Critic 数值强校验" desc="「计算确定性留给代码，语言灵活性留给 LLM」· 数值从 DB 注入 · 逐数字比对打回"
        running={running} mode={mode} onRun={start} />
      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="anim rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="font-semibold text-zinc-100">{s.title}</h3>
            <p className={`mt-2 text-sm leading-7 text-zinc-300 ${!s.check && streaming ? 'thinking' : ''}`}>{s.text}</p>
            {s.check && (
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <p className="text-xs text-zinc-500 mb-2">
                  Critic 校验 · 引用: {s.check.citations.map((c: string) => (
                    <span key={c} className="font-mono text-teal-400 mx-1">[{c}]</span>
                  ))}
                </p>
                <div className="grid gap-1.5">
                  {s.check.checks.map((c: any, j: number) => (
                    <div key={j} className="flex items-center gap-3 text-xs font-mono">
                      <span className={c.pass ? 'text-emerald-400' : 'text-rose-400'}>{c.pass ? '✓' : '✗'}</span>
                      <span className="text-zinc-400 w-32">{c.name}</span>
                      <span className="text-zinc-300">{c.written}</span>
                      <span className="text-zinc-600">vs DB: {c.db}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {done && (
        <p className="anim text-sm text-emerald-400">
          ✓ 全部 {done.total_numbers} 项数值与数据库比对一致（{done.consistency}），报告准予输出 docx
        </p>
      )}
    </section>
  )
}
