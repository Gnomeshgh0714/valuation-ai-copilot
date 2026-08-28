// 模拟引擎：流式输出模拟，所有"AI 行为"由定时器+预置数据驱动
// 设计原则同 bedtime：演示体验与真实后端解耦，评审零配置可跑

export function useStreamSimulator() {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  // 逐字流式输出一段文本，回调每个增量
  async function streamText(text: string, onChunk: (chunk: string) => void, cps = 60) {
    const step = Math.max(1, Math.round(cps / 30))
    for (let i = 0; i < text.length; i += step) {
      onChunk(text.slice(i, i + step))
      await sleep(33)
    }
  }

  // 逐项显示列表（模拟流水线处理）
  async function streamItems<T>(items: T[], onItem: (item: T, i: number) => void, interval = 350) {
    for (let i = 0; i < items.length; i++) {
      onItem(items[i], i)
      await sleep(interval)
    }
  }

  return { sleep, streamText, streamItems }
}
