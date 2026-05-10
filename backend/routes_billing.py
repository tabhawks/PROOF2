import secrets
import io
import base64
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from db import db
from auth import get_current_user, require_cap, MEMBER_ROLES, STAFF_ROLES
from utils import write_audit, serialize_doc, diff_dicts

router = APIRouter(prefix='/billing', tags=['billing'])

# ============ RETAINER PLANS ============
@router.get('/plans')
async def list_plans(user: dict = Depends(get_current_user)):
    items = await db.retainer_plans.find().sort('order', 1).to_list(100)
    return [serialize_doc(i) for i in items]


@router.post('/plans')
async def create_plan(payload: dict, user: dict = Depends(require_cap('manage_settings'))):
    plan = {
        'id': secrets.token_hex(8),
        'name': payload.get('name', 'Untitled tier'),
        'tagline': payload.get('tagline', ''),
        'monthly_amount_usd': int(payload.get('monthly_amount_usd') or 0),
        'currency': payload.get('currency', 'USD'),
        'features': payload.get('features') or [],
        'payment_link_url': payload.get('payment_link_url', ''),
        'order': int(payload.get('order') or 0),
        'active': payload.get('active', True),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.retainer_plans.insert_one(plan)
    await write_audit(user, 'create', 'retainer_plan', plan['id'], None, plan)
    return serialize_doc(plan)


@router.patch('/plans/{plan_id}')
async def update_plan(plan_id: str, payload: dict, user: dict = Depends(require_cap('manage_settings'))):
    before = await db.retainer_plans.find_one({'id': plan_id})
    if not before:
        raise HTTPException(404, 'not found')
    fields = ['name', 'tagline', 'monthly_amount_usd', 'currency', 'features', 'payment_link_url', 'order', 'active']
    updates = {f: payload[f] for f in fields if f in payload}
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.retainer_plans.update_one({'id': plan_id}, {'$set': updates})
    after = await db.retainer_plans.find_one({'id': plan_id})
    await write_audit(user, 'update', 'retainer_plan', plan_id, serialize_doc(before), serialize_doc(after), {'diff': diff_dicts(serialize_doc(before), serialize_doc(after))})
    return serialize_doc(after)


@router.delete('/plans/{plan_id}')
async def delete_plan(plan_id: str, user: dict = Depends(require_cap('manage_settings'))):
    plan = await db.retainer_plans.find_one({'id': plan_id})
    if not plan:
        raise HTTPException(404, 'not found')
    await db.retainer_plans.delete_one({'id': plan_id})
    await write_audit(user, 'delete', 'retainer_plan', plan_id, serialize_doc(plan))
    return {'ok': True}


# ============ ATHLETE RETAINER ASSIGNMENTS ============
@router.get('/retainers')
async def list_retainers(athlete_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {}
    if user['role'] in MEMBER_ROLES:
        # members can see their own retainers via their linked athletes
        links = await db.athlete_members.find({'profile_id': user['id']}).to_list(100)
        q['athlete_id'] = {'$in': [l['athlete_id'] for l in links]}
    elif athlete_id:
        q['athlete_id'] = athlete_id
    items = await db.retainers.find(q).sort('created_at', -1).to_list(500)
    out = []
    for r in items:
        plan = await db.retainer_plans.find_one({'id': r.get('plan_id')}, {'_id': 0})
        athlete = await db.athletes.find_one({'id': r.get('athlete_id')}, {'_id': 0})
        out.append({**serialize_doc(r), 'plan': serialize_doc(plan), 'athlete': serialize_doc(athlete)})
    return out


@router.post('/retainers')
async def create_retainer(payload: dict, user: dict = Depends(require_cap('manage_members'))):
    athlete_id = payload.get('athlete_id')
    plan_id = payload.get('plan_id')
    if not athlete_id or not plan_id:
        raise HTTPException(400, 'athlete_id and plan_id required')
    if not await db.athletes.find_one({'id': athlete_id}):
        raise HTTPException(404, 'athlete not found')
    if not await db.retainer_plans.find_one({'id': plan_id}):
        raise HTTPException(404, 'plan not found')
    r = {
        'id': secrets.token_hex(12),
        'athlete_id': athlete_id,
        'plan_id': plan_id,
        'status': payload.get('status', 'pending'),  # pending | active | paused | ended
        'started_at': payload.get('started_at'),
        'ended_at': None,
        'note': payload.get('note', ''),
        'created_by': user['id'],
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.retainers.insert_one(r)
    await write_audit(user, 'create', 'retainer', r['id'], None, serialize_doc(r))
    return serialize_doc(r)


@router.patch('/retainers/{retainer_id}')
async def update_retainer(retainer_id: str, payload: dict, user: dict = Depends(require_cap('manage_members'))):
    before = await db.retainers.find_one({'id': retainer_id})
    if not before:
        raise HTTPException(404, 'not found')
    fields = ['plan_id', 'status', 'started_at', 'ended_at', 'note']
    updates = {f: payload[f] for f in fields if f in payload}
    if updates.get('status') == 'ended' and not updates.get('ended_at'):
        updates['ended_at'] = datetime.now(timezone.utc).isoformat()
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.retainers.update_one({'id': retainer_id}, {'$set': updates})
    after = await db.retainers.find_one({'id': retainer_id})
    await write_audit(user, 'update', 'retainer', retainer_id, serialize_doc(before), serialize_doc(after), {'diff': diff_dicts(serialize_doc(before), serialize_doc(after))})
    return serialize_doc(after)


@router.delete('/retainers/{retainer_id}')
async def delete_retainer(retainer_id: str, user: dict = Depends(require_cap('manage_members'))):
    r = await db.retainers.find_one({'id': retainer_id})
    if not r:
        raise HTTPException(404, 'not found')
    await db.retainers.delete_one({'id': retainer_id})
    await write_audit(user, 'delete', 'retainer', retainer_id, serialize_doc(r))
    return {'ok': True}


# ============ COVENANTS (E-SIGN) ============
DEFAULT_COVENANT_BODY = '''COVENANT OF ENGAGEMENT

Between PROOF (the "Firm") and the undersigned Member.

1. Engagement. The Firm is engaged to coordinate the Member\'s strategic management across the seven dimensions of the PROOF Model: person, career, brand, business, reputation, lifestyle, legacy.

2. Privacy. Information shared in the course of engagement is private and confidential. The Firm will not disclose Member information without consent, except where compelled by law.

3. Scope. The Firm is not the Member\'s registered agent in any jurisdiction requiring registration. The Firm does not provide legal, tax, or investment advice. The Firm coordinates alongside licensed counsel.

4. Term. This covenant is in effect from the date of signature and may be ended by either party in writing.

5. Discretion. The relationship is by referral and consideration. Public reference to membership is not made without written approval.

By signing below, the Member affirms understanding and agreement.'''


@router.get('/covenants')
async def list_covenants(user: dict = Depends(get_current_user)):
    if user['role'] in MEMBER_ROLES:
        items = await db.covenants.find({'member_id': user['id']}).sort('created_at', -1).to_list(100)
    else:
        items = await db.covenants.find().sort('created_at', -1).to_list(500)
    out = []
    for c in items:
        member = await db.profiles.find_one({'id': c.get('member_id')}, {'_id': 0, 'password_hash': 0, 'totp_secret': 0})
        athlete = await db.athletes.find_one({'id': c.get('athlete_id')}, {'_id': 0}) if c.get('athlete_id') else None
        out.append({**serialize_doc(c), 'member': serialize_doc(member), 'athlete': serialize_doc(athlete)})
    return out


@router.post('/covenants')
async def create_covenant(payload: dict, user: dict = Depends(require_cap('manage_members'))):
    member_id = payload.get('member_id')
    if not member_id:
        raise HTTPException(400, 'member_id required')
    member = await db.profiles.find_one({'id': member_id})
    if not member or member['role'] not in MEMBER_ROLES:
        raise HTTPException(404, 'member not found')
    c = {
        'id': secrets.token_hex(12),
        'title': payload.get('title') or 'Covenant of Engagement',
        'body': payload.get('body') or DEFAULT_COVENANT_BODY,
        'member_id': member_id,
        'athlete_id': payload.get('athlete_id'),
        'status': 'sent',  # draft | sent | signed | void
        'created_by': user['id'],
        'sent_at': datetime.now(timezone.utc).isoformat(),
        'signed_at': None,
        'signature': None,  # { typed_name, canvas_data_url, ip, ua, signed_at }
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.covenants.insert_one(c)
    await write_audit(user, 'create', 'covenant', c['id'], None, serialize_doc({k: v for k, v in c.items() if k != 'body'}))
    return serialize_doc(c)


@router.get('/covenants/{covenant_id}')
async def get_covenant(covenant_id: str, user: dict = Depends(get_current_user)):
    c = await db.covenants.find_one({'id': covenant_id})
    if not c:
        raise HTTPException(404, 'not found')
    if user['role'] in MEMBER_ROLES and c['member_id'] != user['id']:
        raise HTTPException(403, 'forbidden')
    return serialize_doc(c)


@router.post('/covenants/{covenant_id}/sign')
async def sign_covenant(covenant_id: str, payload: dict, request: Request, user: dict = Depends(get_current_user)):
    c = await db.covenants.find_one({'id': covenant_id})
    if not c:
        raise HTTPException(404, 'not found')
    if user['role'] not in MEMBER_ROLES or c['member_id'] != user['id']:
        raise HTTPException(403, 'only the member can sign')
    if c['status'] == 'signed':
        raise HTTPException(400, 'already signed')
    typed_name = (payload.get('typed_name') or '').strip()
    canvas = payload.get('canvas_data_url') or ''
    if not typed_name or not canvas:
        raise HTTPException(400, 'typed_name and canvas_data_url required')
    sig = {
        'typed_name': typed_name,
        'canvas_data_url': canvas,
        'ip': request.client.host if request.client else 'unknown',
        'ua': request.headers.get('user-agent', ''),
        'signed_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.covenants.update_one({'id': covenant_id}, {'$set': {
        'status': 'signed',
        'signature': sig,
        'signed_at': sig['signed_at'],
        'updated_at': sig['signed_at'],
    }})
    after = await db.covenants.find_one({'id': covenant_id})
    await write_audit(user, 'sign', 'covenant', covenant_id, None, {'status': 'signed', 'typed_name': typed_name, 'ip': sig['ip']})
    return serialize_doc(after)


@router.post('/covenants/{covenant_id}/void')
async def void_covenant(covenant_id: str, user: dict = Depends(require_cap('manage_members'))):
    c = await db.covenants.find_one({'id': covenant_id})
    if not c:
        raise HTTPException(404, 'not found')
    await db.covenants.update_one({'id': covenant_id}, {'$set': {'status': 'void', 'updated_at': datetime.now(timezone.utc).isoformat()}})
    await write_audit(user, 'void', 'covenant', covenant_id)
    return {'ok': True}


@router.get('/covenants/{covenant_id}/pdf')
async def covenant_pdf(covenant_id: str, user: dict = Depends(get_current_user)):
    c = await db.covenants.find_one({'id': covenant_id})
    if not c:
        raise HTTPException(404, 'not found')
    if user['role'] in MEMBER_ROLES and c['member_id'] != user['id']:
        raise HTTPException(403, 'forbidden')
    pdf = build_covenant_pdf(c)
    await write_audit(user, 'download', 'covenant', covenant_id, meta={'format': 'pdf'})
    return Response(content=pdf, media_type='application/pdf', headers={
        'Content-Disposition': f'attachment; filename=covenant-{covenant_id[:8]}.pdf'
    })


def build_covenant_pdf(c: dict) -> bytes:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas as rcanvas
    from reportlab.lib.units import inch
    from reportlab.lib.utils import ImageReader
    buf = io.BytesIO()
    pdf = rcanvas.Canvas(buf, pagesize=LETTER)
    w, h = LETTER
    pdf.setFont('Times-Italic', 22)
    pdf.drawString(0.75*inch, h-1.0*inch, 'PROOF')
    pdf.setFont('Helvetica', 8)
    pdf.drawString(0.75*inch, h-1.18*inch, 'PRIVATE ATHLETE MANAGEMENT')
    pdf.line(0.75*inch, h-1.30*inch, w-0.75*inch, h-1.30*inch)
    pdf.setFont('Times-Roman', 18)
    pdf.drawString(0.75*inch, h-1.7*inch, c.get('title', 'Covenant of Engagement'))
    pdf.setFont('Helvetica', 9)
    pdf.drawString(0.75*inch, h-1.95*inch, f"Status: {c.get('status', '').upper()}")
    pdf.drawString(2.5*inch, h-1.95*inch, f"Sent: {(c.get('sent_at') or '')[:10]}")
    pdf.drawString(4.5*inch, h-1.95*inch, f"Member: {c.get('member_id', '')[:12]}")

    text_obj = pdf.beginText(0.75*inch, h-2.4*inch)
    text_obj.setFont('Times-Roman', 11)
    text_obj.setLeading(15)
    body = c.get('body') or ''
    for line in body.split('\n'):
        # rough wrap at 90 chars
        while len(line) > 95:
            cut = line.rfind(' ', 0, 95)
            if cut < 50: cut = 95
            text_obj.textLine(line[:cut])
            line = line[cut:].lstrip()
        text_obj.textLine(line)
    pdf.drawText(text_obj)

    sig = c.get('signature') or {}
    if sig:
        pdf.line(0.75*inch, 2.0*inch, w-0.75*inch, 2.0*inch)
        pdf.setFont('Helvetica-Bold', 9)
        pdf.drawString(0.75*inch, 1.85*inch, 'SIGNED')
        pdf.setFont('Helvetica', 9)
        pdf.drawString(0.75*inch, 1.65*inch, f"Signatory (typed): {sig.get('typed_name', '')}")
        pdf.drawString(0.75*inch, 1.50*inch, f"Signed at: {sig.get('signed_at', '')}")
        pdf.drawString(0.75*inch, 1.35*inch, f"IP: {sig.get('ip', '')}")
        pdf.drawString(0.75*inch, 1.20*inch, f"User-Agent: {(sig.get('ua') or '')[:90]}")
        # canvas signature
        try:
            data_url = sig.get('canvas_data_url') or ''
            if data_url.startswith('data:image'):
                _, b64 = data_url.split(',', 1)
                img = ImageReader(io.BytesIO(base64.b64decode(b64)))
                pdf.drawImage(img, 4.5*inch, 1.10*inch, width=2.5*inch, height=0.9*inch, mask='auto')
        except Exception:
            pass
    pdf.setFont('Helvetica', 7)
    pdf.drawString(0.75*inch, 0.5*inch, 'PROOF\u2122 \u00b7 EDITION 2026.01 \u00b7 NEW YORK \u00b7 LONDON')
    pdf.showPage()
    pdf.save()
    return buf.getvalue()


# ============ MOCK EMAIL OUTBOX ============
@router.get('/outbox')
async def email_outbox(user: dict = Depends(require_cap('manage_invites'))):
    items = await db.email_outbox.find().sort('created_at', -1).to_list(200)
    return [serialize_doc(i) for i in items]
