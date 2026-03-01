"""
Conversational RAG — Retrieval and Ranking.

Flow:
  1. Semantic search: embed query → retrieve top N candidates (e.g. 20) from vector DB.
  2. Ranking: re-score (query, doc) pairs with a cross-encoder and take top K (e.g. 5).
     → Ranking happens here: improves precision over naive top-K by similarity.
"""

import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from typing import List
from app.config import settings


# How many chunks we fetch from the vector DB (before ranking)
RETRIEVE_TOP_N = 20
# How many we keep after ranking (passed to the doctor LLM)
RANK_TOP_K = 5


class EmbeddingService:
    """ChromaDB + embeddings + reranker for context-aware retrieval."""

    def __init__(self):
        self.persist_path = settings.CHROMA_PERSIST_PATH
        self.collection_name = settings.COLLECTION_NAME

        # ChromaDB client and collection
        self.client = chromadb.PersistentClient(path=self.persist_path)
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            print(f"✅ Loaded collection: {self.collection_name}")
        except Exception:
            self.collection = self.client.create_collection(name=self.collection_name)
            print(f"✅ Created empty collection: {self.collection_name} (add documents via admin/ingest to enable RAG)")

        # Embedding model for semantic search
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model loaded")

        # Cross-encoder for ranking: (query, document) → relevance score
        # Ranking happens here — re-scores candidates for better precision than similarity-only
        try:
            self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            print("✅ Reranker (cross-encoder) loaded")
        except Exception as e:
            print(f"⚠️ Reranker not loaded ({e}), ranking will use retrieval order only")
            self.reranker = None

    def retrieve_candidates(self, query: str, n_results: int = RETRIEVE_TOP_N) -> List[str]:
        """
        Step 1 — Semantic search: get top N candidate chunks from the vector DB.
        Does not apply ranking yet.
        """
        if not query.strip():
            return []
        try:
            count = self.collection.count()
            if count == 0:
                return []
            query_embedding = self.model.encode([query]).tolist()
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=min(n_results, count),
            )
            documents = results.get("documents", [[]])[0]
            return documents if documents else []
        except Exception as e:
            print(f"❌ Error retrieving context: {e}")
            return []

    def rank_to_top_k(self, query: str, documents: List[str], top_k: int = RANK_TOP_K) -> List[str]:
        """
        Step 2 — Ranking: re-score (query, doc) pairs and return top K.
        This is where ranking happens: improves retrieval accuracy by using
        a cross-encoder instead of relying only on embedding similarity.
        """
        if not documents or not query.strip():
            return documents[:top_k]
        if self.reranker is None:
            return documents[:top_k]
        try:
            pairs = [[query, doc] for doc in documents]
            scores = self.reranker.predict(pairs)
            # Sort by score descending and take top_k
            indexed = list(zip(scores, documents))
            indexed.sort(key=lambda x: x[0], reverse=True)
            return [doc for _, doc in indexed[:top_k]]
        except Exception as e:
            print(f"❌ Error during ranking: {e}, using retrieval order")
            return documents[:top_k]

    def retrieve_and_rank(
        self,
        query: str,
        retrieve_n: int = RETRIEVE_TOP_N,
        rank_top_k: int = RANK_TOP_K,
    ) -> List[str]:
        """
        Full pipeline: retrieve top N candidates, then rank to top K.
        Use this for conversational RAG: pass the reformulated query here.
        """
        candidates = self.retrieve_candidates(query, n_results=retrieve_n)
        return self.rank_to_top_k(query, candidates, top_k=rank_top_k)

    def search_context(self, query: str, n_results: int = 5) -> List[str]:
        """
        Legacy single-call search (retrieve + rank in one step).
        Prefer retrieve_and_rank for the full pipeline with configurable N/K.
        """
        return self.retrieve_and_rank(query, retrieve_n=n_results * 4, rank_top_k=n_results)

    def get_document_count(self) -> int:
        """Total number of documents in the collection."""
        try:
            return self.collection.count()
        except Exception as e:
            print(f"❌ Error getting document count: {e}")
            return 0

    def is_ready(self) -> bool:
        """True if collection exists and has at least one document."""
        return self.collection is not None and self.collection.count() > 0


embedding_service = EmbeddingService()
