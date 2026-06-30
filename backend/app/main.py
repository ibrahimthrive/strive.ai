from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    billing,
    chat,
    conversations,
    dashboard,
    folders,
    profile,
    settings as settings_routes,
    share,
    webhooks,
)
from app.core.config import get_settings
from app.core.db import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(billing.router)
app.include_router(conversations.router)
app.include_router(dashboard.router)
app.include_router(folders.router)
app.include_router(profile.router)
app.include_router(settings_routes.router)
app.include_router(share.router)
app.include_router(share.public_router)
app.include_router(webhooks.router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
