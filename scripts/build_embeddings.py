import pandas as pd
from sentence_transformers import SentenceTransformer
import chromadb
import os

CSV_PATH = "Data/chunks.csv"     
COLLECTION_NAME = "medical_knowledge"
PERSIST_PATH = "chromadb_store"  

df = pd.read_csv(CSV_PATH)

if "chunk" not in df.columns:
    raise ValueError("Your CSV must have a 'chunk' column with text to embed")

texts = df["chunk"].astype(str).tolist()
ids = [str(i) for i in df["id"]] if "id" in df.columns else [str(i) for i in range(len(df))]
metadatas = df.drop(columns=["chunk"], errors="ignore").to_dict(orient="records")

print(f"✅ Loaded {len(df)} rows from {CSV_PATH}")

model = SentenceTransformer('all-MiniLM-L6-v2')
print("🧠 Generating embeddings... this may take a minute")

embeddings = model.encode(texts, show_progress_bar=True).tolist()
print("✅ Embeddings generated!")

os.makedirs(PERSIST_PATH, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=PERSIST_PATH)

collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
print(f"📚 Using Chroma collection: {COLLECTION_NAME}")

BATCH_SIZE = 5000

for i in range(0, len(texts), BATCH_SIZE):
    batch_ids = ids[i:i+BATCH_SIZE]
    batch_texts = texts[i:i+BATCH_SIZE]
    batch_embeddings = embeddings[i:i+BATCH_SIZE]

    collection.add(
        ids=batch_ids,
        documents=batch_texts,
        embeddings=batch_embeddings,
        
    )
    print(f"✅ Inserted batch {i // BATCH_SIZE + 1}/{(len(texts) - 1) // BATCH_SIZE + 1}")

query = "What are the symptoms of bowel cancer?"
query_emb = model.encode([query]).tolist()

results = collection.query(query_embeddings=query_emb, n_results=3)
print("\n🔍 Sample Query Results:")
for i, doc in enumerate(results["documents"][0]):
    print(f"{i+1}. {doc[:150]}...\n")

print(f"✅ Chroma data saved permanently at: {os.path.abspath(PERSIST_PATH)}")
