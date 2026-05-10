from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional
import secrets
from datetime import datetime, timezone, timedelta
from db import db
from auth import (
    hash_password, verify_password, issue_token, get_current_user, optional_user,
    STAFF_ROLES, MEMBER_ROLES,
)
from models import LoginRequest, LoginResponse, ClaimOwnerRequest, PasswordResetRequest, ROLES
from utils import write_audit, write_analytics, serialize_doc

router = APIRouter(prefix='/auth', tags=['auth'])


@router.get('/setup-status')
async def setup_status():
    owner = await db.profiles.find_one({'role': 'owner'})
    user_count = await db.profiles.count_documents({})
    return {'owner_exists': bool(owner), 'user_count': user_count}


@router.post('/claim-owner', response_model=LoginResponse)
async def claim_owner(req: ClaimOwnerRequest):
    existing_owner = await db.profiles.find_one({'role': 'owner'})
    if existing_owner:
        raise HTTPException(status_code=409, detail='owner already claimed')

    email_taken = await db.profiles.find_one({'email': req.email.lower()})
    if email_taken:
        raise HTTPException(status_code=409, detail='email already in use')

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail='password must be at least 8 characters')

    profile = {
        'id': secrets.token_hex(12),
        'email': req.email.lower(),
        'name': req.name,
        'phone': None,
        'role': 'owner',
        'status': 'active',
        'password_hash': hash_password(req.password),
        'avatar_url': None,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'last_login': datetime.now(timezone.utc).isoformat(),
        'session_version': 0,
    }
    await db.profiles.insert_one(profile)
    await write_audit(profile, 'create', 'profile', profile['id'], None, {'role': 'owner', 'email': profile['email']})
    token = issue_token(profile)
    safe = serialize_doc({k: v for k, v in profile.items() if k != 'password_hash'})
    return {'access_token': token, 'token_type': 'bearer', 'user': safe}


@router.post('/login', response_model=LoginResponse)
async def login(req: LoginRequest):
    user = await db.profiles.find_one({'email': req.email.lower()})
    if not user or not user.get('password_hash'):
        raise HTTPException(status_code=401, detail='invalid credentials')
    if not verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='invalid credentials')
    if user.get('status') == 'suspended':
        raise HTTPException(status_code=403, detail='account suspended')
    if user.get('status') == 'pending':
        raise HTTPException(status_code=403, detail='account pending invitation acceptance')

    await db.profiles.update_one({'id': user['id']}, {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}})
    user['last_login'] = datetime.now(timezone.utc).isoformat()
    token = issue_token(user)
    await write_audit(user, 'login', 'profile', user['id'])
    await write_analytics('portal_login' if user['role'] in MEMBER_ROLES else 'admin_login', user)
    safe = serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})
    return {'access_token': token, 'token_type': 'bearer', 'user': safe}


@router.post('/logout')
async def logout(user: dict = Depends(get_current_user)):
    await write_audit(user, 'logout', 'profile', user['id'])
    return {'ok': True}


@router.post('/sign-out-all')
async def sign_out_all(user: dict = Depends(get_current_user)):
    new_sv = (user.get('session_version', 0) or 0) + 1
    await db.profiles.update_one({'id': user['id']}, {'$set': {'session_version': new_sv}})
    await write_audit(user, 'sign_out_all', 'profile', user['id'])
    return {'ok': True, 'session_version': new_sv}


@router.get('/me')
async def me(user: dict = Depends(get_current_user)):
    safe = serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})
    return safe


@router.post('/password-reset')
async def password_reset(req: PasswordResetRequest, user: dict = Depends(get_current_user)):
    if not verify_password(req.current_password, user['password_hash']):
        raise HTTPException(status_code=400, detail='current password incorrect')
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail='password must be at least 8 characters')
    new_sv = (user.get('session_version', 0) or 0) + 1
    await db.profiles.update_one({'id': user['id']}, {'$set': {
        'password_hash': hash_password(req.new_password),
        'session_version': new_sv,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    await write_audit(user, 'password_reset', 'profile', user['id'])
    # re-issue token with new sv
    user['session_version'] = new_sv
    token = issue_token(user)
    return {'ok': True, 'access_token': token}


@router.get('/invites/{token}')
async def get_invite_by_token(token: str):
    inv = await db.invites.find_one({'token': token}, {'_id': 0})
    if not inv:
        raise HTTPException(status_code=404, detail='invalid invite')
    if inv['status'] != 'pending':
        raise HTTPException(status_code=410, detail=f"invite {inv['status']}")
    exp = inv['expires_at']
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp < datetime.now(timezone.utc):
        await db.invites.update_one({'id': inv['id']}, {'$set': {'status': 'expired'}})
        raise HTTPException(status_code=410, detail='invite expired')
    return {'email': inv['email'], 'name': inv['name'], 'role': inv['role']}


@router.post('/invites/{token}/accept', response_model=LoginResponse)
async def accept_invite(token: str, password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail='password must be at least 8 characters')
    inv = await db.invites.find_one({'token': token})
    if not inv or inv['status'] != 'pending':
        raise HTTPException(status_code=410, detail='invalid or used invite')
    exp = inv['expires_at']
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail='invite expired')

    # Create profile or activate existing pending profile
    existing = await db.profiles.find_one({'email': inv['email']})
    if existing:
        await db.profiles.update_one({'id': existing['id']}, {'$set': {
            'password_hash': hash_password(password),
            'status': 'active',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }})
        profile = await db.profiles.find_one({'id': existing['id']})
    else:
        profile = {
            'id': secrets.token_hex(12),
            'email': inv['email'],
            'name': inv['name'],
            'role': inv['role'],
            'status': 'active',
            'password_hash': hash_password(password),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'session_version': 0,
            'last_login': datetime.now(timezone.utc).isoformat(),
            'phone': None,
            'avatar_url': None,
        }
        await db.profiles.insert_one(profile)

    # Link to athletes if present
    for aid in inv.get('athlete_ids') or []:
        await db.athlete_members.insert_one({
            'id': secrets.token_hex(12),
            'athlete_id': aid,
            'profile_id': profile['id'],
            'relation': profile['role'],
            'created_at': datetime.now(timezone.utc).isoformat(),
        })

    await db.invites.update_one({'id': inv['id']}, {'$set': {'status': 'accepted'}})
    await write_audit(profile, 'accept_invite', 'invite', inv['id'])
    token_out = issue_token(profile)
    safe = serialize_doc({k: v for k, v in profile.items() if k != 'password_hash'})
    return {'access_token': token_out, 'token_type': 'bearer', 'user': safe}
