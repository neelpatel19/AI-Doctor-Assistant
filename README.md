# AI-Doctor-Assistant
AI-powered medical assistant providing symptom analysis and health guidance. Built with FastAPI and React for seamless interaction


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
ARTICLE - https://medium.com/@neelemsbhadran/conversational-rag-with-iterative-query-reformulation-increasing-retrieval-accuracy-from-55-to-14391184c392
