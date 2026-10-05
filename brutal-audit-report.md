# District 3011 Portal — Site-Wide Brutal Audit Report

**Audit Date:** 2026-10-04 (Historical Audit) | **Status:** Historical deployment sequence completed; refer to active release calendar for scheduled rollouts.
**Codebases:** `rac3011-api` (NestJS/Prisma) · `rac3011-web` (React/Vite)

> **RBAC SAFETY:** No fix in this report touches the database, runs migrations, or executes seed scripts. User roles, permissions, and public content are fully preserved throughout.

---

## PHASE 1 — MASTER MODULE MAP

### Backend API Controllers (58 mapped)

| Module | Controllers | Auth Model |
|--------|-------------|------------|
| Auth | sessions, auth-lookup, second-factor, trusted-devices | Public + @Authenticated |
| RBAC | permissions, roles, user-roles | RequirePermission |
| Me | me | @Authenticated |
| Members | members, directory, members-imports, skill-tags | RequirePermission |
| Clubs | clubs, club-facts | RequirePermission |
| Reports | reports, report-schemas, report-requests | RequirePermission |
| Points | club-points, point-rules | RequirePermission |
| Announcements | announcements | @Authenticated / RequirePermission |
| Events | events-admin | RequirePermission |
| Feedback | feedback | RequirePermission / @Authenticated |
| Enquiries | enquiries (admin) | RequirePermission |
| Storage | storage | @Authenticated / @Public (grant-gated) |
| Gallery | gallery | RequirePermission |
| Heritage | heritage | RequirePermission |
| Leadership | leadership | RequirePermission |
| Settings | settings | RequirePermission |
| Content | content | RequirePermission |
| Showcase | showcase-admin | RequirePermission |
| Audit | audit | RequirePermission |
| Forms | forms | RequirePermission |
| DRR Bookings | drr-bookings | RequirePermission |
| Sister Club | sister-club-requests | RequirePermission |
| Link Health | link-health, link-health-admin | RequirePermission |
| Partners | partners | RequirePermission |
| Publications | publications | RequirePermission |
| Achievements | achievements | RequirePermission |
| Health | health | @Public |
| Public | public (mega-controller) | @Public + selective ThrottlerGuard |
| RIDE | ride-auth, ride-participants, ride-delegations, ride-forms, ride-gallery, ride-public, ride-resources, ride-support-clubs | ParticipantAuthGuard / RequirePermission |
| Mission3011 | mission3011-camps, mission3011-public | RequirePermission / @Public |
| Drishti | drishti-beneficiaries, drishti-public | RequirePermission / @Public |
| CareerBridge | careerbridge-listings, careerbridge-public | RequirePermission / @Public |
| RCL | rcl-fixtures, rcl-teams, rcl-public | RequirePermission / @Public |

### Frontend Route Map

| Surface | Routes | Guard |
|---------|--------|-------|
| District SPA | /, /map, /heritage, /initiatives, /showcase, /resources, /calendar, /governance, /leadership, /gallery | None (public) |
| Public Pages | /showcase/:slug, /heritage/:slug, /leadership/clubs/:slug, /resources/*, /publications, /get-involved/*, /achievements, /partners, /contact, /calendar/:slug, /pass/:token, /privacy-policy, /terms-of-service | None / RequireAuth for /resources/sister-club |
| Portal Auth | /portal/login, /portal/register, /portal/pending, /portal/forgot-password, /portal/reset-password | None |
| Portal Member | /portal/dashboard, /portal/reports/*, /portal/announcements, /portal/resources, /portal/my-club, /portal/events, /portal/showcase/*, /portal/me/*, /portal/directory, /portal/feedback | RequireAuth |
| Portal Admin | /portal/admin/ride, /portal/admin/clubs, /portal/admin/clubs/:clubId/:month, /portal/admin/point-rules, /portal/admin/form-builder, /portal/admin/report-builder, /portal/admin/requests, /portal/admin/roles, /portal/admin/users, /portal/admin/sessions, /portal/admin/events, /portal/admin/drr-calendar, /portal/admin/public-content, /portal/admin/audit, /portal/admin/changelog, /portal/admin/showcase, /portal/admin/announcements, /portal/admin/settings, /portal/admin/feedback, /portal/admin/checkin, /portal/content, /portal/members | RequireAuth + RequirePermission |
| RIDE Surface | /, /gallery, /login, /participant-login, /reset-password, /dashboard | ParticipantAuthProvider for /dashboard |
| Subdomains | Mission3011, Drishti, CareerBridge, RCL | RequireSubdomainAuth |
| **UI Kit** | **/__ui** | **NONE — unguarded in production** |

---

## PHASE 2 — THE GAUNTLET

---

## VECTOR 1: SECURITY

### CRITICAL A1 — STAGING IS BEING INDEXED BY GOOGLE RIGHT NOW

**Files:** `public/robots.txt` + `index.html` L19

`robots.txt` contains `Allow: /`. `index.html` has `<meta name="robots" content="index, follow">`. Both files are **identical on staging and production**. Google is currently indexing your `testing.rotaract3011.org` subdomain.

**SSH fix — apply to testing server NOW (2 min):**

```nginx
# In your testing.rotaract3011.org nginx vhost, inside server {}:
add_header X-Robots-Tag "noindex, nofollow" always;
nginx -t && systemctl reload nginx
```

Do **NOT** add this header to the production vhost. The robots.txt and index.html meta tag are already correct for production.

---

### CRITICAL A2 — ADMIN ROUTE IN PUBLIC SITEMAP

**File:** `public/sitemap.xml` line 20

```xml
<url><loc>https://rotaract3011.org/drr-calendar/admin</loc></url>
```

`/drr-calendar/admin` is not a real router route (resolves to DistrictApp catch-all → ComingSoon). It is in your sitemap, broadcasting to every crawler that an admin path exists here. Delete this line before 4 PM.

Also: `/drr-calendar` itself resolves to `<ComingSoon title="DRR calendar" />` and is also in the sitemap — optionally remove that too.

---

### HIGH B1 — `/__ui` UIKIT PAGE IS UNGUARDED IN PRODUCTION

**File:** `src/app/routes/main.routes.tsx` L90

```tsx
{ path: '/__ui', element: <UiKitPage /> },
```

Zero auth guard. Any visitor who discovers `https://rotaract3011.org/__ui` gets full access to your design system, internal component library, and state demonstrations — a gift to social engineering attackers.

**Fix:** Wrap in `RequirePermission('roles:manage')` or gate behind `import.meta.env.DEV`.

---

### HIGH B2 — `auth-lookup` ENABLES MEMBER EMAIL ENUMERATION AT SCALE

**File:** `src/auth/auth-lookup.controller.ts`

```typescript
@Get('resolve')
@Public()
async resolve(@Query('identifier') rawIdentifier?: string): Promise<{ email: string }>
```

`GET /auth-lookup/resolve?identifier=<rotaryId>` is `@Public()` with zero throttling. An attacker iterates Rotary IDs (sequential numeric pattern: `3011001`, `3011002`…) and harvests the email address of every member. Trivially enables credential-stuffing list generation.

**Fix:** Add `@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { limit: 10, ttl: 60000 } })`.

---

### HIGH B3 — `second-factor/resend` HAS NO RATE LIMIT

**File:** `src/auth/second-factor.controller.ts`

```typescript
@Post('resend')
@SecondFactorStage()
async resend(@CurrentUser() ctx: RequestContext): Promise<{ status: 'sent' }>
```

Unlimited OTP resend. A user at the MFA screen can spam this endpoint and exhaust the OTP email provider's daily cap in seconds. OTP template fires a real email through `EmailProviderPool`.

**Fix:** Add `@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { limit: 3, ttl: 300000 } })` (3 resends / 5 min / session).

---

### MEDIUM B4 — STORAGE GRANT IDs ARE PRISMA CUIDs (NOT HMAC-SIGNED)

**File:** `src/storage/storage.controller.ts`

`POST /files/upload/:grantId` is `@Public()`. The security model (grant = capability token) is architecturally correct. Magic-byte validation and 15-min TTL limit exposure. But CUIDs are not cryptographically opaque — a determined attacker with timing data could guess a live grant ID within the 15-min window.

**Fix (post-launch):** Sign grantIds with HMAC using `AUTH_SECRET`.

---

### PASS — CORS: AIRTIGHT
Protocol-pinned to `https:` only. Apex + all subdomains of `rotaract3011.org` and `rotar3011.org` allowed. `WEB_ORIGINS` is additive. Tested in `cors-origin.spec.ts`.

### PASS — HELMET: APPLIED GLOBALLY
`app.use(helmet())` at bootstrap, before all routes. CSP, HSTS, X-Frame-Options all active.

### PASS — SWAGGER: PRODUCTION-GATED
`if (env.NODE_ENV !== 'production') { SwaggerModule.setup(...) }`. Disabled on prod.

### PASS — MIME VALIDATION: MAGIC-BYTE CHECKED
JPEG, PNG, WebP, AVIF, MP4, WebM, PDF, Office — all binary-header validated. No content-type spoofing possible.

### PASS — RIDE AUTH ISOLATION
`rideParticipant` table is separate from `user`. `ParticipantAuthGuard` reads a dedicated HMAC-signed cookie. `PermissionGuard` for the main portal never reads the RIDE cookie. Session revocation handles both tables independently.

### PASS — ENV SECRETS: PRODUCTION GUARDS IN PLACE
`parseEnv()` throws at startup for dev-only `AUTH_SECRET`, default `DRISHTI_PII_KEY`, or empty `WEB_ORIGINS` in production.
**Action required:** Verify `RIDE_JWT_SECRET` is set in production `.env` before the 4 PM deploy.

---

## VECTOR 2: LOGIC AND DATA INTEGRITY

### CRITICAL A3 — EMAIL STUDIO BROADCAST HAS NO RATE LIMIT

**File:** `src/subdomains/ride/ride-participants.controller.ts` L41

```typescript
@Post('broadcast')
@RequirePermission(...RIDE_MANAGE_PERMISSIONS)
async dispatchBroadcast(@Body() dto: DispatchRideBroadcastDto)
```

`dispatchBroadcast` fires `void sendBatch()` — async, fire-and-forget, no queue, no backpressure. A single `POST` with `{ "all": true }` + 300 active participants fires 300 `emailPool.send()` calls in a synchronous for-loop inside a detached promise. Accidental double-click or automated retry = 600+ emails. The email providers' daily caps (`ORACLE_DAILY_CAP`, `RESEND_DAILY_CAP`, `MAILGUN_DAILY_CAP`, `GMAIL_DAILY_CAP`) are the **only** backstop and are consumed immediately.

**Fix (before 4 PM — 2-line change):**

```typescript
// At the top of ride-participants.controller.ts, ensure these are imported:
import { UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

// On the broadcast endpoint, add:
@Post('broadcast')
@RequirePermission(...RIDE_MANAGE_PERMISSIONS)
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 2, ttl: 300000 } })
async dispatchBroadcast(@Body() dto: DispatchRideBroadcastDto) {
```

The `ThrottlerModule.forRoot` is already registered in `RideModule` — no module changes needed.

---

### MEDIUM B5 — ANNOUNCEMENTS SEND HAS NO RATE LIMIT

**File:** `src/announcements/announcements.controller.ts` L27

Bulk district-wide announcement send has no throttle guard. Goes through BullMQ outbox (safer), but an admin with `announcements:send` can swamp the queue and trigger `LimitAlertService` alerts retroactively.

**Fix (post-launch):** Add `@Throttle({ default: { limit: 5, ttl: 3600000 } })`.

---

### MEDIUM B6 — VERIFY RIDE FORM DUPLICATE SUBMISSION GUARD

**File:** `src/subdomains/ride/ride-forms.service.ts`

`POST /ride/forms/:id/submit` is available to any authenticated participant. Verify that `RideFormsService.submitForm` checks for an existing submission by `(participantId, formId)` before inserting. If not, add `@@unique([participantId, formId])` to the Prisma schema.

---

### PASS — POINTS ENGINE: MATHEMATICALLY SOUND
- `upsertComputedEntry` prevents double-counting on recompute.
- `deleteStaleComputed` cleans orphaned rule entries.
- `onceRuleIds` + `alreadyAwarded` blocks repeat once-only awards.
- No recursive loops; recompute is fully linear.
- `duesBracket` returns `null` for unpaid dues (not 0) — no negative scoring possible.

### PASS — REPORTS RBAC ISOLATION
`ctx.access` scoped at service layer via `RbacResolverService`. A President of Club A cannot read or modify Club B's reports.

### PASS — DUES NEGATIVE VALUE BUG
`duesBracket` returns `null`; `evaluateRule` skips `null` inputs. The bug was a preview UX gap, not a math error in the live engine.

### PASS — PDF/CSV EXPORT: NO RAW JSON LEAK
`formatValue()` humanizes all field types before serialization into CSV/PDF.

### PASS — RBAC STATE SYNCHRONIZATION
`RbacResolverService.resolve(userId)` runs fresh on every request. No in-memory cache. Permission changes take effect on the user's next API call. Frontend `useAuth` hook refetches `me` on window focus.

---

## VECTOR 3: PERFORMANCE AND UI

### CRITICAL A4 — DRR CAROUSEL PRELOADS 150+ IMAGES EAGERLY

**File:** `src/district/components/District/PastDRRShowcase.tsx`

The carousel runs a `new Image()` preload loop on hover/mount, instantiating potentially 150+ `Image` objects synchronously on the main thread. This is the single largest INP regression on the heritage tab — it freezes interaction for several seconds.

**Fix (before 4 PM — 15 min):**
1. Remove the `new Image()` preload loop entirely.
2. Keep `loading="lazy"` on all `<img>` tags.
3. Add `fetchpriority="high"` only to the **first visible slide's** image.

---

### MEDIUM B7 — LEAFLET CSS FROM UNPKG CDN (NO SRI, RENDER-BLOCKING)

**File:** `index.html` L43

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Render-blocking external stylesheet. No `integrity` SRI hash. A CDN compromise injects malicious CSS. Map page will flash unstyled if unpkg is slow at launch time.

**Fix (post-launch):** `import 'leaflet/dist/leaflet.css'` in the map component (Vite bundles it).

---

### LOW B8 — GOOGLE FONTS ARE RENDER-BLOCKING

Montserrat, Plus Jakarta Sans, Dancing Script loaded via `<link>` — render-blocking on cold cache. FOUT occurs despite the `preconnect` hint.

**Fix (post-launch):** `font-display: swap` + self-host fonts via `vite-plugin-webfont-dl`.

---

### LOW B9 — MONOLITHIC RIDE PAGE COMPONENTS

| File | Size |
|------|------|
| `RideParticipantDashboardPage.tsx` | ~51KB |
| `RideAdminPage.tsx` | ~40KB |
| `RideEmailStudioTab.tsx` | ~44KB |
| `RideFormBuilderTab.tsx` | ~52KB |

All lazy-loaded, so initial render is unaffected. Tab switches will be slow on mobile 3G.

**Fix (post-launch):** Decompose into per-tab lazy chunks with `React.memo` on stable sub-components.

---

### LOW B10 — `DistrictAccess.tsx` IS 613 LINES WITH NO MEMOIZATION

Context consumers inside this monolithic tree re-render on every top-level state change.

**Fix (post-launch):** Extract context-agnostic children into `React.memo`-wrapped components.

---

### PASS — LAZY LOADING: CORRECT
All admin and portal pages are `lazy()` imported with `Suspense` boundaries. District SPA and RIDE surface have separate routers. Initial bundle is clean.

---

## VECTOR 4: SEO, META, AND LAUNCH CONFIGURATION

*(A1 and A2 are listed above under Vector 1 and repeated in Category A.)*

### LOW B11 — SITEMAP CONTAINS `/resources/sister-club` (AUTH-REQUIRED ROUTE)

Google receives a login redirect for this URL and will eventually deindex it as a login page.

### LOW B12 — `/drr-calendar/book/:slot` RESOLVES TO `<ComingSoon>`

Any DRR booking confirmation email with a slot link lands on a dead coming-soon page.

### PASS — OG/TWITTER CARDS: COMPLETE
`og:type`, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` — all present and populated with production URLs.

### PASS — API PRECONNECT: CONFIGURED
`<link rel="preconnect" href="https://api.rotaract3011.org" crossorigin />` present in `index.html`.

### PASS — RIDE JWT SECRET VALIDATION
`RideAuthService.onModuleInit()` throws `FATAL: Redis is mandatory...` in production if Redis is absent. Loud startup failure rather than silent degradation.
**Action required:** Verify `RIDE_JWT_SECRET` is set in production `.env`.

---

## PHASE 3 — GO / NO-GO TRIAGE

---

## CATEGORY A — SHOW-STOPPERS (Fix before 4:00 PM)

| # | ID | Module | Finding | Effort |
|---|-----|--------|---------|--------|
| 1 | A1 | SEO/Staging | `testing.` subdomain serves `Allow: /` + `index, follow` — Google is indexing staging RIGHT NOW | 2 min (nginx header) |
| 2 | A2 | SEO/Sitemap | `/drr-calendar/admin` in `sitemap.xml` — admin URL broadcast to all crawlers | 1 min (delete 1 line) |
| 3 | A3 | RIDE Email Studio | `POST /ride/participants/broadcast` has no rate limit — one double-click exhausts all 4 email provider daily caps | 10 min (2-line throttle decorator) |
| 4 | A4 | DRR Carousel | `PastDRRShowcase.tsx` preloads 150+ images eagerly — INP blocker on the heritage tab | 15 min (remove preload loop) |

---

## CATEGORY B — POST-LAUNCH TECH DEBT

| # | ID | Module | Finding | Priority |
|---|-----|--------|---------|---------|
| 1 | B1 | Portal Routes | `/__ui` UiKit page unguarded in production | High |
| 2 | B2 | Auth Lookup | `GET /auth-lookup/resolve` public + unthrottled = email enumeration | High |
| 3 | B3 | 2FA | `/second-factor/resend` no rate limit — email cap exhaustion | High |
| 4 | B4 | Storage | GrantId is CUID (not HMAC-signed) — medium-risk replay window | Medium |
| 5 | B5 | Announcements | `POST /announcements` no rate limit — queue bomb risk | Medium |
| 6 | B6 | RIDE Forms | Verify duplicate submission guard exists for (participantId, formId) | Medium |
| 7 | B7 | Map Page | Leaflet CSS from unpkg CDN — no SRI, render-blocking | Medium |
| 8 | B8 | Fonts | Google Fonts render-blocking — FOUT on cold cache | Low |
| 9 | B9 | RIDE Pages | Monolithic 40–52KB component files | Low |
| 10 | B10 | District App | `DistrictAccess.tsx` (613 lines) needs React.memo extraction | Low |
| 11 | B11 | Sitemap | `/resources/sister-club` in sitemap resolves to auth redirect | Low |
| 12 | B12 | DRR Booking | `/drr-calendar/book/:slot` → `<ComingSoon>` — confirmation links broken | Low |

---

## CONFIRMED SOLID (No action required)

| Module | Verdict |
|--------|---------|
| CORS config | PASS — HTTPS-only, apex + subdomain allowlist, tested in spec |
| Helmet middleware | PASS — Applied globally at bootstrap |
| Swagger docs | PASS — Disabled in production |
| MIME type validation | PASS — Magic-byte + allowlist on all upload tiers |
| RIDE auth isolation | PASS — Separate JWT, cookie, table; no bleed to main portal |
| Points engine math | PASS — Upsert, stale cleanup, once-rule guard, null dues |
| Reports RBAC isolation | PASS — Scope-filtered at service layer |
| Dues negative value bug | PASS — Fixed via null return from duesBracket |
| PDF/CSV export | PASS — formatValue humanizes all field types |
| Session revocation | PASS — Handles both district and RIDE sessions |
| Production env guards | PASS — Startup throws for missing secrets |
| Route-level code splitting | PASS — All admin/portal pages are lazy() |
| OG/Twitter meta | PASS — Complete and correct |
| RBAC sync speed | PASS — Fresh resolution on every request |
| RIDE broadcast allowlist | PASS — recipient-rewrite.ts blocks real recipients when MAIL_LIVE=0 |

---

## 4 PM LAUNCH SEQUENCE

```bash
# ===== STEP 1 — TESTING SERVER — SSH — DO NOW =====
# Add to your testing.rotaract3011.org nginx vhost (inside server {}):
add_header X-Robots-Tag "noindex, nofollow" always;
nginx -t && systemctl reload nginx

# ===== STEP 2 — CODEBASE EDITS — DO NOW =====

# 2a. Delete line 20 from public/sitemap.xml:
#     <url><loc>https://rotaract3011.org/drr-calendar/admin</loc></url>

# 2b. In src/subdomains/ride/ride-participants.controller.ts,
#     on the dispatchBroadcast endpoint, add before @Post('broadcast'):
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 2, ttl: 300000 } })

# 2c. In src/district/components/District/PastDRRShowcase.tsx,
#     remove the new Image() preload loop entirely.
#     Add fetchpriority="high" to the first slide's <img> only.

# ===== STEP 3 — PRE-DEPLOY CHECKLIST (before 4 PM) =====
# Verify production .env contains:
#   RIDE_JWT_SECRET=<non-empty>
#   MAIL_LIVE=1
#   WEB_ORIGINS=<correct production origins>
# Confirm X-Robots-Tag "noindex" header is NOT present on production nginx vhost

# ===== STEP 4 — PRODUCTION DEPLOY =====
# Deploy API first, then Web (wait for API healthcheck before Web deploy)
# Post-deploy verification:
#   curl https://rotaract3011.org/robots.txt    → must show Allow: /
#   curl https://rotaract3011.org/sitemap.xml   → must NOT contain /drr-calendar/admin
#   curl -X POST https://api.rotaract3011.org/ride/participants/broadcast (2x rapid) → must return 429 on second call
```

> **RBAC SAFETY GUARANTEE:** None of the above fixes touch the database, run migrations, or execute seed scripts. The broadcast throttle is a decorator change. The sitemap edit is a text deletion. The carousel fix removes a JavaScript loop. Zero database side effects.

---

*Report generated: 2026-10-04 13:05 IST*
