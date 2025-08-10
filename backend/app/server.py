from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.agent import router as agent_router
from app.routes.enrich import router as enrich_router
from app.routes.stripe import router as stripe_router
from app.database import lifespan

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(enrich_router)
app.include_router(stripe_router)


@app.get("/")
async def health_check():
    return {"status": "Backend running..."}
