import os
import secrets
import hashlib
import hmac
import base64
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from db import db
from auth import JWT_SECRET


def serialize_doc(doc: Any) -> Any:
    """Recursively convert datetime to ISO and remove _id for any doc."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            if k == '_id':
                continue
            out[k] = serialize_doc(v)
        return out
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert datetime to ISO strings before insert/update."""
    out = {}
    for k, v in data.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = prepare_for_mongo(v)
        elif isinstance(v, list):
            out[k] = [prepare_for_mongo(x) if isinstance(x, dict) else (x.isoformat() if isinstance(x, datetime) else x) for x in v]
        else:
            out[k] = v
    return out


async def write_audit(actor: Optional[dict], action: str, resource_type: str,
                     resource_id: Optional[str] = None,
                     before: Optional[Dict[str, Any]] = None,
                     after: Optional[Dict[str, Any]] = None,
                     meta: Optional[Dict[str, Any]] = None) -> None:
    entry = {
        'id': secrets.token_hex(12),
        'actor_id': actor['id'] if actor else None,
        'actor_email': actor['email'] if actor else None,
        'action': action,
        'resource_type': resource_type,
        'resource_id': resource_id,
        'before': before,
        'after': after,
        'meta': meta,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_log.insert_one(entry)


async def write_analytics(name: str, actor: Optional[dict] = None, meta: Optional[Dict[str, Any]] = None) -> None:
    await db.analytics_events.insert_one({
        'id': secrets.token_hex(12),
        'name': name,
        'actor_id': actor['id'] if actor else None,
        'meta': meta or {},
        'created_at': datetime.now(timezone.utc).isoformat(),
    })


def sign_url(payload: Dict[str, Any], expires_in_seconds: int = 600) -> str:
    """Generate a stateless signed token for one-time-ish download URLs."""
    body = dict(payload)
    body['exp'] = int((datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)).timestamp())
    body['nonce'] = secrets.token_hex(8)
    raw = json.dumps(body, sort_keys=True).encode('utf-8')
    sig = hmac.new(JWT_SECRET.encode('utf-8'), raw, hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(raw).decode('utf-8') + '.' + sig


def verify_signed_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        b64, sig = token.split('.', 1)
        raw = base64.urlsafe_b64decode(b64.encode('utf-8'))
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        body = json.loads(raw.decode('utf-8'))
        if body.get('exp', 0) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return body
    except Exception:
        return None


def build_ics(events: List[Dict[str, Any]]) -> str:
    """Generate a minimal ICS calendar string."""
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PROOF//Member Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ]
    for ev in events:
        start = ev['start']
        end = ev.get('end') or start
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace('Z', '+00:00'))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace('Z', '+00:00'))
        dtstamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        lines.extend([
            'BEGIN:VEVENT',
            f'UID:{ev["id"]}@prooffirm.com',
            f'DTSTAMP:{dtstamp}',
            f'DTSTART:{start.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
            f'DTEND:{end.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
            f'SUMMARY:{ev.get("title", "")}',
            f'LOCATION:{ev.get("location", "") or ""}',
            f'DESCRIPTION:{(ev.get("description") or "").replace(chr(10), " ")}',
            'END:VEVENT',
        ])
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines)


def diff_dicts(before: Dict[str, Any], after: Dict[str, Any]) -> Dict[str, Any]:
    """Shallow diff: return {field: {before, after}} for changed top-level fields."""
    keys = set((before or {}).keys()) | set((after or {}).keys())
    out = {}
    for k in keys:
        if k in {'updated_at'}:
            continue
        b = (before or {}).get(k)
        a = (after or {}).get(k)
        if b != a:
            out[k] = {'before': b, 'after': a}
    return out


def slugify(text: str) -> str:
    import re
    text = (text or '').strip().lower()
    text = re.sub(r"[^a-z0-9]+", '-', text)
    text = re.sub(r"-+", '-', text).strip('-')
    return text or secrets.token_hex(4)
