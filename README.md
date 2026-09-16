# Biola Sport Court Scheduling

A web application for browsing Biola University and La Mirada community sports
facilities, posting and joining pickup games, and viewing campus events on a
combined calendar.

CSCI 450 — Software Engineering, Spring 2026.

## Live demo

**[biola-recconnect.netlify.app](https://biola-recconnect.netlify.app)**

Currently running without a connected database, so the app falls back to sample facility and schedule data for browsing.

---

## Features

- Browse on-campus and public-park sports facilities with search, sport filter,
  and distance/ETA from your location.
- Interactive Leaflet map showing facility locations.
- Visual availability timeline that marks open, occupied, selected, and closed
  time cells in 30-minute increments.
- Post a pickup game (pick a sport, date, time range, and capacity).
- Join, cancel, and chat inside pickup games.
- Combined calendar view that merges 25Live campus events with user-posted
  pickup games, filterable by event type.
- "My Reservations" page with upcoming + past sessions.
- Profile page with avatar.

## Tech stack

- **Frontend:** React 19 + TypeScript, Vite 6, React Router 7, Tailwind CSS v4,
  shadcn/ui, Leaflet, date-fns, lucide-react.
- **Backend:** Node.js + Express, Postgres (`pg`), Zod validation, dotenv.
- **Deploy:** Netlify (static frontend + serverless API + scheduled function),
  Neon Postgres.
- **External integration:** Biola 25Live (event scraper).
- **Tooling:** ESLint, GitHub, GitHub Actions, `concurrently`, `tsx`.

---

## Prerequisites

- Node.js 18+ and npm
- A Postgres database (local or Neon free tier)
- (Optional, for live event sync) Biola 25Live credentials

## Quick start

```bash
# 1. Clone and install
git clone <this-repo-url>
cd Sport_Schedule-main
npm install

# 2. Configure environment
cp .env.example .env        # then edit .env — see "Environment variables" below

# 3. Initialize the database
npm run db:reset            # create tables
npm run db:seed             # insert the 5 demo facilities + demo users
npm run db:sync             # (optional) pull current 25Live events

# 4. Run the app
npm run dev
```

`npm run dev` boots the Vite frontend on http://localhost:5173 and the Express
API on http://localhost:3001 concurrently.

## Environment variables

Create a `.env` file in the project root with:

```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DBNAME
TWENTYFIVE_LIVE_USERNAME=your.biola.email@biola.edu
TWENTYFIVE_LIVE_PASSWORD=your-biola-password
TZ=America/Los_Angeles
```

`TWENTYFIVE_LIVE_USERNAME` / `TWENTYFIVE_LIVE_PASSWORD` are only needed if you
plan to run `npm run db:sync` or the scheduled Netlify function. The app runs
fine without them — you just won't see live 25Live events.

## NPM scripts

| Script             | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Run frontend (Vite) and API (Express) together          |
| `npm run dev:web`  | Frontend only                                           |
| `npm run dev:api`  | API only                                                |
| `npm run build`    | Build the frontend to `dist/`                           |
| `npm run start`    | Run the Express API in production mode                  |
| `npm run db:reset` | Drop and recreate the Postgres schema                   |
| `npm run db:seed`  | Insert the 5 facilities + demo users                    |
| `npm run db:clear` | Truncate all data, keep the schema                      |
| `npm run db:sync`  | Pull 25Live events into `facility_bookings`             |

## Folder structure

```
Sport_Schedule-main/
├── app/                  React frontend (pages, components, hooks, utils)
├── server/               Express API + DB scripts + 25Live scraper
│   ├── index.ts          API entrypoint (REST routes)
│   ├── db.ts             Postgres pool wrapper
│   ├── db-reset.ts       Schema bootstrap
│   ├── db-clear.ts       Truncate helper
│   ├── seed.ts           Demo data seeder
│   ├── sync-25live.ts    25Live → DB sync job
│   ├── mappers.ts        DB row ↔ API shape converters
│   └── scraper/
│       └── twentyfive-live.ts   25Live HTTP client
├── netlify/functions/    Serverless API + scheduled sync
├── styles/               Global CSS
├── Database/             Schema notes / ER diagram
├── Doc/                  Project documents (sprint reports, RTM, etc.)
├── DEPLOY.md             Netlify deploy guide
├── REQUIREMENTS.md       Functional and non-functional requirements
├── package.json
└── netlify.toml
```

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) for full Netlify + Neon setup instructions
(Postgres provisioning, environment variables, scheduled functions, and
verifying the deploy).

Biola University · CSCI 450 · Spring 2026
