import { useState } from 'react'
import { useModuleRunner } from '../engine/useModuleRunner'
import { simulateOcr } from '../engine/simulators'
import { ModuleHeader } from './ExcelModule'

export default function OcrModule() {
  const [meta, setMeta] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [done, setDone] = useState<any>(null)
  const { run, running, mode } = useModuleRunner('/api/ocr', simulateOcr)

  const start = () => {
    setMeta(null); setFields([]); setDone(null)
    run((ev, d) => {
      if (ev === 'meta') setMeta(d)
      if (ev === 'field') setFields(p => [...p, d])
      if (ev === 'done') setDone(d)
    })
  }

  return (
    <section className="space-y-4">
      <ModuleHeader title="模块 2 · 扫描合同 OCR 抽取" desc="PaddleOCR + PP-StructureV3 本地部署 · 关键字段双通道校验 · 低置信度降级"
        running={running} mode={mode} onRun={start} />
      {meta && (
        <div className="anim rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm flex flex-wrap gap-x-8 gap-y-1">
          <span className="text-zinc-400">📄 {meta.file}</span>
          <span className="text-zinc-500">引擎：{meta.engine}</span>
        </div>
      )}
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className={`anim rounded-xl border p-4 ${f.status === 'manual-review' ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 text-sm w-24">{f.field}</span>
                <span className="font-mono text-zinc-100">{f.ocr}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${f.status === 'auto-pass' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {f.status === 'auto-pass' ? '✓ 自动通过' : '⚠ 人工复核'}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {(f.checks ?? []).map((c: string, j: number) => (
                <p key={j} className="text-xs text-zinc-500">· {c}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      {done && (
        <p className="anim text-sm text-emerald-400">
          ✓ {done.total} 个关键字段：{done.auto_pass} 个自动通过，复核率 {done.review_rate}%（目标：从 100% 人工复核降至 20%）
        </p>
      )}
    </section>
  )
}
