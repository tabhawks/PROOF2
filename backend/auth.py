import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import db

JWT_SECRET = os.environ.get('JWT_SECRET', 'proof-dev-secret-change-me-' + secrets.token_hex(8))
JWT_ALGO = 'HS256'
JWT_EXP_MINUTES = 60 * 24 * 7  # 7 days

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def issue_token(profile: dict) -> str:
    payload = {
        'sub': profile['id'],
        'email': profile['email'],
        'role': profile['role'],
        'sv': profile.get('session_version', 0),
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail='not authenticated')
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='token expired')
    except Exception:
        raise HTTPException(status_code=401, detail='invalid token')

    user = await db.profiles.find_one({'id': payload['sub']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail='user not found')
    if user.get('status') == 'suspended':
        raise HTTPException(status_code=403, detail='account suspended')
    if user.get('session_version', 0) != payload.get('sv', 0):
        raise HTTPException(status_code=401, detail='session invalidated')
    return user


async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.profiles.find_one({'id': payload['sub']}, {'_id': 0})
        return user
    except Exception:
        return None


# Role/capability helpers
STAFF_ROLES = {'owner', 'admin', 'editor', 'strategist', 'operations', 'read_only'}
MEMBER_ROLES = {'athlete', 'family', 'agent', 'counsel'}

CAPABILITIES = {
    'manage_staff': {'owner'},
    'manage_members': {'owner', 'admin'},
    'edit_content': {'owner', 'admin', 'editor'},
    'manage_roster': {'owner', 'admin', 'strategist'},
    'manage_documents': {'owner', 'admin', 'strategist', 'operations'},
    'send_announcements': {'owner', 'admin', 'editor', 'strategist'},
    'view_audit': {'owner', 'admin'},
    'view_analytics': {'owner', 'admin'},
    'manage_settings': {'owner', 'admin'},
    'manage_invites': {'owner', 'admin'},
    'access_admin': STAFF_ROLES,
    'access_portal': MEMBER_ROLES,
}


def require_role(*allowed_roles: str):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user['role'] not in allowed_roles:
            raise HTTPException(status_code=403, detail='forbidden')
        return user
    return _dep


def require_cap(cap: str):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        allowed = CAPABILITIES.get(cap, set())
        if user['role'] not in allowed:
            raise HTTPException(status_code=403, detail=f'missing capability: {cap}')
        return user
    return _dep


def has_cap(user: dict, cap: str) -> bool:
    if not user:
        return False
    return user['role'] in CAPABILITIES.get(cap, set())


async def require_staff(user: dict = Depends(get_current_user)) -> dict:
    if user['role'] not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail='staff only')
    return user


async def require_member(user: dict = Depends(get_current_user)) -> dict:
    if user['role'] not in MEMBER_ROLES:
        raise HTTPException(status_code=403, detail='member only')
    return user
