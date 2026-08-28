// 本地模拟引擎（后端不可用时的降级演示）
import type { SSEHandler } from './sseClient'
import { externalLinks, extractedFields, excelStats, ocrFields, contractImage,
         ragQuery, hydeRewrite, compsCases, ragMetrics, reportSections } from '../data/mockData'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function simulateExcel(onEvent: SSEHandler) {
  onEvent('status', { msg: 'LibreOffice headless 强制重算公式…' })
  await sleep(600)
  onEvent('meta', { file: excelStats.fileName, sheets: excelStats.sheets, formulas: excelStats.formulas,
    external_links_total: excelStats.externalLinks, external_links_broken: excelStats.brokenLinks })
  await sleep(400)
  for (const l of externalLinks) { onEvent('link', l); await sleep(250) }
  for (const f of extractedFields) { onEvent('field', f); await sleep(300) }
  onEvent('done', { fields: extractedFields.length, review: extractedFields.filter(f => f.source === 'manual-review').length })
}

export async function simulateOcr(onEvent: SSEHandler) {
  onEvent('meta', { file: contractImage.name + `（${contractImage.pages}页）`, engine: contractImage.engine })
  await sleep(500)
  for (const f of ocrFields) {
    onEvent('field', { field: f.field, ocr: f.ocrValue, conf: f.ocrConfidence,
      checks: [f.ruleCheck === 'pass' ? `OCR 置信度 ${f.ocrConfidence} ✓` : f.crossCheck, f.crossCheck],
      status: f.finalStatus })
    await sleep(450)
  }
  const review = ocrFields.filter(f => f.finalStatus === 'manual-review').length
  onEvent('done', { total: ocrFields.length, auto_pass: ocrFields.length - review, review_rate: Math.round(review / ocrFields.length * 100) })
}

export async function simulateSearch(onEvent: SSEHandler) {
  onEvent('hyde', { rewrite: hydeRewrite })
  await sleep(600)
  for (let i = 0; i < ragMetrics.pipeline.length; i++) {
    onEvent('step', { i, name: ragMetrics.pipeline[i] })
    await sleep(350)
  }
  for (const c of compsCases) {
    onEvent('case', { chunk_id: c.chunkId, district: c.district, property_type: c.propertyType,
      area_wan_sqm: c.area, rent_per_sqm_day: c.rent, cap_rate: c.capRate, date: c.date,
      vector_score: c.vectorScore, bm25_score: c.bm25Score, rrf_score: c.rrfScore,
      rerank_score: c.rerankScore, text: c.snippet })
    await sleep(400)
  }
  onEvent('done', { recall_target: ragMetrics.recallTarget, n: compsCases.length })
  void ragQuery
}

export async function simulateReport(onEvent: SSEHandler) {
  onEvent('status', { msg: 'Planner 生成报告大纲…' })
  await sleep(500)
  for (const sec of reportSections) {
    onEvent('section-start', { title: sec.title })
    await sleep(200)
    let buf = ''
    for (const ch of sec.content) {
      buf += ch
      if (buf.length >= 8) { onEvent('delta', { text: buf }); buf = '' }
      await sleep(12)
    }
    if (buf) onEvent('delta', { text: buf })
    onEvent('section-check', {
      title: sec.title, citations: sec.citations,
      checks: sec.numbers.map(n => ({ name: n.text, written: n.value, db: n.dbValue, pass: n.pass })),
      all_pass: sec.numbers.every(n => n.pass),
    })
    await sleep(300)
  }
  onEvent('done', { total_numbers: reportSections.reduce((s, x) => s + x.numbers.length, 0), consistency: '100%' })
}
