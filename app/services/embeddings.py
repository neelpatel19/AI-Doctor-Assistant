import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
from app.config import settings

class EmbeddingService:
    """Handles all ChromaDB and embedding operations"""
    
    def __init__(self):
        self.persist_path = settings.CHROMA_PERSIST_PATH
        self.collection_name = settings.COLLECTION_NAME
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path=self.persist_path)
        
        # Load collection
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            print(f"✅ Loaded collection: {self.collection_name}")
        except Exception as e:
            raise RuntimeError(f"Failed to load collection '{self.collection_name}': {e}")
        
        # Load embedding model
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model loaded")
    
    def search_context(self, query: str, n_results: int = 5) -> List[str]:
        """
        Search for relevant medical context based on user query
        
        Args:
            query: User's input message
            n_results: Number of results to retrieve
            
        Returns:
            List of relevant medical text chunks
        """
        try:
            # Generate embedding for query
            query_embedding = self.model.encode([query]).tolist()
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=n_results
            )
            
            # Extract documents
            documents = results.get("documents", [[]])[0]
            return documents
            
        except Exception as e:
            print(f"❌ Error searching context: {e}")
            return []
    
    def get_document_count(self) -> int:
        """Get total number of documents in collection"""
        try:
            return self.collection.count()
        except Exception as e:
            print(f"❌ Error getting document count: {e}")
            return 0
    
    def is_ready(self) -> bool:
        """Check if embedding service is ready"""
        return self.collection is not None and self.collection.count() > 0

# Singleton instance
embedding_service = EmbeddingService()
