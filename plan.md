# PROOF™ — Development Plan (React + FastAPI + MongoDB)

## 1) Objectives
- Deliver a production-ready single codebase with 4 surfaces: **Public (/)**, **Member Portal (/portal)**, **Admin/CMS (/admin)**, **Brand Deck (/deck)**.
- Match reference site **pixel-close** (type, spacing, palette, hairlines, editorial restraint).
- Implement **invite-only email+password auth**, JWT sessions, **RBAC**, and strict data scoping.
- Build **WordPress-class CMS**: pages/posts, block editor, media library, menus, SEO, sitemap/robots, revisions+diff+restore, drafts/previews, scheduling.
- Build portal ops: documents vault (signed links + audit), calendar (+ ICS), messages (polling), announcements, account.
- Seed real, navigable data for staff + members + content.

## 2) Implementation Steps

### Phase 1 — Core-risk POC (isolation; fix until solid)
**Goal:** prove the most failure-prone workflows end-to-end before full UI build.
1. **Websearch best practices** (quick):
   - Motor + FastAPI patterns, JWT cookie vs header, APScheduler in FastAPI, secure signed download URLs.
2. **POC script(s) in `/backend/scripts/`** (no frontend):
   - Create user + login → JWT.
   - Create page draft → save revision → restore revision.
   - Schedule page publish (APScheduler tick) → status flips to published.
   - Upload media → Pillow generates variants → list/serve file.
   - Create doc → generate one-time signed link → fetch logs audit.
3. **Acceptance for Phase 1:** POC scripts run cleanly with real MongoDB and filesystem uploads.

**User stories (Phase 1)**
- As an owner, I can run a script to seed an initial user and log in to get a JWT.
- As an editor, I can save a page and see a revision recorded every time.
- As an editor, I can schedule a page and it auto-publishes without manual action.
- As an operator, I can upload an image and see thumb/medium/full generated.
- As a member, I can fetch a document via a one-time link and it is audited.

### Phase 2 — V1 App Development (public + admin shell + portal shell; minimal bulk, working)
**Goal:** full routed app with working backend APIs, baseline UI, and reference design tokens.
1. **Repo structure & env**
   - `/backend` FastAPI + Motor + APScheduler + uploads dir.
   - `/frontend` React + Router + Tailwind tokens + shared layout.
2. **Design system (frontend)**
   - Tailwind/CSS vars for obsidian/charcoal/ivory/bone/gold; hairline borders; no shadows; no rounded fills.
   - Fonts: Cormorant Garamond (display), Inter (body), JetBrains Mono (meta).
3. **Backend foundation**
   - Collections + indexes; Pydantic schemas.
   - Auth: invite-only, bcrypt, JWT (access+refresh), session timeout, sign-out-all.
   - RBAC dependency + resource scoping helpers.
   - Audit log helper for all mutations.
4. **Core CRUD routes (minimum to render full experience)**
   - Pages/posts (draft/published/scheduled/archived) + SEO meta + preview tokens.
   - Media upload/list/update alt/usage + serve variants.
   - Menus (header/footer) and menu items.
   - Athletes + roster + member links + strategist assignments.
   - Announcements, events (+ ICS), documents (signed link), message threads/messages (polling).
   - `GET /sitemap.xml`, `GET /robots.txt`.
5. **Frontend routing + base screens**
   - Public 10 pages scaffolded; block renderer renders content from CMS.
   - `/login` functional.
   - `/admin` shell with sidebar groups; key lists (Pages/Posts/Media/Roster).
   - `/portal` shell with sidebar; Today/Documents/Calendar/Messages/News/My Account.
6. **V1 testing pass (end-to-end)**
   - Run testing agent: public nav, login, admin create page, portal doc download, ICS export.

**User stories (Phase 2)**
- As a visitor, I can navigate all 10 public pages and the typography/spacing matches the reference.
- As an editor, I can create and publish a page and see it appear on the public route.
- As an editor, I can upload an image, set alt text, and reuse it in a page.
- As a member, I can log in and see Today + announcements + next event.
- As a member, I can download a document and the action is recorded in audit.

### Phase 3 — CMS “WordPress-class” completion (blocks, revisions+diff, scheduling, inline editing)
**Goal:** full CMS parity features and polished editor UX.
1. **Block editor (admin)**
   - Drag/drop with @dnd-kit; 17 block types; per-block settings sidebar.
   - Validation: required fields (e.g., image alt).
2. **Revisions**
   - Snapshot on every save; restore; diff view (JSON diff + readable text diff for key fields).
3. **Scheduling**
   - APScheduler job: scheduled→published; ensure sitemap reflects only published.
4. **Inline editing on public site**
   - If user has `edit_content`: floating toolbar, click-to-edit, reorder blocks, publish/discard.
5. **Menus & SEO**
   - Header/footer menu editor; site-wide SEO settings; canonical/robots per page.
6. **Analytics**
   - Capture events: sessions, logins, edits, downloads; admin charts (7d rolling).
7. **Phase test pass**
   - Testing agent: create scheduled page, wait/poke scheduler, verify publish + sitemap; revision restore; inline edit flow.

**User stories (Phase 3)**
- As an editor, I can build a page by dragging Hero+Image+CTA blocks and preview it.
- As an editor, I can compare two revisions and restore an earlier version.
- As an editor, I can schedule content and it publishes automatically and appears in sitemap.
- As an editor, I can edit a heading directly on the live page and publish safely.
- As an admin, I can edit menus and see the public header/footer update immediately.

### Phase 4 — Portal + Ops hardening (docs security, messaging, governance) + Brand Deck
**Goal:** production-grade controls, governance, and deck delivery.
1. **Documents vault**
   - Signed one-time links, expiry, audit on generate + fetch; visibility scoping by athlete + role.
2. **Messages**
   - Threads, participants, polling every 5s; strategist assignment routing.
3. **Governance**
   - Audit log filters; immutable append-only writes.
   - Settings: session timeout, MFA enforcement toggle (scaffold only; user opted out of TOTP).
4. **Brand deck (/deck)**
   - 27-slide HTML deck; gated by token; noindex; keyboard navigation.
5. **Final testing**
   - Testing agent: RBAC denial checks, audit log correctness, deck gating, robots/sitemap.

**User stories (Phase 4)**
- As a member, I can only see documents for my linked athlete(s) and my role.
- As a strategist, I can reply to member messages and see updates within polling interval.
- As an admin, I can filter the audit log by actor/resource and inspect diffs.
- As an owner, I can adjust session timeout and force sign-out-all for security.
- As a stakeholder, I can open a token-gated 27-slide deck; without token I’m blocked.

## 3) Next Actions
1. Implement Phase 1 POC scripts (auth, revisions, scheduler, media variants, signed docs) and run them locally.
2. Lock design tokens + typography in frontend (Tailwind + global CSS) to match reference.
3. Build backend core models/routes + seed script (must produce all required seed accounts/content).
4. Build V1 routes and screens for public/admin/portal; connect to APIs.
5. Run testing agent after Phase 2, then iterate into Phases 3–4.

## 4) Success Criteria
- Public site matches reference (type/palette/spacing/hairlines) and all 10 pages render from CMS-managed blocks.
- Auth is invite-only; RBAC enforced; read-only cannot mutate; portal/admin are **noindex**.
- CMS supports pages+posts with drafts/publish/schedule, menus, media library with variants+alt+usage.
- Revisions saved on every save; diff + restore works.
- Scheduled publishing works via APScheduler and updates sitemap.
- Portal: Today/Documents/Calendar/Messages/News/My Account all functional; docs served via signed links and audited; ICS export works.
- Audit log captures all mutations + key access events; analytics dashboard shows activity.
- Deck: 27 slides, token-gated, navigable.
- Testing agent passes end-to-end flows for US1–US16 (minus TOTP-specific items).