from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Any, Dict, Literal
from datetime import datetime, timezone
import uuid


def now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Auth / Users ----------
ROLES = [
    'owner', 'admin', 'editor', 'strategist', 'operations', 'read_only',
    'athlete', 'family', 'agent', 'counsel'
]

STAFF_ROLES = ['owner', 'admin', 'editor', 'strategist', 'operations', 'read_only']
MEMBER_ROLES = ['athlete', 'family', 'agent', 'counsel']


class Profile(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=new_id)
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = 'read_only'
    status: Literal['active', 'suspended', 'pending'] = 'active'
    password_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)
    last_login: Optional[datetime] = None
    session_version: int = 0  # bumped to invalidate all tokens


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: Dict[str, Any]


class ClaimOwnerRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    current_password: str
    new_password: str


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None


# ---------- Athletes ----------
class Athlete(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=new_id)
    slug: str
    name: str
    sport: str
    position: Optional[str] = None
    team: Optional[str] = None
    status: Literal['active', 'paused', 'alumni', 'prospect'] = 'active'
    primary_strategist_id: Optional[str] = None
    headline: Optional[str] = None
    pull_quote: Optional[str] = None
    tenure_year: Optional[int] = None
    photo_url: Optional[str] = None
    signed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class AthleteMember(BaseModel):
    id: str = Field(default_factory=new_id)
    athlete_id: str
    profile_id: str
    relation: str  # athlete | family | agent | counsel
    created_at: datetime = Field(default_factory=now)


# ---------- CMS ----------
class Block(BaseModel):
    id: str = Field(default_factory=new_id)
    type: str  # hero, heading, paragraph, quote, image, image_text, two_col, three_col, list, stat_strip, cta, press_list, athlete_grid, embed, custom_html, spacer, divider
    data: Dict[str, Any] = Field(default_factory=dict)
    settings: Dict[str, Any] = Field(default_factory=dict)


class Page(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=new_id)
    slug: str
    title: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    og_image: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: str = 'index,follow'
    locale: str = 'en'
    status: Literal['draft', 'scheduled', 'published', 'archived'] = 'draft'
    blocks: List[Dict[str, Any]] = Field(default_factory=list)
    publish_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    author_id: Optional[str] = None
    is_system: bool = False
    preview_token: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class Post(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=new_id)
    slug: str
    title: str
    excerpt: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    og_image: Optional[str] = None
    featured_image: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: str = 'index,follow'
    locale: str = 'en'
    status: Literal['draft', 'scheduled', 'published', 'archived'] = 'draft'
    blocks: List[Dict[str, Any]] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    author_id: Optional[str] = None
    publish_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    preview_token: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class Revision(BaseModel):
    id: str = Field(default_factory=new_id)
    resource_type: str  # 'page' | 'post'
    resource_id: str
    actor_id: Optional[str] = None
    snapshot: Dict[str, Any]
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=now)


class MediaItem(BaseModel):
    id: str = Field(default_factory=new_id)
    filename: str
    original_name: str
    mime: str
    size: int
    alt: str = ''
    title: Optional[str] = None
    variants: Dict[str, str] = Field(default_factory=dict)  # thumb/medium/full -> url
    uploader_id: Optional[str] = None
    usage: List[Dict[str, str]] = Field(default_factory=list)  # [{type, id, label}]
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class MenuItem(BaseModel):
    id: str = Field(default_factory=new_id)
    label: str
    href: str
    order: int = 0


class Menu(BaseModel):
    id: str = Field(default_factory=new_id)
    location: Literal['header', 'footer_firm', 'footer_practices', 'footer_legal']
    items: List[Dict[str, Any]] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=now)


class Category(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    slug: str


class Tag(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    slug: str


# ---------- Operations ----------
class Document(BaseModel):
    id: str = Field(default_factory=new_id)
    athlete_id: Optional[str] = None
    title: str
    filename: str
    storage_path: str
    mime: str
    size: int
    visibility: Literal['public', 'member', 'owner', 'staff'] = 'member'
    uploader_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now)


class Event(BaseModel):
    id: str = Field(default_factory=new_id)
    athlete_id: Optional[str] = None
    title: str
    location: Optional[str] = None
    description: Optional[str] = None
    start: datetime
    end: Optional[datetime] = None
    visibility: Literal['public', 'member', 'staff'] = 'member'
    created_at: datetime = Field(default_factory=now)


class Announcement(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    body: str
    audience: Literal['all', 'members', 'athlete'] = 'members'
    athlete_id: Optional[str] = None
    author_id: Optional[str] = None
    published_at: datetime = Field(default_factory=now)
    created_at: datetime = Field(default_factory=now)


class MessageThread(BaseModel):
    id: str = Field(default_factory=new_id)
    subject: str
    member_id: str
    strategist_id: str
    athlete_id: Optional[str] = None
    last_message_at: datetime = Field(default_factory=now)
    created_at: datetime = Field(default_factory=now)


class Message(BaseModel):
    id: str = Field(default_factory=new_id)
    thread_id: str
    sender_id: str
    body: str
    read_by: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now)


class Invite(BaseModel):
    id: str = Field(default_factory=new_id)
    email: EmailStr
    name: str
    role: str
    token: str
    inviter_id: Optional[str] = None
    athlete_ids: List[str] = Field(default_factory=list)
    status: Literal['pending', 'accepted', 'revoked', 'expired'] = 'pending'
    expires_at: datetime
    created_at: datetime = Field(default_factory=now)


class AuditEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str  # create | update | delete | login | logout | download | publish | restore
    resource_type: str
    resource_id: Optional[str] = None
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=now)


class AnalyticsEvent(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str  # session | portal_login | content_edit | doc_download | inquiry | page_view
    actor_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=now)


class Settings(BaseModel):
    id: str = 'singleton'
    site_title: str = 'PROOF'
    site_tagline: str = 'Private Athlete Management'
    site_seo_title: str = 'PROOF \u2014 Private Athlete Management'
    site_seo_description: str = 'PROOF is a private management and strategic advisory firm for elite athletes.'
    edition_meta: str = 'PROOF\u2122 \u00b7 EDITION 2026.01 \u00b7 NEW YORK \u00b7 LONDON'
    contact_email: str = 'private@prooffirm.com'
    session_timeout_minutes: int = 60
    password_min_length: int = 8
    mfa_enforced_staff: bool = False
    mfa_enforced_members: bool = False
    updated_at: datetime = Field(default_factory=now)
