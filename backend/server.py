from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
from datetime import datetime, timezone

from db import db, client, UPLOAD_DIR
from routes_auth import router as auth_router
from routes_admin import router as admin_router
from routes_cms import router as cms_router
from routes_ops import router as ops_router
from routes_public import router as public_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title='PROOF API')

# /api router (everything routed via Kubernetes ingress to /api/*)
api_router = APIRouter(prefix='/api')


@api_router.get('/')
async def api_root():
    return {'service': 'PROOF', 'version': '1.0.0'}


@api_router.get('/health')
async def health():
    try:
        await db.command('ping')
        return {'ok': True, 'db': 'up'}
    except Exception as e:
        return {'ok': False, 'db': str(e)}


# Mount sub-routers under /api
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(cms_router)
api_router.include_router(ops_router)

# Public routes (sitemap.xml, robots.txt, page-view tracking) — also exposed via /api for the FastAPI side
api_router.include_router(public_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Scheduled publish task (APScheduler) ----------
_scheduler = None


async def _flip_scheduled():
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        # Pages
        cursor = db.pages.find({'status': 'scheduled', 'publish_at': {'$lte': now_iso}})
        async for p in cursor:
            await db.pages.update_one({'id': p['id']}, {'$set': {
                'status': 'published',
                'published_at': now_iso,
                'updated_at': now_iso,
            }})
            await db.audit_log.insert_one({
                'id': os.urandom(8).hex(),
                'actor_id': None,
                'actor_email': 'system@scheduler',
                'action': 'publish',
                'resource_type': 'page',
                'resource_id': p['id'],
                'meta': {'via': 'scheduler'},
                'created_at': now_iso,
            })
        # Posts
        cursor = db.posts.find({'status': 'scheduled', 'publish_at': {'$lte': now_iso}})
        async for p in cursor:
            await db.posts.update_one({'id': p['id']}, {'$set': {
                'status': 'published',
                'published_at': now_iso,
                'updated_at': now_iso,
            }})
            await db.audit_log.insert_one({
                'id': os.urandom(8).hex(),
                'actor_id': None,
                'actor_email': 'system@scheduler',
                'action': 'publish',
                'resource_type': 'post',
                'resource_id': p['id'],
                'meta': {'via': 'scheduler'},
                'created_at': now_iso,
            })
    except Exception as e:
        logger.exception(f"scheduler tick failed: {e}")


@app.on_event('startup')
async def on_startup():
    global _scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(_flip_scheduled, 'interval', seconds=30, id='flip_scheduled')
        _scheduler.start()
        logger.info('Scheduler started')
    except Exception as e:
        logger.warning(f"Scheduler not started: {e}")

    # Ensure indexes
    try:
        await db.profiles.create_index('email', unique=True)
        await db.pages.create_index('slug', unique=True)
        await db.posts.create_index('slug', unique=True)
        await db.athletes.create_index('slug', unique=True)
        await db.audit_log.create_index('created_at')
        await db.analytics_events.create_index('created_at')
        await db.events.create_index('start')
        await db.messages.create_index('thread_id')
        await db.invites.create_index('token', unique=True)
    except Exception as e:
        logger.warning(f"Index setup: {e}")


@app.on_event('shutdown')
async def on_shutdown():
    try:
        if _scheduler:
            _scheduler.shutdown(wait=False)
    except Exception:
        pass
    client.close()
