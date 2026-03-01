"""
Conversational RAG — LLM1: Query Reformulator.

Turns the full conversation + current message into a single, optimized search query
so retrieval is context-aware (e.g. "In my chest" → "chest pain location causes symptoms").
"""

from openai import OpenAI
from typing import List, Dict
import os

REFORMULATOR_SYSTEM = """You are a medical search query optimizer.
Given a conversation between a patient and a doctor, output ONE short search query (a few key phrases, no full sentences) that would best find relevant medical knowledge for the LATEST patient message in context.
Include: symptom, location, quality, duration, aggravating/relieving factors if mentioned.
Output ONLY the search query, nothing else. No quotes, no explanation."""


class QueryReformulator:
    """LLM1: Reformulates conversation + current message into one retrieval query."""

    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"
        self.temperature = 0.2  # Low for consistent query format

    def reformulate(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> str:
        """
        Build a context-aware search query from the full conversation.

        - If no history, the query is just the current message (cleaned).
        - If there is history, LLM1 sees doctor + user turns and outputs
          one optimized query (e.g. "chest pain sharp worse breathing").
        """
        if not conversation_history and not user_message.strip():
            return ""

        # First turn: use the user message as the query (no reformulation needed)
        if not conversation_history:
            return user_message.strip()

        # Build conversation transcript for LLM1
        lines = []
        for msg in conversation_history:
            role = "Patient" if msg.get("role") == "user" else "Doctor"
            lines.append(f"{role}: {msg.get('content', '').strip()}")
        lines.append(f"Patient: {user_message.strip()}")

        transcript = "\n".join(lines)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": REFORMULATOR_SYSTEM},
                    {"role": "user", "content": f"Conversation:\n{transcript}\n\nOutput the single search query:"},
                ],
                temperature=self.temperature,
                max_tokens=80,
            )
            query = (response.choices[0].message.content or "").strip()
            return query if query else user_message.strip()
        except Exception as e:
            print(f"❌ Query reformulation failed, using raw message: {e}")
            return user_message.strip()


# Singleton for use in doctor service
query_reformulator = QueryReformulator()
