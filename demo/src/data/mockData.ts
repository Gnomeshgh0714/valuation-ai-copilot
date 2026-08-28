// 合成数据 —— 全部为虚构，不含任何真实客户信息

// ========== 模块1: Excel 底稿解析 ==========
export interface ExternalLink {
  id: number
  target: string
  status: 'valid' | 'broken' | 'cache-only'
  confidence: number
  cachedValue?: string
}

export interface SheetField {
  sheet: string
  field: string
  value: string
  source: 'recalculated' | 'cache' | 'manual-review'
  confidence: number
  formula?: string
}

export const excelStats = {
  fileName: 'XX产业园_收益法测算底稿_v9.xlsm',
  fileSize: '18.6 MB',
  sheets: 23,
  formulas: 3842,
  externalLinks: 145,
  brokenLinks: 37,
}

export const externalLinks: ExternalLink[] = [
  { id: 1, target: '[市场数据库2026Q2.xlsx]工业成交', status: 'valid', confidence: 0.98 },
  { id: 2, target: '[宏观参数表.xlsx]利率汇率', status: 'valid', confidence: 0.97 },
  { id: 3, target: '[2024历史底稿.xlsm]资本化率', status: 'broken', confidence: 0.42, cachedValue: '5.25%' },
  { id: 4, target: '[可比案例库.xlsx]园区A', status: 'cache-only', confidence: 0.61, cachedValue: '¥38.5/㎡/天' },
  { id: 5, target: '[折旧参数.xlsx]残值率', status: 'broken', confidence: 0.35, cachedValue: '5.0%' },
  { id: 6, target: '[租金基准2025.xlsx]片区均价', status: 'valid', confidence: 0.96 },
]

export const extractedFields: SheetField[] = [
  { sheet: '收益测算', field: '年净收益(NOI)', value: '¥84,326,000', source: 'recalculated', confidence: 0.99, formula: '=总收入-运营费用' },
  { sheet: '收益测算', field: '资本化率', value: '5.25%', source: 'manual-review', confidence: 0.42, formula: '=[2024历史底稿.xlsm]!C12' },
  { sheet: '收益测算', field: '收益年期', value: '40 年', source: 'recalculated', confidence: 0.99 },
  { sheet: 'DCF', field: '折现率', value: '7.8%', source: 'recalculated', confidence: 0.97, formula: '=无风险利率+风险溢价' },
  { sheet: 'DCF', field: '评估值(收益法)', value: '¥1,412,000,000', source: 'recalculated', confidence: 0.98 },
  { sheet: '实物状况', field: '建筑面积', value: '186,400 ㎡', source: 'recalculated', confidence: 0.99 },
  { sheet: '实物状况', field: '可出租面积', value: '162,800 ㎡', source: 'recalculated', confidence: 0.99 },
  { sheet: '租赁假设', field: '平均租金', value: '¥1.42/㎡/天', source: 'recalculated', confidence: 0.95 },
  { sheet: '租赁假设', field: '出租率(稳定期)', value: '92%', source: 'cache', confidence: 0.74 },
  { sheet: '费用假设', field: '运营费用率', value: '18.5%', source: 'recalculated', confidence: 0.93 },
]

// ========== 模块2: 合同 OCR ==========
export interface OcrField {
  field: string
  ocrValue: string
  ocrConfidence: number
  ruleCheck: 'pass' | 'fail' | 'review'
  crossCheck: string
  finalStatus: 'auto-pass' | 'manual-review'
}

export const contractImage = {
  name: '租赁合同_扫描件_第3页.pdf',
  pages: 12,
  engine: 'PaddleOCR + PP-StructureV3（本地部署）',
}

export const ocrFields: OcrField[] = [
  { field: '承租面积', ocrValue: '3,850 ㎡', ocrConfidence: 0.97, ruleCheck: 'pass', crossCheck: '与权属证明一致 ✓', finalStatus: 'auto-pass' },
  { field: '月租金单价', ocrValue: '¥45.2/㎡/月', ocrConfidence: 0.94, ruleCheck: 'pass', crossCheck: '租金=单价×面积 验算通过 ✓', finalStatus: 'auto-pass' },
  { field: '月租金总额', ocrValue: '¥174,020', ocrConfidence: 0.91, ruleCheck: 'pass', crossCheck: '45.2×3850=174,020 ✓', finalStatus: 'auto-pass' },
  { field: '租赁期限', ocrValue: '2024.03.01 – 2029.02.28', ocrConfidence: 0.96, ruleCheck: 'pass', crossCheck: '期限5年，与免租期条款不冲突 ✓', finalStatus: 'auto-pass' },
  { field: '免租期', ocrValue: '3个月', ocrConfidence: 0.62, ruleCheck: 'review', crossCheck: '扫描件第7页字迹模糊，置信度<0.75阈值', finalStatus: 'manual-review' },
  { field: '租金递增率', ocrValue: '每两年5%', ocrConfidence: 0.58, ruleCheck: 'review', crossCheck: '「5%」与「S%」识别歧义，进人工复核队列', finalStatus: 'manual-review' },
  { field: '押金', ocrValue: '3个月租金', ocrConfidence: 0.93, ruleCheck: 'pass', crossCheck: '与付款条款交叉验证一致 ✓', finalStatus: 'auto-pass' },
]

// ========== 模块3: RAG 可比案例检索 ==========
export interface CompsCase {
  chunkId: string
  district: string
  propertyType: string
  area: string
  rent: string
  capRate: string
  date: string
  vectorScore: number
  bm25Score: number
  rrfScore: number
  rerankScore: number
  snippet: string
}

export const ragQuery = '某高新区工业产业园，建面约18万㎡，寻可比租赁案例与资本化率参考'

export const hydeRewrite = '假设性案例描述：位于高新技术产业开发区的标准厂房/研发办公混合园区，建筑面积15-20万平方米，租户以制造业与科技企业为主，租金水平1.2-1.6元/㎡/天，资本化率区间5.0%-5.8%……'

export const compsCases: CompsCase[] = [
  { chunkId: 'C-0847', district: '高新区', propertyType: '标准厂房', area: '15.2万㎡', rent: '¥1.38/㎡/天', capRate: '5.3%', date: '2025-11', vectorScore: 0.89, bm25Score: 0.72, rrfScore: 0.85, rerankScore: 0.94, snippet: '……高新区标准厂房园区，总建筑面积15.2万平方米，2025年11月监测平均租金1.38元/㎡/天，交易案例隐含资本化率5.3%……' },
  { chunkId: 'C-1203', district: '经开区', propertyType: '研发办公', area: '21.6万㎡', rent: '¥1.55/㎡/天', capRate: '5.5%', date: '2026-01', vectorScore: 0.86, bm25Score: 0.78, rrfScore: 0.83, rerankScore: 0.91, snippet: '……经开区研发办公园区，总建筑面积21.6万平方米，2026年1月平均租金1.55元/㎡/天，资本化率5.5%，租户以电子信息企业为主……' },
  { chunkId: 'C-0521', district: '高新区', propertyType: '制造仓储', area: '12.8万㎡', rent: '¥1.21/㎡/天', capRate: '5.1%', date: '2025-08', vectorScore: 0.82, bm25Score: 0.81, rrfScore: 0.81, rerankScore: 0.88, snippet: '……高新区制造业仓储用房，总建筑面积12.8万平方米，2025年8月租金1.21元/㎡/天，资本化率5.1%……' },
  { chunkId: 'C-0966', district: '保税区', propertyType: '物流仓储', area: '25.3万㎡', rent: '¥1.32/㎡/天', capRate: '5.6%', date: '2025-12', vectorScore: 0.78, bm25Score: 0.69, rrfScore: 0.74, rerankScore: 0.79, snippet: '……保税区物流仓储园区，总建筑面积25.3万平方米，2025年12月租金1.32元/㎡/天，资本化率5.6%……' },
  { chunkId: 'C-0312', district: '高新区', propertyType: '标准厂房', area: '9.4万㎡', rent: '¥1.29/㎡/天', capRate: '5.2%', date: '2025-06', vectorScore: 0.80, bm25Score: 0.58, rrfScore: 0.71, rerankScore: 0.76, snippet: '……高新区标准厂房，总建筑面积9.4万平方米，2025年6月租金1.29元/㎡/天，资本化率5.2%……' },
]

export const ragMetrics = {
  recallTarget: '≥ 85%',
  recallAchieved: '87.5% (测试集 n=40)',
  pipeline: ['HyDE 查询改写', '硬过滤（区域/物业类型/面积）', '向量检索 top-50', 'BM25 检索 top-50', 'RRF 融合', 'bge-reranker 精排 top-5'],
}

// ========== 模块4: 报告生成 + Critic ==========
export interface ReportSection {
  title: string
  content: string
  citations: string[]
  numbers: { text: string; value: string; dbValue: string; pass: boolean }[]
}

export const reportSections: ReportSection[] = [
  {
    title: '一、估价对象概况',
    content: '估价对象为位于某高新技术产业开发区的工业产业园区，建筑面积 186,400 ㎡，可出租面积 162,800 ㎡，租户以制造业与科技研发企业为主，园区于稳定运营期，稳定期出租率 92%。',
    citations: ['DB:实物状况表'],
    numbers: [
      { text: '建筑面积', value: '186,400 ㎡', dbValue: '186,400 ㎡', pass: true },
      { text: '可出租面积', value: '162,800 ㎡', dbValue: '162,800 ㎡', pass: true },
      { text: '出租率', value: '92%', dbValue: '92%', pass: true },
    ],
  },
  {
    title: '二、市场分析',
    content: '区域同类园区近期平均租金区间为 1.21–1.55 元/㎡/天，资本化率区间为 5.1%–5.6%（C-0847、C-1203、C-0521）。估价对象所处高新区产业集聚度高，租赁需求稳定，取平均租金 1.42 元/㎡/天具备市场支撑。',
    citations: ['C-0847', 'C-1203', 'C-0521'],
    numbers: [
      { text: '租金区间下限', value: '1.21', dbValue: '1.21 (C-0521)', pass: true },
      { text: '租金区间上限', value: '1.55', dbValue: '1.55 (C-1203)', pass: true },
      { text: '平均租金取值', value: '1.42 元/㎡/天', dbValue: '1.42 元/㎡/天', pass: true },
    ],
  },
  {
    title: '三、收益法测算',
    content: '经测算，估价对象年净收益(NOI)为 ¥84,326,000，取资本化率 5.25%、收益年期 40 年，收益法评估值为 ¥1,412,000,000（大写：壹拾肆亿壹仟贰佰万元整）。',
    citations: ['DB:收益测算表'],
    numbers: [
      { text: 'NOI', value: '¥84,326,000', dbValue: '¥84,326,000', pass: true },
      { text: '资本化率', value: '5.25%', dbValue: '5.25% ⚠️ 人工复核来源', pass: true },
      { text: '评估值', value: '¥1,412,000,000', dbValue: '¥1,412,000,000', pass: true },
    ],
  },
]

export const criticLog = [
  { time: '00:01', check: '数值一致性比对', detail: '「建筑面积 186,400 ㎡」 vs DB → 一致 ✓', pass: true },
  { time: '00:02', check: '数值一致性比对', detail: '「NOI ¥84,326,000」 vs DB → 一致 ✓', pass: true },
  { time: '00:03', check: '引用完整性', detail: '市场分析段 3 处数值均有 chunk id 引用 ✓', pass: true },
  { time: '00:04', check: '数值一致性比对', detail: '「评估值 ¥1,412,000,000」 vs DB → 一致 ✓', pass: true },
  { time: '00:05', check: '来源可信度', detail: '资本化率 5.25% 标注「人工复核来源」，触发提示而非阻断 ✓', pass: true },
  { time: '00:05', check: '汇总', detail: '全部 9 项数值校验通过，报告准予输出', pass: true },
]

// ========== 全局指标 ==========
export const heroMetrics = [
  { label: '单项目人工耗时', before: '数天', after: '数小时' },
  { label: 'OCR 关键字段人工复核率', before: '100%', after: '20%（目标）' },
  { label: 'RAG Recall@5', before: '—', after: '≥ 85%（目标）' },
  { label: '报告数值一致率', before: '人工三审', after: '100%（Critic 校验后）' },
]
