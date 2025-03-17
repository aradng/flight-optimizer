from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from flight_optimizer.api import router

app = FastAPI(
    debug=True,
    title="codal",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=router, prefix="/api")
