import { useState } from 'react'
import ExcelModule from './components/ExcelModule'
import OcrModule from './components/OcrModule'
import RagModule from './components/RagModule'
import ReportModule from './components/ReportModule'

const MODULES = [
  { id: 'excel', name: '① Excel 解析', comp: ExcelModule },
  { id: 'ocr', name: '② 合同 OCR', comp: OcrModule },
  { id: 'rag', name: '③ RAG 检索', comp: RagModule },
  { id: 'report', name: '④ 报告生成', comp: ReportModule },
]

const METRICS = [
  { label: '单项目人工耗时', value: '数天 → 数小时' },
  { label: 'OCR 人工复核率', value: '100% → 20%' },
  { label: 'RAG Recall@5', value: '≥ 85%' },
  { label: '报告数值一致率', value: '100%' },
]

export default function App() {
  const [active, setActive] = useState('excel')
  const Active = MODULES.find(m => m.id === active)!.comp

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-xs font-mono text-teal-400 mb-3">ENTERPRISE AI · COMMERCIAL REAL ESTATE · 脱敏演示</p>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 leading-tight">
            企业级 AI 估价助手
          </h1>
          <p className="mt-3 text-zinc-400 max-w-2xl leading-relaxed">
            为某国际地产咨询机构估价部设计：Excel 底稿解析 → 合同 OCR → 可比案例 RAG 检索 → 报告智能生成。
            核心哲学：<span className="text-zinc-200">「计算确定性留给代码，语言灵活性留给 LLM」</span>，
            三层幻觉防控保障报告数值一致率 100%。全栈本地化部署，数据不出内网。
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {METRICS.map(m => (
              <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-500">{m.label}</p>
                <p className="mt-1 font-semibold text-teal-400">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            演示数据全部为合成数据 · 每个模块可独立运行 · 后端在线时走真实 FastAPI 流水线，离线时自动降级内置模拟引擎
          </p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${
                active === m.id ? 'border-teal-400 text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {m.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Module */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Active />
      </main>

      {/* Architecture footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">生产架构（本地化部署）</h2>
          <pre className="text-xs font-mono text-zinc-500 leading-6 overflow-x-auto">{`
Web 前端 → FastAPI(异步) → Celery + Redis 任务队列
                              ├─ Excel 解析引擎 (openpyxl + LibreOffice headless)
                              ├─ 文档抽取 (PaddleOCR + PP-StructureV3)
                              ├─ RAG 检索 (BGE-M3 + BM25 + Reranker + HyDE)
                              └─ 报告生成 Agent (Qwen2.5-14B AWQ 4bit + vLLM + Function Calling)
存储: PostgreSQL + pgvector · MinIO —— 单张 RTX 4090 支撑 10-20 并发`}</pre>
          <p className="mt-6 text-xs text-zinc-600">
            © 2026 Gnomeshgh0714 · <a className="text-teal-500 hover:underline" href="https://github.com/Gnomeshgh0714/valuation-ai-copilot">GitHub 仓库</a> · 本项目为脱敏架构演示，不含任何客户数据
          </p>
        </div>
      </footer>
    </div>
  )
}
