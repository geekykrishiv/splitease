from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth_routes, users, groups, expenses, settlements, analytics, csv_export
from routes.ws import manager
import uvicorn

app = FastAPI(
    title="Splitwise Clone API",
    description="Expense sharing app with AI analytics",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(expenses.router)
app.include_router(settlements.router)
app.include_router(analytics.router)
app.include_router(csv_export.router)


@app.get("/")
def root():
    return {"message": "Splitwise Clone API", "version": "1.0.0"}


@app.websocket("/ws/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: int):
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)


# Auto-seed on startup
@app.on_event("startup")
def startup_event():
    from seed import seed
    seed()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
