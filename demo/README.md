# Valuation AI Copilot — 交互式 Demo

> 企业级 AI 估价助手的可运行演示：**真实 FastAPI 后端 + React 前端 + 全合成数据**。
> 前端离线可玩（内置模拟引擎自动降级）；连上后端则走真实 SSE 流水线。

## 架构

```
frontend/ (Vite + React 19 + TS + Tailwind v4)
   │  SSE (text/event-stream)，断线自动降级内置模拟引擎
   ▼
backend/ (FastAPI)
   ├─ GET /api/parse-excel  openpyxl 真实解析合成底稿 + 外部链接可信度分级
   ├─ GET /api/ocr          双通道校验逻辑（OCR 置信度 + 跨字段交叉验算）
   ├─ GET /api/search       真实 RAG pipeline：TF-IDF 向量 + BM25 + RRF 融合 + rerank
   └─ GET /api/report       流式报告生成 + Critic 数值强校验（逐数字与 DB 比对）
```

生产版对应关系（演示版为轻量复刻，接口结构一致）：

| 演示版 | 生产版 |
|---|---|
| TF-IDF 向量 + 内存 BM25 | BGE-M3 + pgvector + BM25 |
| 模板 HyDE | LLM 生成假设性案例描述 |
| 线程内流式 | Celery + Redis 异步任务队列 |
| 合成数据 | 脱敏业务数据 |

## 本地运行

```bash
# 后端（端口 8765）
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
python3 data/build_comps.py        # 生成合成可比案例库
./venv/bin/python -m uvicorn main:app --port 8765

# 前端（另开终端）
cd .. && npm install && npm run dev
# 或预览构建产物：npm run build && npm run preview
```

前端打开后点任意模块「▶ 运行」：后端在线时右上角显示「真实后端」，离线自动切换「内置模拟」。

## 数据说明

`backend/data/` 与 `src/data/mockData.ts` 全部为**程序化生成的合成数据**，不含任何真实客户信息。
后续接入脱敏真实数据时只需替换这两个位置，代码无需改动。
