import { useState } from 'react'
import { useModuleRunner } from '../engine/useModuleRunner'
import { simulateSearch } from '../engine/simulators'
import { ModuleHeader } from './ExcelModule'

export default function RagModule() {
  const [hyde, setHyde] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [done, setDone] = useState<any>(null)
  const { run, running, mode } = useModuleRunner('/api/search', simulateSearch)

  const start = () => {
    setHyde(''); setSteps([]); setCases([]); setDone(null)
    run((ev, d) => {
      if (ev === 'hyde') setHyde(d.rewrite)
      if (ev === 'step') setSteps(p => [...p, d.name])
      if (ev === 'case') setCases(p => [...p, d])
      if (ev === 'done') setDone(d)
    })
  }

  return (
    <section className="space-y-4">
      <ModuleHeader title="模块 3 · RAG 可比案例检索" desc="HyDE 查询改写 · 向量+BM25 混合检索 RRF 融合 · reranker 精排 · 强制 chunk 引用"
        running={running} mode={mode} onRun={start} />
      {hyde && (
        <div className="anim rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
          <p className="text-xs text-teal-400 mb-1">HyDE 改写 —— 把「用户问题」翻译成「领域语言」</p>
          <p className="text-sm text-zinc-300">{hyde}</p>
        </div>
      )}
      {steps.length > 0 && (
        <div className="anim flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300">{s}</span>
              {i < steps.length - 1 && <span className="text-zinc-600">→</span>}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {cases.map((c, i) => (
          <div key={i} className="anim rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-teal-400 text-sm">#{c.chunk_id}</span>
                <span className="text-zinc-200">{c.district} · {c.property_type}</span>
                <span className="text-zinc-500 text-sm">{c.area_wan_sqm}万㎡ · {c.date}</span>
              </div>
              <div className="flex gap-4 text-sm font-mono">
                <span className="text-zinc-300">¥{c.rent_per_sqm_day}/㎡/天</span>
                <span className="text-zinc-300">Cap {c.cap_rate}%</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{c.text}</p>
            <div className="mt-2 flex gap-3 text-xs font-mono text-zinc-600">
              <span>vec {c.vector_score}</span><span>bm25 {c.bm25_score}</span>
              <span>rrf {c.rrf_score}</span><span className="text-teal-500">rerank {c.rerank_score}</span>
            </div>
          </div>
        ))}
      </div>
      {done && <p className="anim text-sm text-emerald-400">✓ 召回 top-{done.n}，全部带 chunk id 强制引用；Recall@5 目标 {done.recall_target}</p>}
    </section>
  )
}
