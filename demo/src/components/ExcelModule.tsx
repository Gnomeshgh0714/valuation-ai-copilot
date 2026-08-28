import { useState } from 'react'
import { useModuleRunner } from '../engine/useModuleRunner'
import { simulateExcel } from '../engine/simulators'

const badge = (s: string) =>
  s === 'valid' || s === 'recalculated' ? 'bg-emerald-500/15 text-emerald-400'
  : s === 'cache-only' || s === 'cache' ? 'bg-amber-500/15 text-amber-400'
  : 'bg-rose-500/15 text-rose-400'

export default function ExcelModule() {
  const [meta, setMeta] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [fields, setFields] = useState<any[]>([])
  const [done, setDone] = useState<any>(null)
  const { run, running, mode } = useModuleRunner('/api/parse-excel', simulateExcel)

  const start = () => {
    setMeta(null); setLinks([]); setFields([]); setDone(null)
    run((ev, d) => {
      if (ev === 'meta') setMeta(d)
      if (ev === 'link') setLinks(p => [...p, d])
      if (ev === 'field') setFields(p => [...p, d])
      if (ev === 'done') setDone(d)
    })
  }

  return (
    <section className="space-y-4">
      <ModuleHeader title="模块 1 · Excel 底稿解析" desc="LibreOffice headless 强制重算 · 外部链接可信度分级 · Pydantic 值域校验"
        running={running} mode={mode} onRun={start} />
      {meta && (
        <div className="anim grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="文件" value={meta.file} small />
          <Stat label="工作表" value={meta.sheets} />
          <Stat label="公式数" value={meta.formulas?.toLocaleString()} />
          <Stat label="外部链接" value={meta.external_links_total} warn />
          <Stat label="失效链接" value={meta.external_links_broken} danger />
        </div>
      )}
      {links.length > 0 && (
        <div className="anim rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-2">外部链接扫描（抽样 {links.length}/145）—— 失效链接读 XML 缓存值并打可信度分</p>
          <div className="space-y-1.5">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs ${badge(l.status)}`}>{l.status}</span>
                <span className="text-zinc-300 flex-1 truncate font-mono text-xs">{l.target}</span>
                <span className="text-xs text-zinc-500">置信度 {(l.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {fields.length > 0 && (
        <div className="anim rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500 border-b border-zinc-800">
              <th className="text-left p-3">字段</th><th className="text-left p-3">值</th>
              <th className="text-left p-3">来源</th><th className="text-right p-3">置信度</th>
            </tr></thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={i} className={`border-b border-zinc-800/50 ${f.source === 'manual-review' ? 'bg-rose-500/5' : ''}`}>
                  <td className="p-3 text-zinc-400">{f.sheet} · {f.field}</td>
                  <td className="p-3 font-mono text-zinc-200">{f.value}{f.unit ? ` ${f.unit}` : ''}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${badge(f.source)}`}>{f.source}</span></td>
                  <td className={`p-3 text-right font-mono ${f.confidence < 0.75 ? 'text-rose-400' : 'text-zinc-400'}`}>{(f.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {done && <p className="anim text-sm text-emerald-400">✓ 提取 {done.fields} 个字段，{done.review} 个低置信度字段已进人工复核队列（宁可慢，不可错）</p>}
    </section>
  )
}

export function Stat({ label, value, warn, danger, small }: any) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`font-semibold mt-1 ${small ? 'text-xs' : 'text-xl'} ${danger ? 'text-rose-400' : warn ? 'text-amber-400' : 'text-zinc-100'}`}>{value}</p>
    </div>
  )
}

export function ModuleHeader({ title, desc, running, mode, onRun }: any) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {mode !== 'idle' && !running && (
          <span className={`text-xs px-2 py-1 rounded ${mode === 'backend' ? 'bg-teal-500/15 text-teal-400' : 'bg-zinc-800 text-zinc-400'}`}>
            {mode === 'backend' ? '真实后端' : '内置模拟'}
          </span>
        )}
        <button onClick={onRun} disabled={running}
          className="px-4 py-2 rounded-lg bg-teal-500 text-zinc-950 text-sm font-medium hover:bg-teal-400 disabled:opacity-40 transition">
          {running ? '运行中…' : '▶ 运行'}
        </button>
      </div>
    </div>
  )
}
