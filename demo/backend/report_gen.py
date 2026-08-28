"""报告生成 + Critic 数值强校验。
核心原则：计算确定性留给代码，语言灵活性留给 LLM。
演示版所有数值从 DB（合成）直接注入文本模板，Critic 逐项与 DB 比对。
"""

DB = {
    "建筑面积": "186,400 ㎡",
    "可出租面积": "162,800 ㎡",
    "出租率": "92%",
    "NOI": "¥84,326,000",
    "资本化率": "5.25%",
    "评估值": "¥1,412,000,000",
    "租金区间下限": "1.21",
    "租金区间上限": "1.55",
    "平均租金取值": "1.42",
}

SECTIONS = [
    {
        "title": "一、估价对象概况",
        "content": "估价对象为位于某高新技术产业开发区的工业产业园区，建筑面积 186,400 ㎡，可出租面积 162,800 ㎡，租户以制造业与科技研发企业为主，园区处于稳定运营期，稳定期出租率 92%。",
        "citations": ["DB:实物状况表"],
        "numbers": [
            {"name": "建筑面积", "written": "186,400 ㎡"},
            {"name": "可出租面积", "written": "162,800 ㎡"},
            {"name": "出租率", "written": "92%"},
        ],
    },
    {
        "title": "二、市场分析",
        "content": "区域同类园区近期平均租金区间为 1.21–1.55 元/㎡/天，资本化率区间为 5.1%–5.6%（引用 C-0847、C-1203、C-0521）。估价对象所处高新区产业集聚度高，租赁需求稳定，取平均租金 1.42 元/㎡/天具备市场支撑。",
        "citations": ["C-0847", "C-1203", "C-0521"],
        "numbers": [
            {"name": "租金区间下限", "written": "1.21"},
            {"name": "租金区间上限", "written": "1.55"},
            {"name": "平均租金取值", "written": "1.42"},
        ],
    },
    {
        "title": "三、收益法测算",
        "content": "经测算，估价对象年净收益(NOI)为 ¥84,326,000，取资本化率 5.25%、收益年期 40 年，收益法评估值为 ¥1,412,000,000（大写：壹拾肆亿壹仟贰佰万元整）。",
        "citations": ["DB:收益测算表"],
        "numbers": [
            {"name": "NOI", "written": "¥84,326,000"},
            {"name": "资本化率", "written": "5.25%"},
            {"name": "评估值", "written": "¥1,412,000,000"},
        ],
    },
]

def critic_check(section):
    """三层防线之数值强校验：每个数值与 DB 比对"""
    results = []
    for n in section["numbers"]:
        db_val = DB[n["name"]]
        passed = n["written"] == db_val or n["written"] in db_val
        results.append({"name": n["name"], "written": n["written"],
                        "db": db_val, "pass": passed})
    return {"title": section["title"], "citations": section["citations"],
            "checks": results, "all_pass": all(r["pass"] for r in results)}
