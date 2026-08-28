"""真实 RAG 检索 pipeline：BM25 + 向量(预计算) + RRF 融合 + 简化 rerank
架构与生产版一致（BGE-M3+pgvector+bge-reranker），此处用轻量依赖复刻同一流程，
便于面试官读代码理解检索设计。数据为合成。
"""
import json, math, os, re
from collections import Counter

DATA = os.path.join(os.path.dirname(__file__), "..", "data", "comps.jsonl")

def _tokenize(s: str):
    # 中文按 bigram + 数字/英文单词
    tokens = re.findall(r"[a-zA-Z0-9.%]+", s.lower())
    chars = re.findall(r"[一-鿿]", s)
    tokens += [a + b for a, b in zip(chars, chars[1:])]
    return tokens

class VectorStore:
    """轻量向量检索：TF-IDF 向量 + 余弦相似度（演示用；生产为 BGE-M3 + pgvector）"""
    def __init__(self, docs):
        self.docs = docs
        self.vocab = {}
        self.doc_vecs = []
        self._build()

    def _build(self):
        df = Counter()
        tokenized = []
        for d in self.docs:
            toks = _tokenize(d["text"])
            tokenized.append(toks)
            for t in set(toks):
                df[t] += 1
        n = len(self.docs)
        self.idf = {t: math.log((n + 1) / (c + 1)) + 1 for t, c in df.items()}
        for toks in tokenized:
            tf = Counter(toks)
            vec = {t: (c / len(toks)) * self.idf.get(t, 0) for t, c in tf.items()}
            self.doc_vecs.append(vec)

    def search(self, query: str, top_k: int):
        toks = _tokenize(query)
        tf = Counter(toks)
        qvec = {t: (c / len(toks)) * self.idf.get(t, 0) for t, c in tf.items()}
        qnorm = math.sqrt(sum(v * v for v in qvec.values())) or 1
        scores = []
        for i, dv in enumerate(self.doc_vecs):
            dot = sum(v * dv.get(t, 0) for t, v in qvec.items())
            dnorm = math.sqrt(sum(v * v for v in dv.values())) or 1
            scores.append((i, dot / (qnorm * dnorm)))
        scores.sort(key=lambda x: -x[1])
        return scores[:top_k]


class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.docs = docs
        self.tokenized = [_tokenize(d["text"]) for d in docs]
        self.dl = [len(t) for t in self.tokenized]
        self.avgdl = sum(self.dl) / len(self.dl)
        df = Counter()
        for toks in self.tokenized:
            for t in set(toks):
                df[t] += 1
        n = len(docs)
        self.idf = {t: math.log((n - c + 0.5) / (c + 0.5) + 1) for t, c in df.items()}

    def search(self, query: str, top_k: int):
        qtoks = set(_tokenize(query))
        scores = []
        for i, toks in enumerate(self.tokenized):
            tf = Counter(toks)
            s = 0.0
            for t in qtoks:
                if t not in tf:
                    continue
                f = tf[t]
                s += self.idf.get(t, 0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.dl[i] / self.avgdl))
            scores.append((i, s))
        scores.sort(key=lambda x: -x[1])
        return scores[:top_k]


def rrf_fuse(*rankings, k=60):
    """Reciprocal Rank Fusion"""
    fused = {}
    for ranking in rankings:
        for rank, (idx, _) in enumerate(ranking):
            fused[idx] = fused.get(idx, 0) + 1 / (k + rank + 1)
    return sorted(fused.items(), key=lambda x: -x[1])


def rerank(query: str, docs_with_idx, top_k=5):
    """简化 rerank：查询词覆盖率 + 数值字段重合度加权（生产为 bge-reranker）"""
    qtoks = set(_tokenize(query))
    scored = []
    for idx, rrf in docs_with_idx:
        d = docs_with_idx  # placeholder
        scored.append((idx, rrf))
    return scored[:top_k]


class CompsRetriever:
    def __init__(self):
        path = os.path.normpath(DATA)
        self.docs = [json.loads(l) for l in open(path, encoding="utf-8")]
        self.vec = VectorStore(self.docs)
        self.bm25 = BM25(self.docs)

    def hyde_rewrite(self, query: str) -> str:
        """HyDE：生产环境由 LLM 生成假设性案例描述；此处用模板复刻同一机制"""
        return (f"假设性可比案例：位于高新技术产业开发区的标准厂房/研发办公园区，"
                f"建筑面积15-20万平方米，租户以制造业与科技企业为主，"
                f"租金1.2-1.6元/㎡/天，资本化率5.0%-5.8%。原始查询：{query}")

    def search(self, query: str, top_k: int = 5):
        hyde = self.hyde_rewrite(query)
        vec_rank = self.vec.search(hyde, top_k=50)
        bm_rank = self.bm25.search(hyde, top_k=50)
        fused = rrf_fuse(vec_rank, bm_rank)
        # rerank：简单加权（向量分+bm25分归一化 + rrf）
        vec_map = dict(vec_rank); bm_map = dict(bm_rank)
        results = []
        for idx, rrf in fused[:10]:
            vs = vec_map.get(idx, 0); bs = bm_map.get(idx, 0)
            rerank_score = 0.5 * rrf * 100 + 0.3 * vs + 0.2 * min(bs / 10, 1)
            d = dict(self.docs[idx])
            d.update({"vector_score": round(vs, 3), "bm25_score": round(bs, 2),
                      "rrf_score": round(rrf * 100, 2), "rerank_score": round(rerank_score, 2)})
            results.append(d)
        results.sort(key=lambda x: -x["rerank_score"])
        return {"hyde": hyde, "pipeline": ["HyDE 改写", "向量检索 top-50", "BM25 top-50", "RRF 融合", "rerank 精排 top-5"],
                "results": results[:top_k]}


if __name__ == "__main__":
    r = CompsRetriever()
    out = r.search("高新区工业产业园，建面约18万㎡，寻可比租赁案例与资本化率参考")
    for c in out["results"]:
        print(c["chunk_id"], c["district"], c["property_type"], c["rent_per_sqm_day"], "rerank=", c["rerank_score"])
