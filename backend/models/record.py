from datetime import date, datetime
from bson import ObjectId

   


def serialize(record) -> dict:
    """Convert a MongoDB document to a JSON-safe dict."""
    if record is None:
        return None
    record["id"] = str(record.pop("_id"))
    return record


def compute_status(expiry_str: str) -> dict:
    """Return days and status string from an ISO date string."""
    today = date.today()
    try:
        expiry = date.fromisoformat(expiry_str)
    except (ValueError, TypeError):
        return {"days": None, "status": "unknown"}
    days = (expiry - today).days
    if days < 0:
        status = "expired"
    elif days <= 7:
        status = "critical"
    elif days <= 30:
        status = "warning"
    else:
        status = "active"
    return {"days": days, "status": status}


def enrich(record: dict) -> dict:
    """Add computed days / status to a record dict."""
    computed = compute_status(record.get("expiry", ""))
    return {**record, **computed}


def seed_db(collection) -> None:
    """Insert default records if collection is empty."""
    if collection.count_documents({}) == 0:
        now = datetime.utcnow()
        
     
