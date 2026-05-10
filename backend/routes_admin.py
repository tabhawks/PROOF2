from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import secrets
from db import db
from auth import get_current_user, require_cap, STAFF_ROLES, MEMBER_ROLES, hash_password
from models import UserCreate, UserUpdate, ROLES
from utils import write_audit, serialize_doc, diff_dicts, prepare_for_mongo

router = APIRouter(prefix='/admin', tags=['admin'])


# ---------- Users ----------
@router.get('/users')
async def list_users(
    role_class: Optional[str] = Query(None, description='staff|member|all'),
    user: dict = Depends(get_current_user),
):
    if user['role'] not in STAFF_ROLES:
        raise HTTPException(403, 'forbidden')
    q = {}
    if role_class == 'staff':
        q = {'role': {'$in': list(STAFF_ROLES)}}
    elif role_class == 'member':
        q = {'role': {'$in': list(MEMBER_ROLES)}}
    items = await db.profiles.find(q).to_list(2000)
    return [serialize_doc({k: v for k, v in i.items() if k != 'password_hash'}) for i in items]


@router.patch('/users/{user_id}')
async def update_user(user_id: str, payload: UserUpdate, actor: dict = Depends(get_current_user)):
    target = await db.profiles.find_one({'id': user_id})
    if not target:
        raise HTTPException(404, 'user not found')

    is_staff_target = target['role'] in STAFF_ROLES
    if is_staff_target and actor['role'] != 'owner':
        # only owner can mutate staff accounts beyond status
        if payload.role and payload.role != target['role']:
            raise HTTPException(403, 'only owner can change staff role')
    if target['role'] == 'owner' and actor['role'] != 'owner':
        raise HTTPException(403, 'cannot modify owner')
    if actor['role'] not in {'owner', 'admin'}:
        raise HTTPException(403, 'forbidden')

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if 'role' in updates and updates['role'] not in ROLES:
        raise HTTPException(400, 'invalid role')
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    before = serialize_doc({k: v for k, v in target.items() if k != 'password_hash'})
    await db.profiles.update_one({'id': user_id}, {'$set': updates})
    after_doc = await db.profiles.find_one({'id': user_id})
    after = serialize_doc({k: v for k, v in after_doc.items() if k != 'password_hash'})
    await write_audit(actor, 'update', 'profile', user_id, before, after, {'diff': diff_dicts(before, after)})
    return after


@router.delete('/users/{user_id}')
async def delete_user(user_id: str, actor: dict = Depends(get_current_user)):
    if actor['role'] not in {'owner', 'admin'}:
        raise HTTPException(403, 'forbidden')
    target = await db.profiles.find_one({'id': user_id})
    if not target:
        raise HTTPException(404, 'user not found')
    if target['role'] == 'owner':
        raise HTTPException(403, 'cannot delete owner')
    await db.profiles.delete_one({'id': user_id})
    await db.athlete_members.delete_many({'profile_id': user_id})
    await write_audit(actor, 'delete', 'profile', user_id, serialize_doc({k: v for k, v in target.items() if k != 'password_hash'}))
    return {'ok': True}


# ---------- Invites ----------
@router.get('/invites')
async def list_invites(actor: dict = Depends(require_cap('manage_invites'))):
    items = await db.invites.find().sort('created_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post('/invites')
async def create_invite(payload: dict, actor: dict = Depends(require_cap('manage_invites'))):
    email = payload.get('email', '').lower().strip()
    name = payload.get('name', '').strip()
    role = payload.get('role')
    athlete_ids = payload.get('athlete_ids') or []
    if not email or not name or role not in ROLES:
        raise HTTPException(400, 'email, name, role required')
    if role in STAFF_ROLES and actor['role'] != 'owner' and role in {'owner', 'admin'}:
        raise HTTPException(403, 'only owner can invite owner/admin')
    existing = await db.profiles.find_one({'email': email})
    if existing:
        raise HTTPException(409, 'email already has an account')
    open_invite = await db.invites.find_one({'email': email, 'status': 'pending'})
    if open_invite:
        raise HTTPException(409, 'invite already pending for this email')

    invite = {
        'id': secrets.token_hex(12),
        'email': email,
        'name': name,
        'role': role,
        'token': secrets.token_urlsafe(24),
        'inviter_id': actor['id'],
        'athlete_ids': athlete_ids,
        'status': 'pending',
        'expires_at': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.invites.insert_one(invite)
    await write_audit(actor, 'create', 'invite', invite['id'], None, serialize_doc(invite))
    # Mock email: log to outbox so admins can see what would have been sent
    await _outbox_invite_email(invite, actor)
    return serialize_doc(invite)


@router.post('/invites/{invite_id}/resend')
async def resend_invite(invite_id: str, actor: dict = Depends(require_cap('manage_invites'))):
    inv = await db.invites.find_one({'id': invite_id})
    if not inv:
        raise HTTPException(404, 'not found')
    new_token = secrets.token_urlsafe(24)
    await db.invites.update_one({'id': invite_id}, {'$set': {
        'token': new_token,
        'status': 'pending',
        'expires_at': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }})
    await write_audit(actor, 'resend', 'invite', invite_id)
    await _outbox_invite_email({**inv, 'token': new_token}, actor, resend=True)
    return {'ok': True, 'token': new_token}


@router.post('/invites/{invite_id}/revoke')
async def revoke_invite(invite_id: str, actor: dict = Depends(require_cap('manage_invites'))):
    res = await db.invites.update_one({'id': invite_id, 'status': 'pending'}, {'$set': {'status': 'revoked'}})
    if res.matched_count == 0:
        raise HTTPException(404, 'pending invite not found')
    await write_audit(actor, 'revoke', 'invite', invite_id)
    return {'ok': True}


# ---------- Audit log ----------
@router.get('/audit')
async def list_audit(
    actor_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 200,
    user: dict = Depends(require_cap('view_audit')),
):
    q = {}
    if actor_id:
        q['actor_id'] = actor_id
    if resource_type:
        q['resource_type'] = resource_type
    if action:
        q['action'] = action
    items = await db.audit_log.find(q).sort('created_at', -1).to_list(min(limit, 500))
    return [serialize_doc(i) for i in items]


# ---------- Analytics ----------
@router.get('/analytics/summary')
async def analytics_summary(user: dict = Depends(require_cap('view_analytics'))):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    pipeline = [
        {'$match': {'created_at': {'$gte': cutoff}}},
        {'$group': {'_id': '$name', 'count': {'$sum': 1}}},
    ]
    rows = await db.analytics_events.aggregate(pipeline).to_list(100)
    by_name = {r['_id']: r['count'] for r in rows}

    # daily series for the last 7 days
    daily_pipeline = [
        {'$match': {'created_at': {'$gte': cutoff}}},
        {'$project': {'name': 1, 'day': {'$substrCP': ['$created_at', 0, 10]}}},
        {'$group': {'_id': {'name': '$name', 'day': '$day'}, 'count': {'$sum': 1}}},
    ]
    daily = await db.analytics_events.aggregate(daily_pipeline).to_list(1000)

    return {
        'rolling_7d': {
            'sessions': by_name.get('session', 0),
            'portal_logins': by_name.get('portal_login', 0),
            'admin_logins': by_name.get('admin_login', 0),
            'content_edits': by_name.get('content_edit', 0),
            'doc_downloads': by_name.get('doc_download', 0),
            'inquiries': by_name.get('inquiry', 0),
            'page_views': by_name.get('page_view', 0),
        },
        'daily': daily,
    }


# ---------- Settings ----------
@router.get('/settings')
async def get_settings(user: dict = Depends(require_cap('manage_settings'))):
    s = await db.settings.find_one({'id': 'singleton'}, {'_id': 0})
    if not s:
        from models import Settings
        default = Settings().model_dump()
        default['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.settings.insert_one(default)
        s = default
    return serialize_doc(s)


@router.patch('/settings')
async def update_settings(payload: dict, user: dict = Depends(require_cap('manage_settings'))):
    payload['updated_at'] = datetime.now(timezone.utc).isoformat()
    before = await db.settings.find_one({'id': 'singleton'}, {'_id': 0})
    await db.settings.update_one({'id': 'singleton'}, {'$set': payload}, upsert=True)
    after = await db.settings.find_one({'id': 'singleton'}, {'_id': 0})
    await write_audit(user, 'update', 'settings', 'singleton', serialize_doc(before), serialize_doc(after))
    return serialize_doc(after)


# ---------- Mock email outbox helper ----------
import logging
_emaillog = logging.getLogger('proof.email')


async def _outbox_invite_email(invite: dict, actor: Optional[dict], resend: bool = False):
    """Mock email \u2014 persist to outbox + log to backend stdout."""
    accept_url = f"/onboarding?invite={invite['token']}"
    body = (
        f"You have been invited to PROOF as {invite['role']}.\n\n"
        f"Accept your invitation:\n{accept_url}\n\n"
        f"This invitation expires in 7 days.\n"
    )
    entry = {
        'id': secrets.token_hex(12),
        'kind': 'invite_resend' if resend else 'invite',
        'to_email': invite['email'],
        'to_name': invite['name'],
        'subject': ('PROOF \u2014 your invitation' + (' (resend)' if resend else '')),
        'body': body,
        'cta_url': accept_url,
        'token': invite['token'],
        'invite_id': invite['id'],
        'sent_by': actor['email'] if actor else None,
        'status': 'queued',  # mock \u2014 never actually sent\n
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.email_outbox.insert_one(entry)
    _emaillog.info(f"[MOCK EMAIL] To: {entry['to_email']} | Subject: {entry['subject']} | Link: {accept_url}")


# ---------- Public site settings (read) ----------
@router.get('/public-settings')
async def public_settings():
    s = await db.settings.find_one({'id': 'singleton'}, {'_id': 0})
    if not s:
        return {'site_title': 'PROOF', 'site_tagline': 'Private Athlete Management',
                'edition_meta': 'PROOF\u2122 \u00b7 EDITION 2026.01 \u00b7 NEW YORK \u00b7 LONDON',
                'contact_email': 'private@prooffirm.com'}
    return {
        'site_title': s.get('site_title'),
        'site_tagline': s.get('site_tagline'),
        'site_seo_title': s.get('site_seo_title'),
        'site_seo_description': s.get('site_seo_description'),
        'edition_meta': s.get('edition_meta'),
        'contact_email': s.get('contact_email'),
    }
