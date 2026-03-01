# Conversational RAG — Backend Architecture

## Flow (per user message)

```
User message + conversation history
         │
         ▼
┌─────────────────────────────┐
│  LLM1 — Query Reformulator  │  e.g. "In my chest" → "chest pain location causes symptoms"
│  (query_reformulator.py)    │
└─────────────────────────────┘
         │
         ▼  one search query
┌─────────────────────────────┐
│  Retrieval (top 20)         │  Semantic search in ChromaDB
│  (embeddings.py)            │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Ranking (top 5)            │  ← Ranking happens here (cross-encoder reranker)
│  (embeddings.rank_to_top_k) │     Increases retrieval accuracy vs similarity-only.
└─────────────────────────────┘
         │
         ▼  5 context chunks
┌─────────────────────────────┐
│  LLM2 — Doctor              │  Follow-up questions or diagnosis + precautions
│  (doctor.py)                 │
└─────────────────────────────┘
         │
         ▼
   Reply to user
```

## Modules

| Module | Role |
|--------|------|
| **query_reformulator.py** | LLM1: turns full conversation + current message into one optimized search query. |
| **embeddings.py** | Retrieval (top 20) + **ranking** (cross-encoder → top 5). |
| **doctor.py** | Orchestrates the pipeline and runs LLM2 with ranked context. |

## Constants (embeddings.py)

- `RETRIEVE_TOP_N = 20` — candidates from vector DB before ranking.
- `RANK_TOP_K = 5` — chunks passed to the doctor after ranking.
