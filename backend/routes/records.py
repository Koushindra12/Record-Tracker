from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from models.record import serialize, enrich, compute_status, seed_db

bp = Blueprint("records", __name__, url_prefix="/api")


def get_col():
    return current_app.db["records"]


# ── GET /api/records ─────────────────────────────────────────────────────────
@bp.get("/records")
def list_records():
    docs = [enrich(serialize(r)) for r in get_col().find()]
    return jsonify(docs)


# ── POST /api/records ─────────────────────────────────────────────────────────
@bp.post("/records")
def create_record():
    body = request.get_json(silent=True) or {}
    name   = (body.get("name")   or "").strip()
    cat    = (body.get("cat")    or "").strip()
    expiry = (body.get("expiry") or "").strip()

    if not name or not cat or not expiry:
        return jsonify({"error": "name, cat, and expiry are required"}), 400

    now = datetime.utcnow()
    doc = {
        "name":       name,
        "cat":        cat,
        "expiry":     expiry,
        "owner":      (body.get("owner")  or "").strip(),
        "vendor":     (body.get("vendor") or "").strip(),
        "notes":      (body.get("notes")  or "").strip(),
        "created_at": now,
        "updated_at": now,
    }
    result = get_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(enrich(serialize(doc))), 201


# ── GET /api/records/<id> ─────────────────────────────────────────────────────
@bp.get("/records/<record_id>")
def get_record(record_id):
    try:
        oid = ObjectId(record_id)
    except InvalidId:
        return jsonify({"error": "Invalid id"}), 400
    doc = get_col().find_one({"_id": oid})
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(enrich(serialize(doc)))


# ── PUT /api/records/<id> ─────────────────────────────────────────────────────
@bp.put("/records/<record_id>")
def update_record(record_id):
    try:
        oid = ObjectId(record_id)
    except InvalidId:
        return jsonify({"error": "Invalid id"}), 400

    body = request.get_json(silent=True) or {}
    allowed = {"name", "cat", "expiry", "owner", "vendor", "notes"}
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        return jsonify({"error": "Nothing to update"}), 400

    update["updated_at"] = datetime.utcnow()
    result = get_col().find_one_and_update(
        {"_id": oid},
        {"$set": update},
        return_document=True,
    )
    if not result:
        return jsonify({"error": "Not found"}), 404
    return jsonify(enrich(serialize(result)))


# ── DELETE /api/records/<id> ──────────────────────────────────────────────────
@bp.delete("/records/<record_id>")
def delete_record(record_id):
    try:
        oid = ObjectId(record_id)
    except InvalidId:
        return jsonify({"error": "Invalid id"}), 400
    result = get_col().delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


# ── GET /api/stats ─────────────────────────────────────────────────────────────
@bp.get("/stats")
def stats():
    records = [enrich(serialize(r)) for r in get_col().find()]
    counts = {"expired": 0, "critical": 0, "warning": 0, "active": 0, "total": len(records)}
    for r in records:
        s = r.get("status")
        if s in counts:
            counts[s] += 1
    return jsonify(counts)


# ── GET /api/health ────────────────────────────────────────────────────────────
@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


# ── POST /api/reset ────────────────────────────────────────────────────────────
@bp.post("/reset")
def reset_data():
    """Delete all records and restore the 12 default demo records."""
    col = get_col()
    col.delete_many({})
    seed_db(col)
    count = col.count_documents({})
    return jsonify({"success": True, "seeded": count})
