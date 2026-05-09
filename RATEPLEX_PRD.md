# Rate-Plex — Product Requirements Document (PRD)

> **Version:** 1.0 | **Last Updated:** 2026  
> **For:** AI Agent (Antigravity) — Full autonomous build guide  
> **Contest:** STN AI-Driven Full Stack Project Contest

---

## 1. Project Overview

**Rate-Plex** is a full-stack, AI-powered media rating and tracking platform — think IMDb meets MyAnimeList, with a Netflix-inspired visual identity. Users can discover, rate, review, and track movies, series, and anime across all watch states (watching, completed, plan to watch, etc.). Admins manage all media content and moderate user activity.

**Design Identity:**
- Primary color: `#E50914` (Netflix Red)
- Secondary: `#141414` (Deep Black)
- Neutral: `#B3B3B3` (Muted Gray)
- Support full **light and dark mode** with proper contrast
- Design inspiration: Netflix's layout + [ankergames.net](https://ankergames.net) card style
- Max 3 primary colors + neutral

**Repos:**
- Backend: `rate-plex-backend` (Node.js + Express + Prisma — partially built)
- Frontend: `rate-plex-frontend` (Next.js — not started)

---

## 2. Current Backend State (What Already Exists)

The backend is scaffolded and the database schema is defined. **Do NOT recreate these — pick up from here.**

### 2.1 What Exists
- `src/app.ts` — Express app with CORS, cookie-parser, JSON middleware, and route mounting at `/api/v1`
- `src/server.ts` — Bootstrap server with `envVars.PORT`
- `src/app/config/env.ts` — Environment config (referenced but not attached — recreate with all vars from Section 7)
- `prisma/schema/` — Split Prisma schema files (multi-file schema setup via `prisma.config.ts`)
- Prisma migration already run once (`migration.sql` exists)
- `package.json` — All core dependencies installed (Express 5, Prisma 7, bcrypt, JWT, Zod, etc.)
- `tsconfig.json` — ESM + TypeScript strict mode, output to `dist/`
- `prisma.config.ts` — Points schema to `prisma/schema/`, migrations to `prisma/migrations/`

### 2.2 What Does NOT Exist Yet (Must Build/Check if exists)
- `src/app/config/env.ts` — environment variable loader
- `src/app/routes/index.ts` — main route aggregator
- `src/app/middleware/globalErrorHandler.ts` — error handler
- All feature modules (auth, media, review, watchlist, genre, user, admin, AI)
- No controllers, services, validators, or route handlers exist yet

---

## 3. Schema — Final Prisma Models

> The schema uses **Prisma multi-file** setup. Each model is in `prisma/schema/[model].prisma`. The `prisma/schema/schema.prisma` is the base config file.

**IMPORTANT SCHEMA CHANGES NEEDED** — update these models from what was previously defined:

### 3.1 `prisma/schema/schema.prisma` (base — keep as is)
```prisma
generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

### 3.2 `prisma/schema/user.prisma` — ADD `avatar`, `bio`, `googleId`
```prisma
model User {
  id       String  @id @default(uuid())
  name     String
  email    String  @unique
  password String?        // nullable for Google OAuth users
  googleId String? @unique
  avatar   String?
  bio      String?
  role     Role    @default(USER)

  reviews       Review[]
  likes         Like[]
  comments      Comment[]
  watchlist     Watchlist[]
  subscriptions Subscription[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email], name: "idx_user_email")
  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

### 3.3 `prisma/schema/media.prisma` — ADD `type`, `posterUrl`, `trailerUrl`, `status`, `episodes`, `seasons`, `duration`
```prisma
model Media {
  id          String    @id @default(uuid())
  title       String
  description String?
  releaseYear Int?
  director    String?
  cast        String[]
  platform    String[]
  priceType   PriceType
  streamingLink String
  type        MediaType @default(MOVIE)
  status      MediaStatus @default(RELEASED)
  posterUrl   String?
  trailerUrl  String?
  duration    Int?      // in minutes, for movies
  episodes    Int?      // for series/anime
  seasons     Int?      // for series/anime
  country     String?
  language    String?

  averageRating Float @default(0.0)
  reviewCount   Int   @default(0)

  reviews   Review[]
  watchlist Watchlist[]
  genres    MediaGenre[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("media")
}

enum PriceType {
  FREE
  PREMIUM
}

enum MediaType {
  MOVIE
  SERIES
  ANIME
}

enum MediaStatus {
  RELEASED
  ONGOING
  UPCOMING
  CANCELLED
}
```

### 3.4 `prisma/schema/watchlist.prisma` — ADD `status` field
```prisma
model Watchlist {
  id      String        @id @default(uuid())
  userId  String
  mediaId String
  status  WatchStatus   @default(PLAN_TO_WATCH)

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  media Media @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, mediaId])
  @@index([userId], name: "idx_watchlist_userId")
  @@index([mediaId], name: "idx_watchlist_mediaId")
  @@map("watchlist")
}

enum WatchStatus {
  WATCHING
  COMPLETED
  PLAN_TO_WATCH
  ON_HOLD
  DROPPED
}
```

### 3.5 `prisma/schema/review.prisma` — keep as is
```prisma
model Review {
  id      String @id @default(uuid())
  userId  String
  mediaId String

  rating    Int
  content   String?
  isSpoiler Boolean      @default(false)
  status    ReviewStatus @default(PENDING)

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  media    Media     @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  likes    Like[]
  comments Comment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("reviews")
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### 3.6 `prisma/schema/genre.prisma` — keep as is
```prisma
model Genre {
  id   String @id @default(uuid())
  name String @unique
  media MediaGenre[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name], name: "idx_genre_name")
  @@map("genre")
}

model MediaGenre {
  id      String @id @default(uuid())
  mediaId String
  genreId String

  media Media @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  genre Genre @relation(fields: [genreId], references: [id], onDelete: Cascade)

  @@unique([mediaId, genreId])
  @@index([mediaId], name: "idx_media_genre_mediaId")
  @@index([genreId], name: "idx_media_genre_genreId")
  @@map("media_genres")
}
```

### 3.7 `prisma/schema/interaction.prisma` — keep as is (Like + Comment)

### 3.8 `prisma/schema/subscription.prisma` — keep as is

---

## 4. Backend Architecture & Folder Structure

```
rate-plex-backend/
├── prisma/
│   ├── config.ts
│   ├── migrations/
│   └── schema/
│       ├── schema.prisma
│       ├── user.prisma
│       ├── media.prisma
│       ├── genre.prisma
│       ├── review.prisma
│       ├── interaction.prisma
│       ├── watchlist.prisma
│       └── subscription.prisma
├── src/
│   ├── generated/prisma/        ← Prisma client output
│   ├── app/
│   │   ├── config/
│   │   │   ├── env.ts           ← Zod-validated env loader
│   │   │   └── prisma.ts        ← Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── auth.middleware.ts    ← verifyToken, requireRole
│   │   │   └── rateLimiter.ts       ← express-rate-limit
│   │   ├── utils/
│   │   │   ├── AppError.ts          ← Custom error class
│   │   │   ├── catchAsync.ts        ← Async wrapper
│   │   │   ├── sendResponse.ts      ← Standardized response shape
│   │   │   ├── logger.ts            ← Winston logger
│   │   │   └── jwt.utils.ts         ← sign/verify JWT
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.validation.ts
│   │   │   ├── user/
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── user.validation.ts
│   │   │   ├── media/
│   │   │   │   ├── media.routes.ts
│   │   │   │   ├── media.controller.ts
│   │   │   │   ├── media.service.ts
│   │   │   │   └── media.validation.ts
│   │   │   ├── genre/
│   │   │   │   ├── genre.routes.ts
│   │   │   │   ├── genre.controller.ts
│   │   │   │   └── genre.service.ts
│   │   │   ├── review/
│   │   │   │   ├── review.routes.ts
│   │   │   │   ├── review.controller.ts
│   │   │   │   ├── review.service.ts
│   │   │   │   └── review.validation.ts
│   │   │   ├── watchlist/
│   │   │   │   ├── watchlist.routes.ts
│   │   │   │   ├── watchlist.controller.ts
│   │   │   │   └── watchlist.service.ts
│   │   │   ├── interaction/
│   │   │   │   ├── interaction.routes.ts
│   │   │   │   ├── interaction.controller.ts
│   │   │   │   └── interaction.service.ts
│   │   │   └── ai/
│   │   │       ├── ai.routes.ts
│   │   │       ├── ai.controller.ts
│   │   │       └── ai.service.ts
│   │   └── routes/
│   │       └── index.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Backend API Endpoints

All routes prefixed with `/api/v1`. All protected routes require `Authorization: Bearer <token>` header.

**Standard response shape:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

### 5.1 Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Register with name, email, password |
| POST | `/login` | Public | Login, returns accessToken + refreshToken (httpOnly cookie) |
| POST | `/google` | Public | Google OAuth — receive googleId + profile, create/find user |
| POST | `/refresh` | Public | Refresh access token from cookie |
| POST | `/logout` | Protected | Clear refresh token cookie |
| GET | `/me` | Protected | Get current user profile |

### 5.2 User — `/api/v1/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | Get all users with pagination + filter |
| GET | `/:id` | Protected | Get user profile by ID |
| PATCH | `/profile` | Protected | Update own profile (name, bio, avatar) |
| PATCH | `/change-password` | Protected | Change password |
| DELETE | `/:id` | Admin | Delete user |
| PATCH | `/:id/role` | Admin | Update user role |
| GET | `/:id/stats` | Protected | Get user stats (reviews, watchlist counts) |

### 5.3 Media — `/api/v1/media`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List media — supports: `?search=`, `?type=MOVIE\|SERIES\|ANIME`, `?genre=`, `?year=`, `?rating=`, `?priceType=`, `?sort=rating\|year\|title\|reviewCount`, `?page=`, `?limit=` |
| GET | `/:id` | Public | Get single media with genres, avg rating, review count |
| GET | `/:id/reviews` | Public | Get reviews for a media item (paginated) |
| POST | `/` | Admin | Create media |
| PATCH | `/:id` | Admin | Update media |
| DELETE | `/:id` | Admin | Delete media |
| GET | `/featured` | Public | Get featured/trending media (top rated, most reviewed) |
| GET | `/stats` | Admin | Media stats for dashboard |

### 5.4 Genre — `/api/v1/genres`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all genres |
| POST | `/` | Admin | Create genre |
| DELETE | `/:id` | Admin | Delete genre |

### 5.5 Review — `/api/v1/reviews`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Protected | Create review (rating 1–10, optional content) |
| PATCH | `/:id` | Protected | Update own review |
| DELETE | `/:id` | Protected | Delete own review |
| GET | `/` | Admin | All reviews with filter (status, media, user) |
| PATCH | `/:id/status` | Admin | Approve or reject review |
| GET | `/my` | Protected | Get own reviews |

### 5.6 Watchlist — `/api/v1/watchlist`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Protected | Get own watchlist (filterable by status) |
| POST | `/` | Protected | Add media to watchlist with status |
| PATCH | `/:id` | Protected | Update watchlist entry status |
| DELETE | `/:id` | Protected | Remove from watchlist |

### 5.7 Interactions — `/api/v1/interactions`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/likes/:reviewId` | Protected | Toggle like on a review |
| POST | `/comments` | Protected | Add comment to a review |
| DELETE | `/comments/:id` | Protected | Delete own comment |

### 5.8 AI — `/api/v1/ai`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/recommendations` | Protected | Get AI-powered media recommendations |
| POST | `/chat` | Protected | AI chat assistant (context-aware) |
| POST | `/analyze-taste` | Protected | Analyze user's watch history and taste |
| POST | `/review-sentiment` | Protected | Summarize community sentiment for a media |
| POST | `/auto-tag` | Admin | Auto-generate tags/description for new media |

### 5.9 Dashboard — `/api/v1/dashboard`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | Admin | User count, media count, review count, sub count |
| GET | `/admin/recent-activity` | Admin | Recent registrations, reviews, subs |
| GET | `/admin/charts/media-by-type` | Admin | Media breakdown by type |
| GET | `/admin/charts/reviews-over-time` | Admin | Review submissions over time |
| GET | `/admin/charts/top-rated` | Admin | Top 10 rated media |
| GET | `/user/stats` | Protected | Personal stats for user dashboard |

---

## 6. AI Features (Minimum 4 — All Required)

Use **Anthropic Claude API** (`claude-sonnet-4-20250514`) for all AI features. All AI calls must handle loading state, errors, and return structured JSON.

### AI Feature 1 — Smart Recommendations
**Endpoint:** `POST /api/v1/ai/recommendations`  
**Input:** User's watchlist (titles + genres + ratings), preferences  
**Prompt approach:** Send user history as context, ask Claude to return JSON array of recommendations with title, reason, and match score  
**Output:**
```json
{
  "recommendations": [
    { "title": "...", "reason": "...", "matchScore": 92, "genre": "..." }
  ]
}
```
**Frontend use:** Shown in user dashboard + media explore page sidebar

### AI Feature 2 — AI Watch Assistant (Chatbot)
**Endpoint:** `POST /api/v1/ai/chat`  
**Input:** `{ message: string, history: [{role, content}] }`  
**System prompt:** "You are RatePlex's AI assistant. Help users discover movies, series, and anime. Answer questions about content, suggest what to watch, and explain ratings. Be concise and friendly."  
**Output:** Streaming or standard text response  
**Frontend use:** Floating chat button on every page, context-aware modal

### AI Feature 3 — Taste Analyzer
**Endpoint:** `POST /api/v1/ai/analyze-taste`  
**Input:** User's completed watchlist + ratings  
**Prompt approach:** Analyze genres, ratings patterns, and preferred types. Return a personality profile.  
**Output:**
```json
{
  "profile": "Psychological Thriller Enthusiast",
  "traits": ["Prefers slow-burn narratives", "Values complex characters", "Favors Japanese animation"],
  "topGenres": ["Thriller", "Drama", "Anime"],
  "insight": "You're drawn to morally ambiguous stories with deep character arcs..."
}
```
**Frontend use:** User dashboard "My Taste Profile" card

### AI Feature 4 — Community Sentiment Summary
**Endpoint:** `POST /api/v1/ai/review-sentiment`  
**Input:** `{ mediaId }` — backend fetches up to 50 approved reviews  
**Prompt approach:** Summarize overall community sentiment from review content  
**Output:**
```json
{
  "summary": "Audiences praise the stunning visuals and emotional depth, though some find the pacing slow in early episodes.",
  "positiveThemes": ["Visual quality", "Character development"],
  "negativeThemes": ["Slow pacing", "Predictable plot"],
  "sentimentScore": 78
}
```
**Frontend use:** Media detail page below reviews section

### AI Feature 5 (Bonus) — Admin Auto-Tag / Description Generator
**Endpoint:** `POST /api/v1/ai/auto-tag`  
**Input:** `{ title, releaseYear, type, director }`  
**Output:**
```json
{
  "description": "...",
  "suggestedGenres": ["Action", "Sci-Fi"],
  "suggestedTags": ["space opera", "ensemble cast"],
  "ageRating": "PG-13"
}
```
**Frontend use:** Admin "Add Media" form — "Auto-fill with AI" button

---

## 7. Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/rateplex

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

ANTHROPIC_API_KEY=your_anthropic_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 8. Frontend Architecture

### 8.1 Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (auth store, UI store)
- **Data Fetching:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion
- **HTTP Client:** Axios (with interceptors for token refresh)
- **Auth:** NextAuth.js (for Google OAuth) + custom JWT handling

### 8.2 Folder Structure
```
rate-plex-frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  ← Landing/Home
│   │   ├── browse/page.tsx           ← Explore/Browse page
│   │   ├── media/[id]/page.tsx       ← Media detail page
│   │   ├── about/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── contact/page.tsx
│   │   └── help/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← Dashboard shell (sidebar + topbar)
│   │   ├── dashboard/
│   │   │   ├── page.tsx              ← User dashboard home
│   │   │   ├── watchlist/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── recommendations/page.tsx  ← AI feature
│   │   │   └── profile/page.tsx
│   │   └── admin/
│   │       ├── page.tsx              ← Admin overview
│   │       ├── media/page.tsx        ← Media management
│   │       ├── media/new/page.tsx    ← Add media
│   │       ├── media/[id]/edit/page.tsx
│   │       ├── users/page.tsx
│   │       ├── reviews/page.tsx
│   │       └── genres/page.tsx
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx                    ← Root layout (providers, fonts)
│   └── globals.css
├── components/
│   ├── ui/                           ← shadcn/ui components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── DashboardTopbar.tsx
│   ├── media/
│   │   ├── MediaCard.tsx             ← Reusable card (same height/width)
│   │   ├── MediaCardSkeleton.tsx
│   │   ├── MediaGrid.tsx
│   │   ├── MediaFilters.tsx
│   │   ├── MediaCarousel.tsx
│   │   └── RatingStars.tsx
│   ├── review/
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewForm.tsx
│   │   └── SentimentBadge.tsx
│   ├── ai/
│   │   ├── ChatWidget.tsx            ← Floating AI chat
│   │   ├── RecommendationCard.tsx
│   │   ├── TasteProfileCard.tsx
│   │   └── SentimentSummary.tsx
│   └── shared/
│       ├── PageLoader.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfirmDialog.tsx
│       └── DataTable.tsx             ← Reusable table with filter + pagination
├── lib/
│   ├── axios.ts                      ← Axios instance + interceptors
│   ├── auth.ts                       ← NextAuth config
│   └── utils.ts                      ← cn(), formatDate(), etc.
├── hooks/
│   ├── useAuth.ts
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
├── store/
│   ├── authStore.ts                  ← Zustand auth state
│   └── uiStore.ts                    ← Zustand UI state (theme, chat open)
├── types/
│   ├── media.types.ts
│   ├── user.types.ts
│   ├── review.types.ts
│   └── api.types.ts
└── queries/
    ├── media.queries.ts              ← TanStack Query hooks for media
    ├── review.queries.ts
    ├── watchlist.queries.ts
    └── ai.queries.ts
```

---

## 9. Page-by-Page Specifications

### 9.1 Home / Landing Page
The landing page is public-facing and must include exactly these sections:

1. **Navbar** — Full-width, sticky, `#141414` bg. Logo left. Links: Browse, About, Blog, Contact, Help (logged out: + Login/Register button). Logged in: + Dashboard, + Profile dropdown (Profile, Watchlist, Logout).
2. **Hero Section** — 65vh height. Auto-playing carousel of featured media with poster backgrounds (blurred). CTA: "Start Exploring" + "Join Free". Animated title with typing effect.
3. **Trending This Week** — Horizontal scroll row of 6 media cards. Real data from API (top rated by `reviewCount` this week).
4. **Browse by Genre** — Pill/chip grid of all genres. Clicking navigates to `/browse?genre=X`.
5. **Top Rated Movies** — 4-column card grid (max 8 cards). Skeleton loaders.
6. **Top Rated Anime** — Same layout, filtered by type=ANIME.
7. **Platform Statistics** — Animated counter section: Total Movies, Total Anime, Total Reviews, Total Users.
8. **AI Features Showcase** — 3 feature cards explaining AI recommendations, taste analyzer, and chat assistant.
9. **User Testimonials / Reviews** — 3 most recent approved text reviews with user avatar, name, and rating.
10. **Newsletter Signup** — Email input + subscribe button. (Stores email, sends confirmation via backend.)
11. **FAQ Section** — Accordion with 6 Q&As about RatePlex.
12. **Footer** — Logo, links (Browse, About, Contact, Privacy, Terms), social icons (GitHub, Twitter, Instagram), copyright.

### 9.2 Browse / Explore Page (`/browse`)
- **Debounced search bar** (300ms) at the top
- **Filter sidebar / filter bar:**
  - Type: Movie | Series | Anime (multi-select)
  - Genre: multi-select from genre list
  - Year: range slider (1980–2025)
  - Rating: min rating slider
  - Price: FREE | PREMIUM
  - Sort: Rating (desc), Most Reviewed, Newest, A-Z
- **Results grid:** 4 columns desktop, 2 tablet, 1 mobile
- **Skeleton loaders** during fetch
- **Pagination** (10 per page, numbered)
- All filters update URL query params (shareable URLs)

### 9.3 Media Detail Page (`/media/[id]`)
Public. Includes:
- **Hero Banner:** Poster (left) + title, type badge, release year, duration/episodes, genres, average rating (large star display), review count, watchlist button (logged in), "Write a Review" button
- **Description / Overview section**
- **Cast & Crew section**
- **Platform Availability** (chips)
- **AI Sentiment Summary** — loaded on mount from AI endpoint, shows loading state
- **Reviews section** — paginated list of approved reviews, with like/comment, spoiler toggle
- **Write a Review form** (logged in only, collapsible)
- **Related Media** — same genre, 4 cards

### 9.4 Authentication Pages
**Login (`/login`):**
- Email + Password fields with validation
- "Demo User" button (autofills `demo@rateplex.com` / `Demo@1234`)
- "Demo Admin" button (autofills `admin@rateplex.com` / `Admin@1234`)
- Google OAuth button
- Link to register

**Register (`/register`):**
- Name, Email, Password, Confirm Password
- Zod validation (password: min 8 chars, uppercase, number)
- Google OAuth button
- Link to login

### 9.5 User Dashboard (`/dashboard`)
**Sidebar:** Home, Watchlist, My Reviews, AI Recommendations, Profile

**Dashboard Home:**
- Welcome banner with name + avatar
- Stats row: Total Watched, Watching Now, Plan to Watch, Reviews Written
- "My Taste Profile" AI card (auto-loaded)
- Recent watchlist additions (3 cards)
- Recent reviews (3 items)

**Watchlist (`/dashboard/watchlist`):**
- Tab filter: All | Watching | Completed | Plan to Watch | On Hold | Dropped
- Cards with status badge + quick status change dropdown
- Remove from watchlist button
- Skeleton loaders

**My Reviews (`/dashboard/reviews`):**
- Table: Title | Rating | Status | Date | Actions
- Inline edit rating/content
- Delete review with confirm dialog

**AI Recommendations (`/dashboard/recommendations`):**
- "Generate Recommendations" button
- Loading state with skeleton
- Results: 6 recommendation cards with match % badge and reason
- "Add to Watchlist" quick action on each card

**Profile (`/dashboard/profile`):**
- Avatar upload (Cloudinary)
- Editable: name, bio
- Change password section
- Account stats summary

### 9.6 Admin Dashboard (`/admin`)
**Sidebar:** Overview, Media Management, Users, Reviews, Genres

**Admin Overview:**
- 4 KPI cards: Total Users, Total Media, Total Reviews, Active Subscriptions
- Line chart: Reviews submitted over last 30 days
- Bar chart: Media count by type (Movie/Series/Anime)
- Pie chart: Genre distribution
- Data table: Recent user registrations (last 10)

**Media Management (`/admin/media`):**
- Searchable + filterable data table (type, genre, status columns)
- Pagination
- "Add Media" button → `/admin/media/new`
- Edit + Delete actions per row

**Add/Edit Media Form (`/admin/media/new` and `/admin/media/[id]/edit`):**
- Fields: Title, Type, Description, Release Year, Director, Cast (multi-input), Platform (multi-input), Price Type, Streaming Link, Poster URL, Trailer URL, Genres (multi-select), Episodes, Seasons, Duration, Country, Language, Status
- **"Auto-fill with AI" button** — sends title + year + director to AI, auto-fills Description + Genres
- Zod validation on all fields
- Loading state on submit

**Users (`/admin/users`):**
- Table: Name | Email | Role | Created | Actions
- Filter by role (USER/ADMIN)
- Change role action
- Delete user with confirm dialog

**Reviews (`/admin/reviews`):**
- Table: Author | Media | Rating | Status | Date | Actions
- Filter by status (PENDING/APPROVED/REJECTED)
- Approve / Reject buttons inline

**Genres (`/admin/genres`):**
- List + add new genre form inline
- Delete genre

### 9.7 Additional Pages
- `/about` — About RatePlex, mission, tech stack section
- `/blog` — List of 3–4 static blog posts (real content about movies/anime) OR AI-generated summaries
- `/contact` — Contact form (name, email, message) — saves to DB or sends email
- `/help` — FAQ accordion (detailed version)
- `/privacy` — Privacy policy text
- `/terms` — Terms of service text

---

## 10. Advanced Engineering Requirements

### Backend (implement all 3+)
1. **Rate Limiting** — `express-rate-limit` on all `/api/v1` routes (100 req/15min general, 5/15min for auth)
2. **Winston Logger** — Log all requests (method, path, status, duration), errors to `logs/error.log`, combined to `logs/combined.log`
3. **In-Memory Caching** — Cache genre list, featured media, and dashboard stats for 5 minutes using a simple Map-based cache utility
4. **Error Tracking** — Structured error responses with AppError class, all unhandled rejections caught in `server.ts`

### Frontend (implement all 3+)
1. **Server Components** — Media listing page and media detail page fetched server-side via Next.js RSC
2. **Suspense / Streaming** — Use `<Suspense>` with skeleton fallbacks on media cards, review sections, AI sections
3. **Optimistic UI** — Watchlist add/remove and review like toggle update UI immediately before API confirms
4. **Real-time** — Show live "X users online" count or live notification for new reviews (simple polling every 30s or SSE)

---

## 11. Design System

### Color Tokens (CSS variables)
```css
:root {
  --color-primary: #E50914;       /* Netflix Red */
  --color-primary-dark: #B20710;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-surface: #FFFFFF;
  --color-text: #141414;
  --color-text-muted: #6B6B6B;
  --color-border: #E5E5E5;
  --color-accent: #B3B3B3;
}

.dark {
  --color-bg: #141414;
  --color-bg-secondary: #1F1F1F;
  --color-surface: #2A2A2A;
  --color-text: #FFFFFF;
  --color-text-muted: #B3B3B3;
  --color-border: #333333;
}
```

### Media Card Spec (ALL cards must match this)
- Width: `100%` of column (4-col grid = ~280px on 1280px screen)
- Fixed height: `420px` (image: `240px`, content: `180px`)
- Border radius: `12px`
- Image: `object-fit: cover`, lazy loaded
- Content: Title (truncated 1 line), Type badge, Genres (2 max), Rating stars, Review count, "View Details" button
- Hover: slight scale (1.03) + red border highlight

### Typography
- Font: `Inter` (Google Fonts)
- Heading scale: 48px / 36px / 28px / 22px / 18px
- Body: 16px / 14px
- All text must meet WCAG AA contrast in both light and dark mode

---

## 12. Contest Requirements Mapping

| Contest Requirement | Rate-Plex Implementation |
|---|---|
| Next.js App Router + TypeScript | `/app` directory, strict TypeScript everywhere |
| Tailwind + ShadCN | All UI components |
| Redux Toolkit / Zustand | Zustand for auth + UI state |
| React Hook Form + Zod | All forms (login, register, media, review) |
| TanStack Query | All data fetching hooks in `/queries` |
| Node.js + Express + TypeScript | Backend, strict mode, modular |
| Prisma + PostgreSQL | Full schema above |
| JWT + Google OAuth | auth module + NextAuth |
| 3 primary colors, light/dark mode | Red/Black/Gray + CSS variables |
| Sticky navbar, 4+ routes logged out, 6+ logged in | Navbar spec above |
| Hero section 60–70% height, animated | 65vh hero with carousel |
| 8+ landing page sections | 10 sections defined above |
| Card grid (4/col), same size, skeleton | MediaCard + MediaCardSkeleton |
| Item detail page (public, multi-section) | `/media/[id]` spec above |
| Debounced search + 2+ filters + sorting + pagination | Browse page |
| Login/Register with validation + demo login + social | Auth pages |
| Role-based dashboard (User 3+ pages, Admin 5+ pages) | Dashboard spec above |
| Charts with real data | Admin dashboard (Line, Bar, Pie) |
| Data tables with filter + pagination | All admin tables |
| Profile page editable | `/dashboard/profile` |
| 3–4 additional pages | About, Blog, Contact, Help |
| 4+ real AI features (no mock) | 5 features defined above |
| Loading state + error handling + JSON output for AI | All AI routes |
| Server Components | Media pages |
| Suspense / Streaming | All heavy sections |
| Optimistic UI | Watchlist + likes |
| Rate limiting | express-rate-limit |
| Logging | Winston |
| Caching | In-memory cache |

---

## 13. Build Priority / Phase Plan

Build in this exact order to ensure contest demo is always in a shippable state:

### Phase 1 — Backend Foundation (Day 1–2)
1. `env.ts` config + Prisma singleton
2. `AppError`, `catchAsync`, `sendResponse`, `logger` utilities
3. `globalErrorHandler` + `auth.middleware`
4. Auth module (register, login, me, refresh, logout)
5. Rate limiting middleware
6. Run `prisma migrate dev` with updated schema

### Phase 2 — Core Backend APIs (Day 2–3)
1. Genre module (CRUD)
2. Media module (full CRUD + filters + featured)
3. Review module (create, list, approve/reject)
4. Watchlist module (add, update status, remove)
5. Interaction module (like toggle, comment CRUD)
6. User module (profile update, admin list)
7. Dashboard stats endpoints

### Phase 3 — AI Backend (Day 3)
1. Install `@anthropic-ai/sdk`
2. AI service with 5 features using Claude Sonnet
3. Structured JSON prompts for each feature
4. Error handling + rate limiting on AI routes

### Phase 4 — Frontend Foundation (Day 4–5)
1. Next.js setup (App Router, TypeScript, Tailwind, ShadCN)
2. Design system (CSS variables, theme toggle)
3. Axios instance + TanStack Query provider + Zustand stores
4. Shared components (Navbar, Footer, MediaCard, DataTable)
5. Auth pages (login, register with Google)

### Phase 5 — Frontend Public Pages (Day 5–6)
1. Landing/Home page (all 10 sections)
2. Browse/Explore page (filters + pagination)
3. Media Detail page (with AI sentiment)

### Phase 6 — Dashboard (Day 6–7)
1. User dashboard (watchlist, reviews, recommendations, profile)
2. Admin dashboard (all 5 sections + charts)

### Phase 7 — AI Frontend (Day 7)
1. Floating chat widget (AI feature 2)
2. Taste analyzer card (AI feature 3)
3. Recommendations page (AI feature 1)

### Phase 8 — Polish + Contest Requirements (Day 8)
1. Additional pages (About, Blog, Contact, Help, Privacy, Terms)
2. Skeleton loaders everywhere
3. Dark mode QA
4. Mobile responsiveness QA
5. Seed database with real movie/anime data (20+ entries)
6. Demo credentials setup
7. Deploy: Backend → Railway/Render, Frontend → Vercel

---

## 14. Seed Data Requirements

The database must be seeded with **real, non-placeholder** data before demo. Create a `prisma/seed.ts` file:

- **20+ media entries** (mix of MOVIE, SERIES, ANIME) with real titles, descriptions, posters (TMDB image URLs), directors, cast
- **10+ genres** (Action, Drama, Thriller, Sci-Fi, Romance, Horror, Comedy, Fantasy, Animation, Mystery)
- **2 demo users:**
  - User: `demo@rateplex.com` / `Demo@1234` (USER role)
  - Admin: `admin@rateplex.com` / `Admin@1234` (ADMIN role)
- **30+ reviews** spread across media entries (for charts + sentiment AI to work)
- **Watchlist entries** for demo user across all statuses

---

## 15. Deployment Checklist

### Backend (Railway or Render)
- Set all env vars in platform dashboard
- Run `prisma migrate deploy` in build step
- Build command: `pnpm build` → `node dist/server.js`

### Frontend (Vercel)
- Set `NEXT_PUBLIC_API_URL` to deployed backend URL
- Set `NEXTAUTH_URL` to deployed frontend URL
- All other env vars

### README.md must include:
- Project overview + screenshots
- Tech stack
- AI features explanation
- Setup instructions (clone, install, env setup, migrate, seed, run)
- Demo credentials
- Live URL + GitHub link
- Video demo link

---

## 16. Important Implementation Notes for AI Agent

1. **Never use `any` type** in TypeScript — use proper generics and interfaces
2. **All API errors** must go through `globalErrorHandler` — never send raw errors to client
3. **Prisma queries** must use `select` to avoid over-fetching (especially password field on users)
4. **JWT tokens:** accessToken in memory (Zustand), refreshToken in httpOnly cookie
5. **Google OAuth flow:** Frontend gets Google token via NextAuth → sends to backend `/auth/google` → backend verifies + creates user if new → returns own JWT
6. **Image uploads:** Use Cloudinary for poster/avatar uploads — create a backend `/upload` endpoint
7. **AI calls from frontend** must go through the backend (never expose Anthropic API key to client)
8. **TanStack Query keys** must be consistent — use a keys factory pattern in each query file
9. **Dark mode** implemented via `next-themes` + Tailwind `dark:` classes
10. **All forms** must show inline field errors, a success toast on completion, and a loading spinner on the submit button
11. **MediaCard must be exactly identical** in size across all pages — extract as a single shared component
12. **No lorem ipsum** — all text content must be real (about the app, about the movies, etc.)
