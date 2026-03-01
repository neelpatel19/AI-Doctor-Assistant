"""
Conversational RAG — LLM2: Doctor.

Orchestration flow:
  1. Query reformulation (LLM1): conversation + current message → one search query.
  2. Retrieval: semantic search for top 20 candidates.
  3. Ranking: re-score and keep top 5 (ranking happens in embeddings.rank_to_top_k).
  4. Doctor (LLM2): answer using conversation history + top 5 context chunks.
"""

from openai import OpenAI
from typing import List, Tuple, Dict
from app.services.embeddings import embedding_service
from app.services.query_reformulator import query_reformulator
import os

# LLM2: defines how the doctor responds (follow-ups, then diagnosis + precautions)
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


class DoctorService:
    """Orchestrates query reformulation → retrieval → ranking → doctor response."""

    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"
        self.temperature = 0.7
        print("✅ OpenAI client initialized")

    def get_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> Tuple[str, List[str]]:
        """
        Full conversational RAG pipeline:

        1. Reformulate: turn conversation + current message into one search query (LLM1).
        2. Retrieve: get top 20 candidate chunks from the vector DB.
        3. Rank: re-score and keep top 5 (ranking happens in embedding_service).
        4. Doctor: respond with context (LLM2), asking follow-ups or giving diagnosis.
        """
        # ——— Step 1: Query reformulation (LLM1) ———
        # So follow-ups like "In my chest" become "chest pain location causes" etc.
        search_query = query_reformulator.reformulate(
            user_message=user_message,
            conversation_history=conversation_history,
        )

        # ——— Step 2 & 3: Retrieval (top 20) + Ranking (top 5) ———
        # Ranking happens inside retrieve_and_rank (see embeddings.rank_to_top_k)
        context_docs = embedding_service.retrieve_and_rank(
            query=search_query,
            retrieve_n=20,
            rank_top_k=5,
        )
        context_text = "\n\n".join(context_docs) if context_docs else "(No specific context retrieved; answer from general knowledge and conversation.)"

        # ——— Step 4: Doctor response (LLM2) ———
        user_prompt = f"""
The patient said: "{user_message}"

Relevant medical context (from retrieval + ranking):
{context_text}

Respond as a doctor — first ask follow-up questions if needed,
and after you have enough info, give a possible diagnosis with reasoning and precautions.
"""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
            )
            reply = response.choices[0].message.content.strip()
            return reply, context_docs
        except Exception as e:
            print(f"❌ Error getting AI response: {e}")
            raise Exception(f"Failed to get doctor response: {str(e)}")

    def is_healthy(self) -> bool:
        """Check if doctor service can reach OpenAI."""
        try:
            self.client.models.list()
            return True
        except Exception as e:
            print(f"❌ Doctor service unhealthy: {e}")
            return False


doctor_service = DoctorService()
