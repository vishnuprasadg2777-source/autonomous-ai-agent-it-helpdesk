from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.agent import router as agent_router
from backend.app.api.routes.tickets import router as tickets_router


app = FastAPI(
    title="Autonomous IT Helpdesk API",
    description="Backend API for the Autonomous AI Agent for IT Helpdesk",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(tickets_router)
app.include_router(agent_router)


@app.get("/")
def root():
    return {
        "name": "Autonomous IT Helpdesk API",
        "status": "online",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "autonomous-it-helpdesk",
    }