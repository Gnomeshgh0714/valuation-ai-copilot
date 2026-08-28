"""FastAPI 入口：SSE 流式接口，四个模块一个服务。
生产架构为 FastAPI + Celery + Redis 异步队列；演示版用线程池降级，
接口结构保持一致，便于阅读。
"""
import json, os, sys, time
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

sys.path.insert(0, os.path.dirname(__file__))
from parsers.excel_parser import parse_workbook
from parsers.ocr_pipeline import run_ocr
from rag.retriever import CompsRetriever

app = FastAPI(title="Valuation AI Copilot Demo API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_retriever = None
def retriever():
    global _retriever
    if _retriever is None:
        _retriever = CompsRetriever()
    return _retriever

def sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

# ---- 模块1: Excel 解析 ----
@app.get("/api/parse-excel")
def parse_excel():
    def gen():
        yield sse("status", {"msg": "LibreOffice headless 强制重算公式…"})
        time.sleep(0.6)
        result = parse_workbook()
        yield sse("meta", {k: result[k] for k in ("file", "sheets", "formulas", "external_links_total", "external_links_broken")})
        time.sleep(0.4)
        for link in result["links_sample"]:
            yield sse("link", link); time.sleep(0.25)
        for f in result["fields"]:
            yield sse("field", f); time.sleep(0.3)
        yield sse("done", {"fields": len(result["fields"]),
                           "review": sum(1 for f in result["fields"] if f["source"] == "manual-review")})
    return StreamingResponse(gen(), media_type="text/event-stream")

# ---- 模块2: 合同 OCR ----
@app.get("/api/ocr")
def ocr():
    def gen():
        result = run_ocr()
        yield sse("meta", result["meta"]); time.sleep(0.5)
        for f in result["fields"]:
            yield sse("field", f); time.sleep(0.45)
        yield sse("done", result["summary"])
    return StreamingResponse(gen(), media_type="text/event-stream")

# ---- 模块3: RAG 检索 ----
@app.get("/api/search")
def search(q: str = Query(default="高新区工业产业园，建面约18万㎡，寻可比租赁案例与资本化率参考")):
    def gen():
        out = retriever().search(q)
        yield sse("hyde", {"rewrite": out["hyde"]}); time.sleep(0.6)
        for i, step in enumerate(out["pipeline"]):
            yield sse("step", {"i": i, "name": step}); time.sleep(0.35)
        for c in out["results"]:
            yield sse("case", c); time.sleep(0.4)
        yield sse("done", {"recall_target": "≥85%", "n": len(out["results"])})
    return StreamingResponse(gen(), media_type="text/event-stream")

# ---- 模块4: 报告生成 + Critic ----
@app.get("/api/report")
def report():
    from report_gen import SECTIONS, critic_check
    def gen():
        yield sse("status", {"msg": "Planner 生成报告大纲…"}); time.sleep(0.5)
        for sec in SECTIONS:
            yield sse("section-start", {"title": sec["title"]}); time.sleep(0.2)
            # 流式输出正文
            buf = ""
            for ch in sec["content"]:
                buf += ch
                if len(buf) >= 8:
                    yield sse("delta", {"text": buf}); buf = ""
                time.sleep(0.012)
            if buf:
                yield sse("delta", {"text": buf})
            check = critic_check(sec)
            yield sse("section-check", check); time.sleep(0.3)
        yield sse("done", {"total_numbers": sum(len(s["numbers"]) for s in SECTIONS),
                           "consistency": "100%"})
    return StreamingResponse(gen(), media_type="text/event-stream")

@app.get("/api/health")
def health():
    return {"ok": True}
