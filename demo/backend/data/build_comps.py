"""可比案例合成数据 —— 全部虚构"""
import json, os

DISTRICTS = ["高新区", "经开区", "保税区", "自贸区", "临港新区"]
TYPES = ["标准厂房", "研发办公", "制造仓储", "物流仓储", "产业园区"]

# (chunk_id, district, type, area万㎡, rent元/㎡/天, cap_rate%, date)
CASES = [
    ("C-0847", "高新区", "标准厂房", 15.2, 1.38, 5.3, "2025-11"),
    ("C-1203", "经开区", "研发办公", 21.6, 1.55, 5.5, "2026-01"),
    ("C-0521", "高新区", "制造仓储", 12.8, 1.21, 5.1, "2025-08"),
    ("C-0966", "保税区", "物流仓储", 25.3, 1.32, 5.6, "2025-12"),
    ("C-0312", "高新区", "标准厂房", 9.4, 1.29, 5.2, "2025-06"),
    ("C-1105", "自贸区", "研发办公", 18.9, 1.48, 5.4, "2025-10"),
    ("C-0734", "高新区", "产业园区", 16.5, 1.35, 5.25, "2025-09"),
    ("C-1458", "临港新区", "制造仓储", 30.2, 1.18, 5.0, "2025-07"),
    ("C-0290", "经开区", "标准厂房", 11.7, 1.42, 5.35, "2026-02"),
    ("C-1377", "高新区", "研发办公", 14.3, 1.51, 5.45, "2025-12"),
    ("C-0662", "保税区", "标准厂房", 19.8, 1.33, 5.3, "2025-10"),
    ("C-0919", "自贸区", "物流仓储", 22.4, 1.26, 5.15, "2025-09"),
]

def build_cases():
    out = []
    for cid, d, t, area, rent, cap, date in CASES:
        text = (f"{d}{t}项目，总建筑面积{area}万平方米，{date}监测平均租金"
                f"{rent}元/㎡/天，交易案例隐含资本化率{cap}%。租户以制造业与科技企业为主，"
                f"园区运营稳定，出租率处于区域平均水平。")
        out.append({
            "chunk_id": cid, "district": d, "property_type": t,
            "area_wan_sqm": area, "rent_per_sqm_day": rent,
            "cap_rate": cap, "date": date, "text": text,
        })
    return out

if __name__ == "__main__":
    path = os.path.join(os.path.dirname(__file__), "comps.jsonl")
    with open(path, "w", encoding="utf-8") as f:
        for c in build_cases():
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    print(f"wrote {len(CASES)} cases -> {path}")
