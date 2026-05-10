from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from typing import List, Optional
from datetime import datetime, timezone
import secrets
from pathlib import Path
from db import db, UPLOAD_DIR
from auth import (
    get_current_user, require_cap, optional_user, has_cap,
    STAFF_ROLES, MEMBER_ROLES,
)
from utils import (
    write_audit, write_analytics, serialize_doc, sign_url, verify_signed_token,
    build_ics, slugify, prepare_for_mongo, diff_dicts,
)

router = APIRouter(prefix='/ops', tags=['ops'])


# ============ ATHLETES ============
@router.get('/athletes')
async def list_athletes(user: Optional[dict] = Depends(optional_user)):
    items = await db.athletes.find().sort('name', 1).to_list(500)
    out = []
    for a in items:
        out.append(serialize_doc(a))
    return out


@router.get('/athletes/by-slug/{slug}')
async def get_athlete_by_slug(slug: str, user: Optional[dict] = Depends(optional_user)):
    a = await db.athletes.find_one({'slug': slug})
    if not a:
        raise HTTPException(404, 'not found')
    return serialize_doc(a)


@router.post('/athletes')
async def create_athlete(payload: dict, user: dict = Depends(require_cap('manage_roster'))):
    name = payload.get('name', '').strip()
    if not name:
        raise HTTPException(400, 'name required')
    slug = slugify(payload.get('slug') or name)
    if await db.athletes.find_one({'slug': slug}):
        slug = f"{slug}-{secrets.token_hex(2)}"
    a = {
        'id': secrets.token_hex(12),
        'slug': slug,
        'name': name,
        'sport': payload.get('sport', ''),
        'position': payload.get('position'),
        'team': payload.get('team'),
        'status': payload.get('status') or 'active',
        'primary_strategist_id': payload.get('primary_strategist_id'),
        'headline': payload.get('headline'),
        'pull_quote': payload.get('pull_quote'),
        'tenure_year': payload.get('tenure_year'),
        'photo_url': payload.get('photo_url'),
        'signed_date': payload.get('signed_date'),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.athletes.insert_one(a)
    await write_audit(user, 'create', 'athlete', a['id'], None, serialize_doc(a))
    return serialize_doc(a)


@router.patch('/athletes/{athlete_id}')
async def update_athlete(athlete_id: str, payload: dict, user: dict = Depends(require_cap('manage_roster'))):
    before = await db.athletes.find_one({'id': athlete_id})
    if not before:
        raise HTTPException(404, 'not found')
    fields = ['name', 'slug', 'sport', 'position', 'team', 'status', 'primary_strategist_id',
              'headline', 'pull_quote', 'tenure_year', 'photo_url', 'signed_date']
    updates = {f: payload[f] for f in fields if f in payload}
    if 'slug' in updates:
        updates['slug'] = slugify(updates['slug']) or before['slug']
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.athletes.update_one({'id': athlete_id}, {'$set': updates})
    after = await db.athletes.find_one({'id': athlete_id})
    await write_audit(user, 'update', 'athlete', athlete_id, serialize_doc(before), serialize_doc(after),
                      {'diff': diff_dicts(serialize_doc(before), serialize_doc(after))})
    return serialize_doc(after)


@router.delete('/athletes/{athlete_id}')
async def delete_athlete(athlete_id: str, user: dict = Depends(require_cap('manage_roster'))):
    a = await db.athletes.find_one({'id': athlete_id})
    if not a:
        raise HTTPException(404, 'not found')
    await db.athletes.delete_one({'id': athlete_id})
    await db.athlete_members.delete_many({'athlete_id': athlete_id})
    await write_audit(user, 'delete', 'athlete', athlete_id, serialize_doc(a))
    return {'ok': True}


@router.get('/athletes/{athlete_id}/members')
async def list_athlete_members(athlete_id: str, user: dict = Depends(require_cap('manage_roster'))):
    links = await db.athlete_members.find({'athlete_id': athlete_id}).to_list(200)
    out = []
    for link in links:
        prof = await db.profiles.find_one({'id': link['profile_id']}, {'_id': 0, 'password_hash': 0})
        out.append({**serialize_doc(link), 'profile': serialize_doc(prof)})
    return out


@router.post('/athletes/{athlete_id}/members')
async def add_athlete_member(athlete_id: str, payload: dict, user: dict = Depends(require_cap('manage_roster'))):
    profile_id = payload.get('profile_id')
    relation = payload.get('relation') or 'family'
    if not profile_id:
        raise HTTPException(400, 'profile_id required')
    if not await db.profiles.find_one({'id': profile_id}):
        raise HTTPException(404, 'profile not found')
    if not await db.athletes.find_one({'id': athlete_id}):
        raise HTTPException(404, 'athlete not found')
    link = {
        'id': secrets.token_hex(12),
        'athlete_id': athlete_id,
        'profile_id': profile_id,
        'relation': relation,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.athlete_members.insert_one(link)
    await write_audit(user, 'create', 'athlete_member', link['id'], None, link)
    return serialize_doc(link)


@router.delete('/athlete-members/{link_id}')
async def remove_athlete_member(link_id: str, user: dict = Depends(require_cap('manage_roster'))):
    link = await db.athlete_members.find_one({'id': link_id})
    if not link:
        raise HTTPException(404, 'not found')
    await db.athlete_members.delete_one({'id': link_id})
    await write_audit(user, 'delete', 'athlete_member', link_id, serialize_doc(link))
    return {'ok': True}


# ============ DOCUMENTS ============
async def _user_athlete_ids(user: dict) -> List[str]:
    if user['role'] in STAFF_ROLES:
        return None  # all
    links = await db.athlete_members.find({'profile_id': user['id']}).to_list(200)
    return [l['athlete_id'] for l in links]


@router.get('/documents')
async def list_documents(athlete_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {}
    if athlete_id:
        q['athlete_id'] = athlete_id
    if user['role'] in MEMBER_ROLES:
        ids = await _user_athlete_ids(user)
        q['athlete_id'] = {'$in': ids or []}
        # only member-visible docs
        q['visibility'] = {'$in': ['public', 'member']}
    items = await db.documents.find(q).sort('created_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post('/documents')
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    athlete_id: Optional[str] = Form(None),
    visibility: str = Form('member'),
    user: dict = Depends(require_cap('manage_documents')),
):
    fid = secrets.token_hex(12)
    ext = (Path(file.filename).suffix or '.bin').lower()
    safe_name = f"{fid}{ext}"
    docs_dir = UPLOAD_DIR / 'documents'
    docs_dir.mkdir(exist_ok=True)
    full_path = docs_dir / safe_name
    content = await file.read()
    with open(full_path, 'wb') as f:
        f.write(content)
    doc = {
        'id': fid,
        'athlete_id': athlete_id,
        'title': title,
        'filename': file.filename,
        'storage_path': safe_name,
        'mime': file.content_type or 'application/octet-stream',
        'size': len(content),
        'visibility': visibility,
        'uploader_id': user['id'],
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.documents.insert_one(doc)
    await write_audit(user, 'create', 'document', fid, None, serialize_doc(doc))
    return serialize_doc(doc)


@router.get('/documents/{doc_id}/signed-url')
async def get_signed_url(doc_id: str, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({'id': doc_id})
    if not doc:
        raise HTTPException(404, 'not found')
    if user['role'] in MEMBER_ROLES:
        ids = await _user_athlete_ids(user) or []
        if doc.get('athlete_id') not in ids:
            raise HTTPException(403, 'forbidden')
        if doc.get('visibility') not in ('public', 'member'):
            raise HTTPException(403, 'forbidden')
    token = sign_url({'doc_id': doc_id, 'uid': user['id']}, expires_in_seconds=600)
    await write_audit(user, 'sign_url', 'document', doc_id)
    return {'url': f"/api/ops/documents/{doc_id}/download?token={token}", 'expires_in': 600}


@router.get('/documents/{doc_id}/download')
async def download_document(doc_id: str, token: str):
    payload = verify_signed_token(token)
    if not payload or payload.get('doc_id') != doc_id:
        raise HTTPException(401, 'invalid token')
    doc = await db.documents.find_one({'id': doc_id})
    if not doc:
        raise HTTPException(404, 'not found')
    user = await db.profiles.find_one({'id': payload.get('uid')}, {'_id': 0, 'password_hash': 0})
    full_path = UPLOAD_DIR / 'documents' / doc['storage_path']
    if not full_path.exists():
        raise HTTPException(404, 'file missing')
    await write_audit(user, 'download', 'document', doc_id)
    await write_analytics('doc_download', user, {'doc_id': doc_id})
    return FileResponse(full_path, filename=doc['filename'], media_type=doc['mime'])


@router.delete('/documents/{doc_id}')
async def delete_document(doc_id: str, user: dict = Depends(require_cap('manage_documents'))):
    doc = await db.documents.find_one({'id': doc_id})
    if not doc:
        raise HTTPException(404, 'not found')
    full_path = UPLOAD_DIR / 'documents' / doc['storage_path']
    if full_path.exists():
        try:
            full_path.unlink()
        except Exception:
            pass
    await db.documents.delete_one({'id': doc_id})
    await write_audit(user, 'delete', 'document', doc_id, serialize_doc(doc))
    return {'ok': True}


# ============ EVENTS ============
@router.get('/events')
async def list_events(athlete_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {}
    if athlete_id:
        q['athlete_id'] = athlete_id
    if user['role'] in MEMBER_ROLES:
        ids = await _user_athlete_ids(user) or []
        q['$or'] = [{'athlete_id': {'$in': ids}}, {'athlete_id': None}]
        q['visibility'] = {'$in': ['public', 'member']}
    items = await db.events.find(q).sort('start', 1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post('/events')
async def create_event(payload: dict, user: dict = Depends(require_cap('manage_documents'))):
    start = payload.get('start')
    if not start:
        raise HTTPException(400, 'start required')
    e = {
        'id': secrets.token_hex(12),
        'athlete_id': payload.get('athlete_id'),
        'title': payload.get('title') or 'Event',
        'location': payload.get('location'),
        'description': payload.get('description'),
        'start': start,
        'end': payload.get('end'),
        'visibility': payload.get('visibility') or 'member',
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.events.insert_one(e)
    await write_audit(user, 'create', 'event', e['id'], None, serialize_doc(e))
    return serialize_doc(e)


@router.patch('/events/{event_id}')
async def update_event(event_id: str, payload: dict, user: dict = Depends(require_cap('manage_documents'))):
    before = await db.events.find_one({'id': event_id})
    if not before:
        raise HTTPException(404, 'not found')
    fields = ['athlete_id', 'title', 'location', 'description', 'start', 'end', 'visibility']
    updates = {f: payload[f] for f in fields if f in payload}
    await db.events.update_one({'id': event_id}, {'$set': updates})
    after = await db.events.find_one({'id': event_id})
    await write_audit(user, 'update', 'event', event_id, serialize_doc(before), serialize_doc(after))
    return serialize_doc(after)


@router.delete('/events/{event_id}')
async def delete_event(event_id: str, user: dict = Depends(require_cap('manage_documents'))):
    e = await db.events.find_one({'id': event_id})
    if not e:
        raise HTTPException(404, 'not found')
    await db.events.delete_one({'id': event_id})
    await write_audit(user, 'delete', 'event', event_id, serialize_doc(e))
    return {'ok': True}


@router.get('/events.ics')
async def export_ics(user: dict = Depends(get_current_user)):
    q = {}
    if user['role'] in MEMBER_ROLES:
        ids = await _user_athlete_ids(user) or []
        q['$or'] = [{'athlete_id': {'$in': ids}}, {'athlete_id': None}]
        q['visibility'] = {'$in': ['public', 'member']}
    items = await db.events.find(q).sort('start', 1).to_list(500)
    items = [serialize_doc(i) for i in items]
    body = build_ics(items)
    return Response(content=body, media_type='text/calendar', headers={
        'Content-Disposition': 'attachment; filename=proof-calendar.ics'
    })


# ============ ANNOUNCEMENTS ============
@router.get('/announcements')
async def list_announcements(user: dict = Depends(get_current_user)):
    q = {}
    if user['role'] in MEMBER_ROLES:
        ids = await _user_athlete_ids(user) or []
        q['$or'] = [
            {'audience': 'all'},
            {'audience': 'members'},
            {'audience': 'athlete', 'athlete_id': {'$in': ids}},
        ]
    items = await db.announcements.find(q).sort('published_at', -1).to_list(200)
    return [serialize_doc(i) for i in items]


@router.post('/announcements')
async def create_announcement(payload: dict, user: dict = Depends(require_cap('send_announcements'))):
    a = {
        'id': secrets.token_hex(12),
        'title': payload.get('title') or 'Announcement',
        'body': payload.get('body') or '',
        'audience': payload.get('audience') or 'members',
        'athlete_id': payload.get('athlete_id'),
        'author_id': user['id'],
        'published_at': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.announcements.insert_one(a)
    await write_audit(user, 'create', 'announcement', a['id'], None, serialize_doc(a))
    return serialize_doc(a)


@router.delete('/announcements/{ann_id}')
async def delete_announcement(ann_id: str, user: dict = Depends(require_cap('send_announcements'))):
    a = await db.announcements.find_one({'id': ann_id})
    if not a:
        raise HTTPException(404, 'not found')
    await db.announcements.delete_one({'id': ann_id})
    await write_audit(user, 'delete', 'announcement', ann_id, serialize_doc(a))
    return {'ok': True}


# ============ MESSAGES ============
@router.get('/threads')
async def list_threads(user: dict = Depends(get_current_user)):
    if user['role'] in MEMBER_ROLES:
        q = {'member_id': user['id']}
    else:
        q = {'$or': [{'strategist_id': user['id']}, {'member_id': user['id']}]}
        if user['role'] in {'owner', 'admin'}:
            q = {}
    items = await db.message_threads.find(q).sort('last_message_at', -1).to_list(200)
    out = []
    for t in items:
        member = await db.profiles.find_one({'id': t['member_id']}, {'_id': 0, 'password_hash': 0})
        strategist = await db.profiles.find_one({'id': t['strategist_id']}, {'_id': 0, 'password_hash': 0})
        unread = await db.messages.count_documents({
            'thread_id': t['id'],
            'sender_id': {'$ne': user['id']},
            'read_by': {'$ne': user['id']},
        })
        out.append({**serialize_doc(t),
                    'member': serialize_doc(member),
                    'strategist': serialize_doc(strategist),
                    'unread_count': unread})
    return out


@router.post('/threads')
async def create_thread(payload: dict, user: dict = Depends(get_current_user)):
    subject = payload.get('subject') or 'New message'
    if user['role'] in MEMBER_ROLES:
        # auto-route to assigned strategist for the user's first athlete
        link = await db.athlete_members.find_one({'profile_id': user['id']})
        if not link:
            raise HTTPException(400, 'no athlete linked')
        athlete = await db.athletes.find_one({'id': link['athlete_id']})
        strategist_id = (athlete or {}).get('primary_strategist_id')
        if not strategist_id:
            # fallback: any strategist
            strat = await db.profiles.find_one({'role': 'strategist'})
            strategist_id = strat['id'] if strat else None
        member_id = user['id']
        athlete_id = link['athlete_id']
    else:
        strategist_id = user['id']
        member_id = payload.get('member_id')
        athlete_id = payload.get('athlete_id')
        if not member_id:
            raise HTTPException(400, 'member_id required')
    if not strategist_id:
        raise HTTPException(400, 'no strategist assigned')
    t = {
        'id': secrets.token_hex(12),
        'subject': subject,
        'member_id': member_id,
        'strategist_id': strategist_id,
        'athlete_id': athlete_id,
        'last_message_at': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.message_threads.insert_one(t)
    return serialize_doc(t)


@router.get('/threads/{thread_id}/messages')
async def list_messages(thread_id: str, user: dict = Depends(get_current_user)):
    t = await db.message_threads.find_one({'id': thread_id})
    if not t:
        raise HTTPException(404, 'not found')
    if user['role'] in MEMBER_ROLES and t['member_id'] != user['id']:
        raise HTTPException(403, 'forbidden')
    if user['role'] in STAFF_ROLES and user['role'] not in {'owner', 'admin'} and t['strategist_id'] != user['id']:
        raise HTTPException(403, 'forbidden')
    items = await db.messages.find({'thread_id': thread_id}).sort('created_at', 1).to_list(2000)
    # mark as read for this viewer
    await db.messages.update_many(
        {'thread_id': thread_id, 'sender_id': {'$ne': user['id']}, 'read_by': {'$ne': user['id']}},
        {'$addToSet': {'read_by': user['id']}}
    )
    return [serialize_doc(m) for m in items]


@router.post('/threads/{thread_id}/messages')
async def send_message(thread_id: str, payload: dict, user: dict = Depends(get_current_user)):
    t = await db.message_threads.find_one({'id': thread_id})
    if not t:
        raise HTTPException(404, 'not found')
    if user['id'] not in (t['member_id'], t['strategist_id']) and user['role'] not in {'owner', 'admin'}:
        raise HTTPException(403, 'forbidden')
    body = (payload.get('body') or '').strip()
    if not body:
        raise HTTPException(400, 'empty message')
    msg = {
        'id': secrets.token_hex(12),
        'thread_id': thread_id,
        'sender_id': user['id'],
        'body': body,
        'read_by': [user['id']],
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    await db.message_threads.update_one({'id': thread_id}, {'$set': {'last_message_at': msg['created_at']}})
    return serialize_doc(msg)


# ============ INQUIRIES (public contact form) ============
@router.post('/inquiries')
async def submit_inquiry(payload: dict):
    inq = {
        'id': secrets.token_hex(12),
        'first_name': payload.get('first_name', '').strip(),
        'last_name': payload.get('last_name', '').strip(),
        'email': payload.get('email', '').strip().lower(),
        'inquiring_as': payload.get('inquiring_as'),
        'message': payload.get('message', '').strip(),
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    if not inq['email'] or not inq['message']:
        raise HTTPException(400, 'email and message required')
    await db.inquiries.insert_one(inq)
    await write_analytics('inquiry', None, {'email': inq['email']})
    return {'ok': True, 'id': inq['id']}


@router.get('/inquiries')
async def list_inquiries(user: dict = Depends(require_cap('manage_members'))):
    items = await db.inquiries.find().sort('created_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


# ============ TODAY (member home) ============
@router.get('/portal/today')
async def portal_today(user: dict = Depends(get_current_user)):
    if user['role'] not in MEMBER_ROLES:
        raise HTTPException(403, 'member only')
    ids = await _user_athlete_ids(user) or []
    now_iso = datetime.now(timezone.utc).isoformat()
    next_event = await db.events.find_one(
        {'$or': [{'athlete_id': {'$in': ids}}, {'athlete_id': None}], 'start': {'$gte': now_iso}},
        sort=[('start', 1)]
    )
    doc_count = await db.documents.count_documents({'athlete_id': {'$in': ids}, 'visibility': {'$in': ['public', 'member']}})
    unread_pipeline = await db.message_threads.find({'member_id': user['id']}).to_list(50)
    unread = 0
    for t in unread_pipeline:
        unread += await db.messages.count_documents({
            'thread_id': t['id'],
            'sender_id': {'$ne': user['id']},
            'read_by': {'$ne': user['id']},
        })
    week_end = (datetime.now(timezone.utc) + __import__('datetime').timedelta(days=7)).isoformat()
    week_events = await db.events.find({
        '$or': [{'athlete_id': {'$in': ids}}, {'athlete_id': None}],
        'start': {'$gte': now_iso, '$lte': week_end}
    }).sort('start', 1).to_list(50)
    news = await db.announcements.find({
        '$or': [
            {'audience': 'all'},
            {'audience': 'members'},
            {'audience': 'athlete', 'athlete_id': {'$in': ids}},
        ]
    }).sort('published_at', -1).limit(5).to_list(5)
    return {
        'next_event': serialize_doc(next_event),
        'doc_count': doc_count,
        'unread_count': unread,
        'week_events': [serialize_doc(e) for e in week_events],
        'news': [serialize_doc(a) for a in news],
    }
