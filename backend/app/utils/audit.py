import hashlib
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

GENESIS_HASH = "0" * 64

def canonical_timestamp(ts: datetime) -> str:
    """
    Normalizes any datetime to a canonical UTC ISO-8601 string.
    """
    if ts.tzinfo is not None:
        utc_ts = ts.astimezone(timezone.utc)
    else:
        utc_ts = ts.replace(tzinfo=timezone.utc)
    # Truncate to second or millisecond precision consistently
    return utc_ts.strftime("%Y-%m-%dT%H:%M:%S") + "Z"

def calculate_audit_hash(
    prev_hash: str,
    table_name: str,
    record_id: int,
    action: str,
    actor_id: Optional[int],
    timestamp: datetime,
    old_values: Optional[str] = None,
    new_values: Optional[str] = None
) -> str:
    """
    Computes a cryptographic SHA-256 hash linked to the previous entry.
    """
    ts_str = canonical_timestamp(timestamp)
    raw = f"{prev_hash}|{table_name}|{record_id}|{action}|{actor_id or 'SYSTEM'}|{old_values or ''}|{new_values or ''}|{ts_str}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def record_audit_log(
    db: Session,
    table_name: str,
    record_id: int,
    action: str,
    actor_id: Optional[int],
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None
) -> AuditLog:
    """
    Appends an immutable audit log entry linked to the previous audit log's SHA-256 hash.
    """
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.current_hash if last_log else GENESIS_HASH
    
    now = datetime.now(timezone.utc)
    old_val_str = json.dumps(old_values, sort_keys=True, default=str) if old_values else None
    new_val_str = json.dumps(new_values, sort_keys=True, default=str) if new_values else None
    
    current_hash = calculate_audit_hash(
        prev_hash=prev_hash,
        table_name=table_name,
        record_id=record_id,
        action=action,
        actor_id=actor_id,
        timestamp=now,
        old_values=old_val_str,
        new_values=new_val_str
    )
    
    audit_entry = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        actor_id=actor_id,
        old_values=old_val_str,
        new_values=new_val_str,
        timestamp=now,
        prev_hash=prev_hash,
        current_hash=current_hash
    )
    
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

def verify_audit_chain(db: Session) -> dict:
    """
    Validates every link in the SHA-256 audit chain.
    Returns whether the chain is unbroken and identifies any tampered node.
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "total_records": 0,
            "is_valid": True,
            "broken_at_id": None,
            "message": "Audit chain is empty. Integrity verified."
        }
    
    expected_prev_hash = GENESIS_HASH
    for log in logs:
        # 1. Check prev_hash pointer matches previous node's current_hash
        if log.prev_hash != expected_prev_hash:
            return {
                "total_records": len(logs),
                "is_valid": False,
                "broken_at_id": log.id,
                "message": f"Hash chain broken at record ID {log.id}: prev_hash mismatch."
            }
        
        # 2. Recompute current_hash from record fields
        computed_hash = calculate_audit_hash(
            prev_hash=log.prev_hash,
            table_name=log.table_name,
            record_id=log.record_id,
            action=log.action,
            actor_id=log.actor_id,
            timestamp=log.timestamp,
            old_values=log.old_values,
            new_values=log.new_values
        )
        
        if computed_hash != log.current_hash:
            return {
                "total_records": len(logs),
                "is_valid": False,
                "broken_at_id": log.id,
                "message": f"Tampering detected at record ID {log.id}: content hash does not match."
            }
        
        expected_prev_hash = log.current_hash

    return {
        "total_records": len(logs),
        "is_valid": True,
        "broken_at_id": None,
        "message": f"Cryptographic integrity verified across all {len(logs)} audit entries."
    }
