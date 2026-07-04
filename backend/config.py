import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017/recordguard")
    DB_NAME    = os.getenv("DB_NAME",   "recordguard")
    PORT       = int(os.getenv("PORT",  5000))
    DEBUG      = os.getenv("DEBUG",     "true").lower() == "true"
    # Set SKIP_SEED=true in .env to disable auto-seeding of demo records
    SKIP_SEED  = os.getenv("SKIP_SEED", "false").lower() == "true"
