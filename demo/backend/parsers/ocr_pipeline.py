"""合成合同 OCR 数据 + 双通道校验逻辑（真实校验代码，OCR 结果为合成）"""

CONTRACT = {
    "file": "租赁合同_扫描件.pdf (12页)",
    "engine": "PaddleOCR + PP-StructureV3（本地部署，数据不出内网）",
    "fields": [
        {"field": "承租面积", "ocr": "3,850 ㎡", "conf": 0.97},
        {"field": "月租金单价", "ocr": "45.2 元/㎡/月", "conf": 0.94},
        {"field": "月租金总额", "ocr": "174,020 元", "conf": 0.91},
        {"field": "租赁期限", "ocr": "2024.03.01 – 2029.02.28", "conf": 0.96},
        {"field": "免租期", "ocr": "3 个月", "conf": 0.62},
        {"field": "租金递增率", "ocr": "每两年 5%", "conf": 0.58},
        {"field": "押金", "ocr": "3 个月租金", "conf": 0.93},
    ],
}

CONF_THRESHOLD = 0.75

def _num(s):
    import re
    m = re.search(r"[\d,]+\.?\d*", s)
    return float(m.group().replace(",", "")) if m else None

def run_ocr():
    """双通道校验：OCR置信度 + 规则/跨字段交叉验算"""
    out = []
    area = unit = total = None
    for f in CONTRACT["fields"]:
        v = _num(f["ocr"])
        if f["field"] == "承租面积": area = v
        if f["field"] == "月租金单价": unit = v
        if f["field"] == "月租金总额": total = v
    for f in CONTRACT["fields"]:
        checks, status = [], "auto-pass"
        if f["conf"] < CONF_THRESHOLD:
            checks.append(f"OCR 置信度 {f['conf']:.2f} < {CONF_THRESHOLD} 阈值")
            status = "manual-review"
        else:
            checks.append(f"OCR 置信度 {f['conf']:.2f} ✓")
        # 跨字段交叉验证
        if f["field"] == "月租金总额" and area and unit and total:
            if abs(area * unit - total) < 1:
                checks.append(f"交叉验算: {unit}×{area}={total:,.0f} ✓")
            else:
                checks.append("交叉验算失败 → 人工复核"); status = "manual-review"
        if f["field"] == "租金递增率" and f["conf"] < CONF_THRESHOLD:
            checks.append("「5%」与「S%」字形歧义，进人工复核队列")
        out.append({**f, "checks": checks, "status": status})
    auto = sum(1 for f in out if f["status"] == "auto-pass")
    return {"meta": {"file": CONTRACT["file"], "engine": CONTRACT["engine"]},
            "fields": out,
            "summary": {"total": len(out), "auto_pass": auto,
                        "review_rate": round((len(out) - auto) / len(out) * 100)}}

if __name__ == "__main__":
    import json
    print(json.dumps(run_ocr(), ensure_ascii=False, indent=2))
