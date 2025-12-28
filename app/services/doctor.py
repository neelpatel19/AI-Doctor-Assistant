from openai import OpenAI
from typing import List, Tuple, Dict
from app.config import settings
from app.services.embeddings import embedding_service

# System prompt defining doctor behavior
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
    """Core AI Doctor logic"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o-mini"
        self.temperature = 0.7
        print("✅ OpenAI client initialized")
    
    def get_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]]
    ) -> Tuple[str, List[str]]:
        """
        Get doctor's response based on user message and conversation history
        
        Args:
            user_message: User's current message
            conversation_history: Previous messages in conversation
            
        Returns:
            Tuple of (doctor_reply, context_documents_used)
        """
        
        # Step 1: Retrieve relevant medical context from embeddings
        context_docs = embedding_service.search_context(user_message)
        context_text = "\n\n".join(context_docs)
        
        # Step 2: Build user prompt with context
        user_prompt = f"""
The patient said: "{user_message}"

Relevant medical context:
{context_text}

Respond as a doctor — first ask follow-up questions if needed,
and after you have enough info, give a possible diagnosis with reasoning and precautions.
"""
        
        # Step 3: Build conversation messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Add current user message with context
        messages.append({"role": "user", "content": user_prompt})
        
        # Step 4: Get AI response
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
        """Check if doctor service is healthy"""
        try:
            # Test OpenAI connection
            self.client.models.list()
            return True
        except Exception as e:
            print(f"❌ Doctor service unhealthy: {e}")
            return False

# Singleton instance
doctor_service = DoctorService()
