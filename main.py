import chromadb
from sentence_transformers import SentenceTransformer
from openai import OpenAI

# -----------------------------
# Setup
# -----------------------------
chroma_client = chromadb.PersistentClient(path="chromadb_store")

collection = chroma_client.get_collection("medical_knowledge")

# Small, fast model for embedding search
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize OpenAI client
client = OpenAI(api_key="REDACTED")  # or use env var

# -----------------------------
# System prompt (doctor behavior)
# -----------------------------
SYSTEM_PROMPT = """
You are a professional and empathetic virtual doctor.
You should:
1. Greet the patient warmly.
2. Ask relevant follow-up questions before any diagnosis.
3. After gathering enough information, summarize:
   - Possible disease name(s)
   - Reasoning based on symptoms
   - Precautions and next steps
Avoid providing prescriptions or medication names.
Keep your answers concise, medically informative, and caring.
"""

# -----------------------------
# Helper: retrieve related knowledge from Chroma
# -----------------------------
def get_medical_context(user_input: str):
    query_embedding = embedding_model.encode([user_input]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=5
    )
    docs = results["documents"][0]
    return "\n\n".join(docs)

# -----------------------------
# Main chat function
# -----------------------------
def ai_doctor_chat():
    print("🩺 Welcome to your Personal AI Doctor!")
    print("Describe your symptoms (type 'exit' to quit):\n")

    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        user_input = input("👤 You: ").strip()
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("👨‍⚕️ Doctor: Take care and stay healthy! 👋")
            break

        context = get_medical_context(user_input)

        print(f"🧠 Retrieved context:\n{context}\n")

        user_prompt = f"""
The patient said: "{user_input}"

Relevant medical context:
{context}

Respond as a doctor — first ask follow-up questions if needed,
and after you have enough info, give a possible diagnosis with reasoning and precautions.
"""
# print
        conversation.append({"role": "user", "content": user_prompt})

        response = client.chat.completions.create(
            model="gpt-4o-mini",  
            messages=conversation,
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()
        print("👨‍⚕️ Doctor:", reply, "\n")

        # Step 4: Update conversation history for context continuity
        conversation.append({"role": "assistant", "content": reply})


if __name__ == "__main__":
    ai_doctor_chat()
