from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.routes import chat, admin
import os

# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="AI-powered medical diagnosis assistant",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(admin.router)

# Serve static frontend files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    
    @app.get("/")
    async def serve_frontend():
        return FileResponse(os.path.join(frontend_path, "index.html"))

# Root endpoint (if no frontend)
@app.get("/api")
async def root():
    return {
        "message": "AI Doctor API is running! 🩺",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("🚀 AI Doctor API Starting...")
    print("=" * 60)
    print(f"📚 Collection: {settings.COLLECTION_NAME}")
    print(f"💾 ChromaDB path: {settings.CHROMA_PERSIST_PATH}")
    print(f"📖 API Docs: http://localhost:8000/docs")
    print(f"🌐 Frontend: http://localhost:8000")
    print("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("👋 AI Doctor API shutting down...")
