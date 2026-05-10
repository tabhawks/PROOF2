from fastapi import APIRouter, Request, Response, Depends
from fastapi.responses import PlainTextResponse
from typing import Optional
from datetime import datetime, timezone
from db import db
from auth import optional_user, has_cap
from utils import serialize_doc, write_analytics

router = APIRouter(tags=['public'])


@router.get('/sitemap.xml')
async def sitemap(request: Request):
    base = str(request.base_url).rstrip('/')
    items = await db.pages.find({'status': 'published'}, {'_id': 0}).to_list(500)
    posts = await db.posts.find({'status': 'published'}, {'_id': 0}).to_list(500)
    urls = []
    static_paths = ['/', '/services', '/sports-management', '/sports-advisory',
                    '/strategic-advisory', '/athletes', '/approach', '/about', '/press', '/contact']
    for p in static_paths:
        urls.append({'loc': f"{base}{p}", 'changefreq': 'monthly', 'priority': '0.8'})
    for it in items:
        if it.get('slug') in {'home', '/', ''}:
            continue
        urls.append({'loc': f"{base}/p/{it['slug']}", 'lastmod': it.get('updated_at', ''),
                     'changefreq': 'monthly', 'priority': '0.6'})
    for it in posts:
        urls.append({'loc': f"{base}/press/{it['slug']}", 'lastmod': it.get('updated_at', ''),
                     'changefreq': 'weekly', 'priority': '0.7'})
    body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        body += '  <url>\n'
        body += f"    <loc>{u['loc']}</loc>\n"
        if u.get('lastmod'):
            body += f"    <lastmod>{u['lastmod']}</lastmod>\n"
        body += f"    <changefreq>{u['changefreq']}</changefreq>\n"
        body += f"    <priority>{u['priority']}</priority>\n"
        body += '  </url>\n'
    body += '</urlset>\n'
    return Response(content=body, media_type='application/xml')


@router.get('/robots.txt', response_class=PlainTextResponse)
async def robots(request: Request):
    base = str(request.base_url).rstrip('/')
    return (
        f"User-agent: *\n"
        f"Allow: /\n"
        f"Disallow: /admin\n"
        f"Disallow: /portal\n"
        f"Disallow: /deck\n"
        f"Disallow: /login\n"
        f"Disallow: /onboarding\n"
        f"Sitemap: {base}/sitemap.xml\n"
    )


@router.post('/track/page-view')
async def track_page_view(payload: dict, user: Optional[dict] = Depends(optional_user)):
    await write_analytics('session' if not user else 'page_view', user, {'path': payload.get('path')})
    return {'ok': True}
