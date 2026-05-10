import pyotp
import qrcode
import io
import base64
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from db import db
from auth import (
    get_current_user, hash_password, verify_password, issue_token,
    STAFF_ROLES, MEMBER_ROLES,
)
from utils import write_audit, write_analytics, serialize_doc
from models import LoginRequest, LoginResponse

router = APIRouter(prefix='/auth/2fa', tags=['2fa'])

ISSUER = 'PROOF'


def make_qr_png_b64(uri: str) -> str:
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


@router.get('/status')
async def status(user: dict = Depends(get_current_user)):
    s = await db.settings.find_one({'id': 'singleton'}, {'_id': 0}) or {}
    enforced = (s.get('mfa_enforced_staff') and user['role'] in STAFF_ROLES) or \
               (s.get('mfa_enforced_members') and user['role'] in MEMBER_ROLES)
    return {
        'enabled': bool(user.get('totp_enabled')),
        'enforced': bool(enforced),
        'pending_setup': bool(user.get('totp_secret')) and not user.get('totp_enabled'),
    }


@router.post('/setup')
async def setup(user: dict = Depends(get_current_user)):
    secret = pyotp.random_base32()
    await db.profiles.update_one({'id': user['id']}, {'$set': {
        'totp_secret': secret,
        'totp_enabled': False,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user['email'], issuer_name=ISSUER)
    qr = make_qr_png_b64(uri)
    return {'secret': secret, 'otpauth_uri': uri, 'qr_png_data_url': qr}


@router.post('/enable')
async def enable(payload: dict, user: dict = Depends(get_current_user)):
    code = (payload.get('code') or '').strip()
    secret = user.get('totp_secret')
    if not secret:
        raise HTTPException(400, 'no setup in progress — call /setup first')
    if not pyotp.TOTP(secret).verify(code, valid_window=1):
        raise HTTPException(400, 'invalid code')
    await db.profiles.update_one({'id': user['id']}, {'$set': {
        'totp_enabled': True,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    await write_audit(user, 'enable', '2fa', user['id'])
    return {'ok': True, 'enabled': True}


@router.post('/disable')
async def disable(payload: dict, user: dict = Depends(get_current_user)):
    code = (payload.get('code') or '').strip()
    secret = user.get('totp_secret')
    if user.get('totp_enabled') and (not secret or not pyotp.TOTP(secret).verify(code, valid_window=1)):
        raise HTTPException(400, 'invalid code')
    await db.profiles.update_one({'id': user['id']}, {'$unset': {'totp_secret': '', 'totp_enabled': ''}, '$set': {
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    await write_audit(user, 'disable', '2fa', user['id'])
    return {'ok': True, 'enabled': False}


# --- 2FA-aware login (separate endpoint to keep classic /auth/login working without code) ---
@router.post('/login', response_model=LoginResponse)
async def login_with_2fa(req: dict):
    email = (req.get('email') or '').lower().strip()
    password = req.get('password') or ''
    code = (req.get('code') or '').strip()
    user = await db.profiles.find_one({'email': email})
    if not user or not verify_password(password, user.get('password_hash', '')):
        raise HTTPException(401, 'invalid credentials')
    if user.get('status') == 'suspended':
        raise HTTPException(403, 'account suspended')
    s = await db.settings.find_one({'id': 'singleton'}, {'_id': 0}) or {}
    enforced = (s.get('mfa_enforced_staff') and user['role'] in STAFF_ROLES) or \
               (s.get('mfa_enforced_members') and user['role'] in MEMBER_ROLES)
    if user.get('totp_enabled'):
        if not code:
            raise HTTPException(401, detail={'requires_2fa': True, 'message': 'enter authenticator code'})
        if not pyotp.TOTP(user['totp_secret']).verify(code, valid_window=1):
            raise HTTPException(401, detail={'requires_2fa': True, 'message': 'invalid code'})
    elif enforced:
        # not enabled but enforced — ask user to set up first
        raise HTTPException(401, detail={'must_setup_2fa': True, 'message': '2fa setup required'})

    await db.profiles.update_one({'id': user['id']}, {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}})
    user['last_login'] = datetime.now(timezone.utc).isoformat()
    token = issue_token(user)
    await write_audit(user, 'login', 'profile', user['id'], meta={'mfa': bool(user.get('totp_enabled'))})
    await write_analytics('portal_login' if user['role'] in MEMBER_ROLES else 'admin_login', user)
    safe = serialize_doc({k: v for k, v in user.items() if k not in ('password_hash', 'totp_secret')})
    return {'access_token': token, 'token_type': 'bearer', 'user': safe}
