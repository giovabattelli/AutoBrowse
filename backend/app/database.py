from fastapi import FastAPI
from contextlib import asynccontextmanager
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")

OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME")


@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client["opero-extension-db"]

    try:
        app.state.db = db
        app.state.users_col = db["users"]
        app.state.profiles_col = db["profiles"]
        app.state.premium_col = db["premium"]
        yield
    finally:
        mongo_client.close()
