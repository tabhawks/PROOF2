from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Response
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import secrets
import os
import shutil
from pathlib import Path
from PIL import Image
from db import db, UPLOAD_DIR
from auth import get_current_user, require_cap, optional_user, has_cap
from utils import write_audit, write_analytics, serialize_doc, prepare_for_mongo, slugify, diff_dicts

router = APIRouter(prefix='/cms', tags=['cms'])


# ---------- Helpers ----------
async def snapshot_revision(resource_type: str, resource_id: str, doc: dict, actor: Optional[dict], note: Optional[str] = None):
    rev = {
        'id': secrets.token_hex(12),
        'resource_type': resource_type,
        'resource_id': resource_id,
        'actor_id': actor['id'] if actor else None,
        'snapshot': serialize_doc({k: v for k, v in doc.items() if k != '_id'}),
        'note': note,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.revisions.insert_one(rev)


# ============ PAGES ============
@router.get('/pages')
async def list_pages(
    status_filter: Optional[str] = Query(None, alias='status'),
    user: Optional[dict] = Depends(optional_user),
):
    q = {}
    if status_filter:
        q['status'] = status_filter
    elif not has_cap(user, 'edit_content'):
        q['status'] = 'published'
    items = await db.pages.find(q).sort('updated_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.get('/pages/by-slug/{slug}')
async def get_page_by_slug(slug: str, preview: Optional[str] = None, user: Optional[dict] = Depends(optional_user)):
    page = await db.pages.find_one({'slug': slug})
    if not page:
        raise HTTPException(404, 'not found')
    if page.get('status') != 'published':
        if has_cap(user, 'edit_content'):
            pass  # allow editors to preview
        elif preview and page.get('preview_token') == preview:
            pass
        else:
            raise HTTPException(404, 'not found')
    await write_analytics('page_view', user, {'slug': slug})
    return serialize_doc(page)


@router.get('/pages/{page_id}')
async def get_page(page_id: str, user: dict = Depends(require_cap('edit_content'))):
    page = await db.pages.find_one({'id': page_id})
    if not page:
        raise HTTPException(404, 'not found')
    return serialize_doc(page)


@router.post('/pages')
async def create_page(payload: dict, user: dict = Depends(require_cap('edit_content'))):
    title = payload.get('title') or 'Untitled'
    slug = slugify(payload.get('slug') or title)
    if await db.pages.find_one({'slug': slug}):
        slug = f"{slug}-{secrets.token_hex(2)}"
    page = {
        'id': secrets.token_hex(12),
        'slug': slug,
        'title': title,
        'seo_title': payload.get('seo_title'),
        'seo_description': payload.get('seo_description'),
        'og_image': payload.get('og_image'),
        'canonical_url': payload.get('canonical_url'),
        'robots': payload.get('robots') or 'index,follow',
        'locale': payload.get('locale') or 'en',
        'status': 'draft',
        'blocks': payload.get('blocks') or [],
        'publish_at': None,
        'published_at': None,
        'author_id': user['id'],
        'is_system': False,
        'preview_token': secrets.token_urlsafe(16),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.pages.insert_one(page)
    await snapshot_revision('page', page['id'], page, user, 'created')
    await write_audit(user, 'create', 'page', page['id'], None, serialize_doc(page))
    await write_analytics('content_edit', user, {'resource': 'page', 'action': 'create'})
    return serialize_doc(page)


@router.patch('/pages/{page_id}')
async def update_page(page_id: str, payload: dict, user: dict = Depends(require_cap('edit_content'))):
    before = await db.pages.find_one({'id': page_id})
    if not before:
        raise HTTPException(404, 'not found')
    updates = {}
    allowed_fields = ['title', 'slug', 'seo_title', 'seo_description', 'og_image',
                      'canonical_url', 'robots', 'locale', 'blocks', 'publish_at']
    for f in allowed_fields:
        if f in payload:
            updates[f] = payload[f]
    if 'slug' in updates:
        updates['slug'] = slugify(updates['slug']) or before['slug']
    if updates.get('publish_at'):
        try:
            pub = updates['publish_at']
            if isinstance(pub, str):
                pub_dt = datetime.fromisoformat(pub.replace('Z', '+00:00'))
            else:
                pub_dt = pub
            if pub_dt > datetime.now(timezone.utc):
                updates['status'] = 'scheduled'
        except Exception:
            pass
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.pages.update_one({'id': page_id}, {'$set': updates})
    after = await db.pages.find_one({'id': page_id})
    await snapshot_revision('page', page_id, after, user, payload.get('revision_note'))
    await write_audit(user, 'update', 'page', page_id, serialize_doc(before), serialize_doc(after),
                      {'diff': diff_dicts(serialize_doc(before), serialize_doc(after))})
    await write_analytics('content_edit', user, {'resource': 'page', 'action': 'update'})
    if after.get('status') == 'published':
        await regenerate_sitemap_marker()
    return serialize_doc(after)


@router.post('/pages/{page_id}/publish')
async def publish_page(page_id: str, user: dict = Depends(require_cap('edit_content'))):
    page = await db.pages.find_one({'id': page_id})
    if not page:
        raise HTTPException(404, 'not found')
    await db.pages.update_one({'id': page_id}, {'$set': {
        'status': 'published',
        'published_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    after = await db.pages.find_one({'id': page_id})
    await snapshot_revision('page', page_id, after, user, 'published')
    await write_audit(user, 'publish', 'page', page_id, serialize_doc(page), serialize_doc(after))
    await regenerate_sitemap_marker()
    return serialize_doc(after)


@router.post('/pages/{page_id}/unpublish')
async def unpublish_page(page_id: str, user: dict = Depends(require_cap('edit_content'))):
    await db.pages.update_one({'id': page_id}, {'$set': {'status': 'draft', 'updated_at': datetime.now(timezone.utc).isoformat()}})
    p = await db.pages.find_one({'id': page_id})
    await write_audit(user, 'unpublish', 'page', page_id)
    return serialize_doc(p)


@router.post('/pages/{page_id}/archive')
async def archive_page(page_id: str, user: dict = Depends(require_cap('edit_content'))):
    await db.pages.update_one({'id': page_id}, {'$set': {'status': 'archived', 'updated_at': datetime.now(timezone.utc).isoformat()}})
    p = await db.pages.find_one({'id': page_id})
    await write_audit(user, 'archive', 'page', page_id)
    return serialize_doc(p)


@router.delete('/pages/{page_id}')
async def delete_page(page_id: str, user: dict = Depends(require_cap('edit_content'))):
    page = await db.pages.find_one({'id': page_id})
    if not page:
        raise HTTPException(404, 'not found')
    if page.get('is_system'):
        raise HTTPException(403, 'system page cannot be deleted')
    await db.pages.delete_one({'id': page_id})
    await write_audit(user, 'delete', 'page', page_id, serialize_doc(page))
    return {'ok': True}


# ============ POSTS ============
@router.get('/posts')
async def list_posts(
    status_filter: Optional[str] = Query(None, alias='status'),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    user: Optional[dict] = Depends(optional_user),
):
    q = {}
    if status_filter:
        q['status'] = status_filter
    elif not has_cap(user, 'edit_content'):
        q['status'] = 'published'
    if category:
        q['categories'] = category
    if tag:
        q['tags'] = tag
    items = await db.posts.find(q).sort('publish_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.get('/posts/by-slug/{slug}')
async def get_post_by_slug(slug: str, preview: Optional[str] = None, user: Optional[dict] = Depends(optional_user)):
    post = await db.posts.find_one({'slug': slug})
    if not post:
        raise HTTPException(404, 'not found')
    if post.get('status') != 'published':
        if has_cap(user, 'edit_content'):
            pass
        elif preview and post.get('preview_token') == preview:
            pass
        else:
            raise HTTPException(404, 'not found')
    return serialize_doc(post)


@router.post('/posts')
async def create_post(payload: dict, user: dict = Depends(require_cap('edit_content'))):
    title = payload.get('title') or 'Untitled'
    slug = slugify(payload.get('slug') or title)
    if await db.posts.find_one({'slug': slug}):
        slug = f"{slug}-{secrets.token_hex(2)}"
    post = {
        'id': secrets.token_hex(12),
        'slug': slug,
        'title': title,
        'excerpt': payload.get('excerpt'),
        'seo_title': payload.get('seo_title'),
        'seo_description': payload.get('seo_description'),
        'og_image': payload.get('og_image'),
        'featured_image': payload.get('featured_image'),
        'canonical_url': payload.get('canonical_url'),
        'robots': payload.get('robots') or 'index,follow',
        'locale': payload.get('locale') or 'en',
        'status': 'draft',
        'blocks': payload.get('blocks') or [],
        'categories': payload.get('categories') or [],
        'tags': payload.get('tags') or [],
        'author_id': user['id'],
        'publish_at': payload.get('publish_at'),
        'published_at': None,
        'preview_token': secrets.token_urlsafe(16),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.posts.insert_one(post)
    await snapshot_revision('post', post['id'], post, user, 'created')
    await write_audit(user, 'create', 'post', post['id'], None, serialize_doc(post))
    return serialize_doc(post)


@router.patch('/posts/{post_id}')
async def update_post(post_id: str, payload: dict, user: dict = Depends(require_cap('edit_content'))):
    before = await db.posts.find_one({'id': post_id})
    if not before:
        raise HTTPException(404, 'not found')
    updates = {}
    fields = ['title', 'slug', 'excerpt', 'seo_title', 'seo_description', 'og_image', 'featured_image',
              'canonical_url', 'robots', 'locale', 'blocks', 'categories', 'tags', 'publish_at']
    for f in fields:
        if f in payload:
            updates[f] = payload[f]
    if 'slug' in updates:
        updates['slug'] = slugify(updates['slug']) or before['slug']
    if updates.get('publish_at'):
        try:
            pub = updates['publish_at']
            pub_dt = datetime.fromisoformat(pub.replace('Z', '+00:00')) if isinstance(pub, str) else pub
            if pub_dt > datetime.now(timezone.utc):
                updates['status'] = 'scheduled'
        except Exception:
            pass
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.posts.update_one({'id': post_id}, {'$set': updates})
    after = await db.posts.find_one({'id': post_id})
    await snapshot_revision('post', post_id, after, user, payload.get('revision_note'))
    await write_audit(user, 'update', 'post', post_id, serialize_doc(before), serialize_doc(after),
                      {'diff': diff_dicts(serialize_doc(before), serialize_doc(after))})
    await write_analytics('content_edit', user, {'resource': 'post'})
    return serialize_doc(after)


@router.post('/posts/{post_id}/publish')
async def publish_post(post_id: str, user: dict = Depends(require_cap('edit_content'))):
    post = await db.posts.find_one({'id': post_id})
    if not post:
        raise HTTPException(404, 'not found')
    await db.posts.update_one({'id': post_id}, {'$set': {
        'status': 'published',
        'published_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    after = await db.posts.find_one({'id': post_id})
    await write_audit(user, 'publish', 'post', post_id, serialize_doc(post), serialize_doc(after))
    return serialize_doc(after)


@router.delete('/posts/{post_id}')
async def delete_post(post_id: str, user: dict = Depends(require_cap('edit_content'))):
    post = await db.posts.find_one({'id': post_id})
    if not post:
        raise HTTPException(404, 'not found')
    await db.posts.delete_one({'id': post_id})
    await write_audit(user, 'delete', 'post', post_id, serialize_doc(post))
    return {'ok': True}


# ============ REVISIONS ============
@router.get('/revisions/{resource_type}/{resource_id}')
async def list_revisions(resource_type: str, resource_id: str, user: dict = Depends(require_cap('edit_content'))):
    items = await db.revisions.find({'resource_type': resource_type, 'resource_id': resource_id}).sort('created_at', -1).to_list(200)
    return [serialize_doc(i) for i in items]


@router.post('/revisions/{revision_id}/restore')
async def restore_revision(revision_id: str, user: dict = Depends(require_cap('edit_content'))):
    rev = await db.revisions.find_one({'id': revision_id})
    if not rev:
        raise HTTPException(404, 'not found')
    snap = rev['snapshot']
    coll = db.pages if rev['resource_type'] == 'page' else db.posts
    current = await coll.find_one({'id': rev['resource_id']})
    if not current:
        raise HTTPException(404, 'resource gone')
    # Restore mutable fields only
    fields = ['title', 'slug', 'seo_title', 'seo_description', 'og_image', 'canonical_url', 'robots',
              'locale', 'blocks', 'excerpt', 'featured_image', 'categories', 'tags']
    updates = {f: snap.get(f) for f in fields if f in snap}
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await coll.update_one({'id': rev['resource_id']}, {'$set': updates})
    after = await coll.find_one({'id': rev['resource_id']})
    await snapshot_revision(rev['resource_type'], rev['resource_id'], after, user, f"restored from {revision_id}")
    await write_audit(user, 'restore', rev['resource_type'], rev['resource_id'], serialize_doc(current), serialize_doc(after), {'revision_id': revision_id})
    return serialize_doc(after)


# ============ MEDIA ============
@router.get('/media')
async def list_media(user: dict = Depends(get_current_user)):
    items = await db.media.find().sort('created_at', -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post('/media')
async def upload_media(
    file: UploadFile = File(...),
    alt: str = Form(''),
    title: Optional[str] = Form(None),
    user: dict = Depends(require_cap('edit_content')),
):
    if not file.filename:
        raise HTTPException(400, 'no file')
    ext = (Path(file.filename).suffix or '.bin').lower()
    fid = secrets.token_hex(12)
    safe_name = f"{fid}{ext}"
    media_dir = UPLOAD_DIR / 'media'
    media_dir.mkdir(exist_ok=True)
    full_path = media_dir / safe_name
    content = await file.read()
    with open(full_path, 'wb') as f:
        f.write(content)

    variants = {'full': f"/api/media/file/{safe_name}"}
    if ext.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
        try:
            img = Image.open(full_path)
            for label, max_w in [('thumb', 320), ('medium', 800)]:
                vname = f"{fid}_{label}{ext}"
                vpath = media_dir / vname
                im = img.copy()
                im.thumbnail((max_w, max_w * 4))
                im.save(vpath)
                variants[label] = f"/api/media/file/{vname}"
        except Exception:
            pass

    item = {
        'id': fid,
        'filename': safe_name,
        'original_name': file.filename,
        'mime': file.content_type or 'application/octet-stream',
        'size': len(content),
        'alt': alt,
        'title': title,
        'variants': variants,
        'uploader_id': user['id'],
        'usage': [],
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.media.insert_one(item)
    await write_audit(user, 'create', 'media', fid, None, serialize_doc(item))
    return serialize_doc(item)


@router.get('/media/file/{filename}')
async def serve_media(filename: str):
    media_dir = UPLOAD_DIR / 'media'
    full_path = media_dir / filename
    if not full_path.exists() or not str(full_path.resolve()).startswith(str(media_dir.resolve())):
        raise HTTPException(404, 'not found')
    from fastapi.responses import FileResponse
    return FileResponse(full_path)


@router.patch('/media/{media_id}')
async def update_media(media_id: str, payload: dict, user: dict = Depends(require_cap('edit_content'))):
    item = await db.media.find_one({'id': media_id})
    if not item:
        raise HTTPException(404, 'not found')
    updates = {}
    for f in ['alt', 'title']:
        if f in payload:
            updates[f] = payload[f]
    if 'original_name' in payload:
        updates['original_name'] = payload['original_name']
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.media.update_one({'id': media_id}, {'$set': updates})
    after = await db.media.find_one({'id': media_id})
    await write_audit(user, 'update', 'media', media_id, serialize_doc(item), serialize_doc(after))
    return serialize_doc(after)


@router.delete('/media/{media_id}')
async def delete_media(media_id: str, user: dict = Depends(require_cap('edit_content'))):
    item = await db.media.find_one({'id': media_id})
    if not item:
        raise HTTPException(404, 'not found')
    media_dir = UPLOAD_DIR / 'media'
    for url in (item.get('variants') or {}).values():
        name = url.rsplit('/', 1)[-1]
        p = media_dir / name
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass
    await db.media.delete_one({'id': media_id})
    await write_audit(user, 'delete', 'media', media_id, serialize_doc(item))
    return {'ok': True}


# ============ MENUS ============
@router.get('/menus')
async def list_menus(user: Optional[dict] = Depends(optional_user)):
    items = await db.menus.find().to_list(20)
    return [serialize_doc(i) for i in items]


@router.put('/menus/{location}')
async def upsert_menu(location: str, payload: dict, user: dict = Depends(require_cap('edit_content'))):
    items = payload.get('items') or []
    doc = {
        'id': location,
        'location': location,
        'items': items,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.menus.update_one({'location': location}, {'$set': doc}, upsert=True)
    await write_audit(user, 'update', 'menu', location, None, doc)
    return serialize_doc(doc)


# ============ Categories / Tags ============
@router.get('/categories')
async def list_categories():
    items = await db.categories.find().to_list(200)
    return [serialize_doc(i) for i in items]


@router.post('/categories')
async def create_category(payload: dict, user: dict = Depends(require_cap('edit_content'))):
    name = payload.get('name', '').strip()
    if not name:
        raise HTTPException(400, 'name required')
    cat = {'id': secrets.token_hex(8), 'name': name, 'slug': slugify(name)}
    await db.categories.insert_one(cat)
    return serialize_doc(cat)


@router.get('/tags')
async def list_tags():
    items = await db.tags.find().to_list(500)
    return [serialize_doc(i) for i in items]


@router.post('/tags')
async def create_tag(payload: dict, user: dict = Depends(require_cap('edit_content'))):
    name = payload.get('name', '').strip()
    if not name:
        raise HTTPException(400, 'name required')
    t = {'id': secrets.token_hex(8), 'name': name, 'slug': slugify(name)}
    await db.tags.insert_one(t)
    return serialize_doc(t)


# Sitemap regeneration marker (optional - rendered live anyway)
async def regenerate_sitemap_marker():
    await db.settings.update_one(
        {'id': 'singleton'},
        {'$set': {'sitemap_regenerated_at': datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
