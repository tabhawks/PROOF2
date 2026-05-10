"""Seed script for PROOF.
Run: cd /app/backend && python seed.py
Creates: 4 staff, 6 members linked to 6 athletes, 3 pages, 3 posts, 6 documents, 4 events, 2 announcements,
plus default menus and settings.

Idempotent: drops existing data and reseeds.
"""
import asyncio
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from db import db, UPLOAD_DIR
from auth import hash_password


def iso(dt: datetime) -> str:
    return dt.isoformat()


def now() -> datetime:
    return datetime.now(timezone.utc)


COLLECTIONS = [
    'profiles', 'athletes', 'athlete_members', 'pages', 'posts', 'revisions', 'media',
    'menus', 'documents', 'events', 'announcements', 'message_threads', 'messages',
    'invites', 'audit_log', 'analytics_events', 'inquiries', 'categories', 'tags', 'settings',
]


async def seed():
    print('[seed] dropping collections...')
    for c in COLLECTIONS:
        await db[c].drop()

    print('[seed] settings...')
    await db.settings.insert_one({
        'id': 'singleton',
        'site_title': 'PROOF',
        'site_tagline': 'Private Athlete Management',
        'site_seo_title': 'PROOF \u2014 Private Athlete Management & Strategic Advisory',
        'site_seo_description': 'PROOF is a private management and strategic advisory firm for elite athletes. Sports-first launch, 2026.',
        'edition_meta': 'PROOF\u2122 \u00b7 EDITION 2026.01 \u00b7 NEW YORK \u00b7 LONDON',
        'contact_email': 'private@prooffirm.com',
        'session_timeout_minutes': 60,
        'password_min_length': 8,
        'mfa_enforced_staff': False,
        'mfa_enforced_members': False,
        'updated_at': iso(now()),
    })

    print('[seed] staff profiles...')
    pw = hash_password('Proof2026!')
    staff = [
        {'name': 'Marcus Hale', 'email': 'owner@proof.firm', 'role': 'owner'},
        {'name': 'Eleanor Stone', 'email': 'admin@proof.firm', 'role': 'admin'},
        {'name': 'James Whitfield', 'email': 'editor@proof.firm', 'role': 'editor'},
        {'name': 'Tomas Reyes', 'email': 'strategist@proof.firm', 'role': 'strategist'},
    ]
    staff_ids = {}
    for s in staff:
        sid = secrets.token_hex(12)
        staff_ids[s['role']] = sid
        await db.profiles.insert_one({
            'id': sid,
            'email': s['email'],
            'name': s['name'],
            'role': s['role'],
            'phone': '+1 212 555 0100',
            'status': 'active',
            'password_hash': pw,
            'avatar_url': None,
            'session_version': 0,
            'last_login': None,
            'created_at': iso(now()),
            'updated_at': iso(now()),
        })

    print('[seed] athletes...')
    athletes_data = [
        {'name': 'Devon Marsh', 'sport': 'Football', 'position': 'Quarterback', 'team': 'Pre-Draft', 'status': 'active', 'tenure_year': 2024,
         'headline': 'A pre-draft quarterback building a private brand layer before the cameras decide.',
         'pull_quote': 'Discipline is the loudest thing on a quiet field.',
         'photo_url': 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1200&q=80'},
        {'name': 'Amara Knight', 'sport': 'Basketball', 'position': 'Point Guard', 'team': 'WNBA', 'status': 'active', 'tenure_year': 2023,
         'headline': 'Five years pro, building ownership infrastructure for the next thirty.',
         'pull_quote': 'A contract makes you rich. Ownership keeps you wealthy.',
         'photo_url': 'https://images.unsplash.com/photo-1518614846657-77f8a4d3a8db?w=1200&q=80'},
        {'name': 'Niko Pereira', 'sport': 'Soccer', 'position': 'Forward', 'team': 'European League', 'status': 'active', 'tenure_year': 2022,
         'headline': 'A European career, an American footprint, a single coordinated strategy.',
         'pull_quote': 'Silence is a strategy when chosen.',
         'photo_url': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80'},
        {'name': 'Reese Donovan', 'sport': 'Tennis', 'position': 'Singles', 'team': 'ATP Tour', 'status': 'paused', 'tenure_year': 2021,
         'headline': 'On a deliberate pause. Strategy compounds during quiet years.',
         'pull_quote': 'Slowing down is a tactic, not a retreat.',
         'photo_url': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&q=80'},
        {'name': 'Cassian Vega', 'sport': 'Baseball', 'position': 'Shortstop', 'team': 'MLB', 'status': 'active', 'tenure_year': 2020,
         'headline': 'Career arc beyond the uniform — broadcasting, ownership, family.',
         'pull_quote': 'Performance ends. The architecture remains.',
         'photo_url': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80'},
        {'name': 'Hollis Bryant', 'sport': 'Track & Field', 'position': 'Sprinter', 'team': 'College / NIL', 'status': 'prospect', 'tenure_year': 2025,
         'headline': 'College, NIL, family \u2014 first contracts shaped before the noise.',
         'pull_quote': 'Your NIL is your first business.',
         'photo_url': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80'},
    ]
    athlete_ids = []
    for a in athletes_data:
        aid = secrets.token_hex(12)
        athlete_ids.append(aid)
        slug = a['name'].lower().replace(' ', '-')
        await db.athletes.insert_one({
            'id': aid,
            'slug': slug,
            'name': a['name'],
            'sport': a['sport'],
            'position': a['position'],
            'team': a['team'],
            'status': a['status'],
            'primary_strategist_id': staff_ids['strategist'],
            'headline': a['headline'],
            'pull_quote': a['pull_quote'],
            'tenure_year': a['tenure_year'],
            'photo_url': a['photo_url'],
            'signed_date': iso(now() - timedelta(days=365)),
            'created_at': iso(now()),
            'updated_at': iso(now()),
        })

    print('[seed] member profiles + links...')
    members = [
        {'name': 'Devon Marsh', 'email': 'devon@member.proof', 'role': 'athlete', 'athlete_idx': 0},
        {'name': 'Amara Knight', 'email': 'amara@member.proof', 'role': 'athlete', 'athlete_idx': 1},
        {'name': 'Helena Marsh', 'email': 'helena@member.proof', 'role': 'family', 'athlete_idx': 0},
        {'name': 'Daniel Pereira', 'email': 'daniel@member.proof', 'role': 'family', 'athlete_idx': 2},
        {'name': 'Aaron Cole, Esq.', 'email': 'aaron@counsel.proof', 'role': 'counsel', 'athlete_idx': 3},
        {'name': 'Lena Park', 'email': 'lena@agent.proof', 'role': 'agent', 'athlete_idx': 4},
    ]
    member_ids = []
    for m in members:
        mid = secrets.token_hex(12)
        member_ids.append(mid)
        await db.profiles.insert_one({
            'id': mid,
            'email': m['email'],
            'name': m['name'],
            'role': m['role'],
            'phone': '+1 646 555 0' + str(100 + m['athlete_idx']),
            'status': 'active',
            'password_hash': pw,
            'avatar_url': None,
            'session_version': 0,
            'last_login': None,
            'created_at': iso(now()),
            'updated_at': iso(now()),
        })
        await db.athlete_members.insert_one({
            'id': secrets.token_hex(12),
            'athlete_id': athlete_ids[m['athlete_idx']],
            'profile_id': mid,
            'relation': m['role'],
            'created_at': iso(now()),
        })

    print('[seed] menus...')
    await db.menus.insert_many([
        {'id': 'header', 'location': 'header', 'updated_at': iso(now()), 'items': [
            {'id': 's1', 'label': 'Services', 'href': '/services', 'order': 1},
            {'id': 's2', 'label': 'Athletes', 'href': '/athletes', 'order': 2},
            {'id': 's3', 'label': 'Approach', 'href': '/approach', 'order': 3},
            {'id': 's4', 'label': 'About', 'href': '/about', 'order': 4},
            {'id': 's5', 'label': 'Press', 'href': '/press', 'order': 5},
        ]},
        {'id': 'footer_firm', 'location': 'footer_firm', 'updated_at': iso(now()), 'items': [
            {'id': 'f1', 'label': 'About', 'href': '/about', 'order': 1},
            {'id': 'f2', 'label': 'Approach', 'href': '/approach', 'order': 2},
            {'id': 'f3', 'label': 'Press', 'href': '/press', 'order': 3},
            {'id': 'f4', 'label': 'Contact', 'href': '/contact', 'order': 4},
        ]},
        {'id': 'footer_practices', 'location': 'footer_practices', 'updated_at': iso(now()), 'items': [
            {'id': 'p1', 'label': 'Sports & Athlete Management', 'href': '/sports-management', 'order': 1},
            {'id': 'p2', 'label': 'Sports Advisory', 'href': '/sports-advisory', 'order': 2},
            {'id': 'p3', 'label': 'Strategic Advisory', 'href': '/strategic-advisory', 'order': 3},
        ]},
        {'id': 'footer_legal', 'location': 'footer_legal', 'updated_at': iso(now()), 'items': [
            {'id': 'l1', 'label': 'Privacy', 'href': '/legal#privacy', 'order': 1},
            {'id': 'l2', 'label': 'Disclosures', 'href': '/legal#disclosures', 'order': 2},
            {'id': 'l3', 'label': 'Member Portal', 'href': '/portal', 'order': 3},
        ]},
    ])

    print('[seed] pages (3 system pages with rich blocks)...')
    pages = [
        {'slug': 'home-feature', 'title': 'Home Feature', 'desc': 'Editable home feature blocks',
         'blocks': [
             {'id': 'b1', 'type': 'stat_strip', 'data': {'items': [
                 {'label': 'Practices', 'value': '03'},
                 {'label': 'Pillars', 'value': '06'},
                 {'label': 'Edition', 'value': '2026.01'},
                 {'label': 'Offices', 'value': 'NY \u00b7 LDN'},
             ]}, 'settings': {}},
             {'id': 'b2', 'type': 'quote', 'data': {'text': 'The athlete performs. PROOF manages what performance creates.', 'attribution': 'Firm doctrine'}, 'settings': {}},
         ]},
        {'slug': 'manifesto', 'title': 'Manifesto', 'desc': 'A long-form manifesto page driven by blocks',
         'blocks': [
             {'id': 'm1', 'type': 'heading', 'data': {'text': 'Restraint is a strategy.', 'level': 2}, 'settings': {}},
             {'id': 'm2', 'type': 'paragraph', 'data': {'text': 'PROOF coordinates the seven dimensions of an elite athletic life \u2014 person, career, brand, business, reputation, lifestyle, and legacy. We work quietly, contractually, and only with the few.'}, 'settings': {}},
             {'id': 'm3', 'type': 'list', 'data': {'items': ['Privacy', 'Restraint', 'Continuity', 'Rigor', 'Alignment', 'Discretion']}, 'settings': {}},
         ]},
        {'slug': 'engagement-process', 'title': 'Engagement Process', 'desc': 'How a member becomes a member',
         'blocks': [
             {'id': 'e1', 'type': 'heading', 'data': {'text': 'A selective intake.', 'level': 2}, 'settings': {}},
             {'id': 'e2', 'type': 'paragraph', 'data': {'text': 'Membership begins with a request for consideration. If there is alignment, PROOF will respond with next steps.'}, 'settings': {}},
         ]},
    ]
    for p in pages:
        await db.pages.insert_one({
            'id': secrets.token_hex(12),
            'slug': p['slug'],
            'title': p['title'],
            'seo_title': p['title'] + ' \u2014 PROOF',
            'seo_description': p['desc'],
            'og_image': None,
            'canonical_url': None,
            'robots': 'index,follow',
            'locale': 'en',
            'status': 'published',
            'blocks': p['blocks'],
            'publish_at': None,
            'published_at': iso(now()),
            'author_id': staff_ids['editor'],
            'is_system': False,
            'preview_token': secrets.token_urlsafe(16),
            'created_at': iso(now()),
            'updated_at': iso(now()),
        })

    print('[seed] posts (3 press)...')
    posts = [
        {'slug': 'slow-down-deal', 'title': 'When to slow down a deal that looks good on paper.',
         'excerpt': 'A closer look at the patterns we see when families face their first major commercial offer.',
         'category': 'Family Advisory', 'date': now() - timedelta(days=4)},
        {'slug': 'silence-strategy', 'title': 'Silence is a strategy when chosen, a liability when it is panic.',
         'excerpt': 'How the calmest hour after a public moment is the most important.',
         'category': 'Reputation', 'date': now() - timedelta(days=24)},
        {'slug': 'nil-first-business', 'title': 'Your NIL is your first business \u2014 six decisions at once.',
         'excerpt': 'A framework for college athletes navigating early income, brand, and eligibility together.',
         'category': 'NIL', 'date': now() - timedelta(days=64)},
    ]
    for p in posts:
        await db.posts.insert_one({
            'id': secrets.token_hex(12),
            'slug': p['slug'],
            'title': p['title'],
            'excerpt': p['excerpt'],
            'seo_title': p['title'],
            'seo_description': p['excerpt'],
            'og_image': None,
            'featured_image': None,
            'canonical_url': None,
            'robots': 'index,follow',
            'locale': 'en',
            'status': 'published',
            'blocks': [
                {'id': 'p1', 'type': 'paragraph', 'data': {'text': p['excerpt']}, 'settings': {}},
                {'id': 'p2', 'type': 'paragraph', 'data': {'text': 'PROOF writes from inside the work. The patterns shown here are anonymized; the principles are not.'}, 'settings': {}},
                {'id': 'p3', 'type': 'quote', 'data': {'text': 'Loyalty is a discipline before it is a feeling.', 'attribution': 'Firm doctrine'}, 'settings': {}},
            ],
            'categories': [p['category']],
            'tags': ['Insights'],
            'author_id': staff_ids['editor'],
            'publish_at': iso(p['date']),
            'published_at': iso(p['date']),
            'preview_token': secrets.token_urlsafe(16),
            'created_at': iso(p['date']),
            'updated_at': iso(p['date']),
        })

    print('[seed] categories + tags...')
    for c in ['Family Advisory', 'Reputation', 'NIL', 'Legacy']:
        await db.categories.insert_one({'id': secrets.token_hex(8), 'name': c, 'slug': c.lower().replace(' ', '-')})
    for t in ['Insights', 'Doctrine', 'Practice']:
        await db.tags.insert_one({'id': secrets.token_hex(8), 'name': t, 'slug': t.lower()})

    print('[seed] documents (6) on the filesystem...')
    docs_dir = UPLOAD_DIR / 'documents'
    docs_dir.mkdir(exist_ok=True)
    sample_docs = [
        {'title': 'Membership Covenant \u2014 Marsh', 'athlete_idx': 0, 'visibility': 'member', 'body': 'PROOF Covenant of Engagement.\n\nFor: Devon Marsh.\n\nThis covenant outlines the private relationship between Member and Firm.'},
        {'title': 'Quarterly Strategy Memo \u2014 Q1', 'athlete_idx': 1, 'visibility': 'member', 'body': 'Q1 2026 strategy memorandum for Amara Knight.'},
        {'title': 'Brand Architecture Brief', 'athlete_idx': 2, 'visibility': 'member', 'body': 'Brand architecture brief.'},
        {'title': 'Eligibility Note', 'athlete_idx': 5, 'visibility': 'member', 'body': 'Eligibility considerations for NIL.'},
        {'title': 'Press Strategy Outline', 'athlete_idx': 0, 'visibility': 'member', 'body': 'Press strategy outline.'},
        {'title': 'Family Communication Plan', 'athlete_idx': 0, 'visibility': 'member', 'body': 'Family Communication Plan.'},
    ]
    for d in sample_docs:
        fid = secrets.token_hex(12)
        fname = f"{fid}.txt"
        (docs_dir / fname).write_text(d['body'])
        await db.documents.insert_one({
            'id': fid,
            'athlete_id': athlete_ids[d['athlete_idx']],
            'title': d['title'],
            'filename': d['title'].replace(' ', '_') + '.txt',
            'storage_path': fname,
            'mime': 'text/plain',
            'size': len(d['body']),
            'visibility': d['visibility'],
            'uploader_id': staff_ids['strategist'],
            'created_at': iso(now()),
        })

    print('[seed] events (4)...')
    events = [
        {'title': 'Strategy review \u2014 Marsh', 'start': now() + timedelta(days=2), 'end': now() + timedelta(days=2, hours=1),
         'athlete_idx': 0, 'location': 'Private \u00b7 NYC', 'description': 'Quarterly strategy review.'},
        {'title': 'Press preparation \u2014 Knight', 'start': now() + timedelta(days=4, hours=3),
         'athlete_idx': 1, 'location': 'Virtual', 'description': 'Pre-feature press preparation.'},
        {'title': 'Family briefing \u2014 Pereira', 'start': now() + timedelta(days=6),
         'athlete_idx': 2, 'location': 'Private', 'description': 'Family communication briefing.'},
        {'title': 'NIL workshop', 'start': now() + timedelta(days=10), 'athlete_idx': None,
         'location': 'Virtual', 'description': 'For all members.'},
    ]
    for e in events:
        athlete_id = athlete_ids[e['athlete_idx']] if e['athlete_idx'] is not None else None
        await db.events.insert_one({
            'id': secrets.token_hex(12),
            'athlete_id': athlete_id,
            'title': e['title'],
            'location': e.get('location'),
            'description': e.get('description'),
            'start': iso(e['start']),
            'end': iso(e.get('end') or (e['start'] + timedelta(hours=1))),
            'visibility': 'member',
            'created_at': iso(now()),
        })

    print('[seed] announcements (2)...')
    await db.announcements.insert_many([
        {'id': secrets.token_hex(12), 'title': 'Edition 2026.01 \u2014 Doctrine update',
         'body': 'We have updated our public doctrine page. Members may review the diff in the portal.',
         'audience': 'all', 'athlete_id': None, 'author_id': staff_ids['admin'],
         'published_at': iso(now() - timedelta(days=1)), 'created_at': iso(now() - timedelta(days=1))},
        {'id': secrets.token_hex(12), 'title': 'Office hours \u2014 February',
         'body': 'Strategist office hours are now scheduled. Open a thread to request a slot.',
         'audience': 'members', 'athlete_id': None, 'author_id': staff_ids['strategist'],
         'published_at': iso(now() - timedelta(hours=4)), 'created_at': iso(now() - timedelta(hours=4))},
    ])

    print('[seed] message threads (2 with strategist)...')
    for member_idx in (0, 1):
        athlete_idx = members[member_idx]['athlete_idx']
        tid = secrets.token_hex(12)
        await db.message_threads.insert_one({
            'id': tid,
            'subject': 'Welcome \u2014 first month plan',
            'member_id': member_ids[member_idx],
            'strategist_id': staff_ids['strategist'],
            'athlete_id': athlete_ids[athlete_idx],
            'last_message_at': iso(now()),
            'created_at': iso(now() - timedelta(days=2)),
        })
        await db.messages.insert_many([
            {'id': secrets.token_hex(12), 'thread_id': tid, 'sender_id': staff_ids['strategist'],
             'body': 'Welcome aboard. Outline of the first month attached in Documents.',
             'read_by': [staff_ids['strategist']],
             'created_at': iso(now() - timedelta(days=2))},
            {'id': secrets.token_hex(12), 'thread_id': tid, 'sender_id': member_ids[member_idx],
             'body': 'Received. Reviewing tonight.', 'read_by': [member_ids[member_idx]],
             'created_at': iso(now() - timedelta(days=1))},
        ])

    print('[seed] done.')
    print('\nLogin credentials (password = Proof2026!):')
    for s in staff:
        print(f"  {s['role']:>10}: {s['email']}")
    print('  Members:')
    for m in members:
        print(f"  {m['role']:>10}: {m['email']}")


if __name__ == '__main__':
    asyncio.run(seed())
