# Hisaab AI

Hisaab is a calm, AI-assisted expense tracker for individuals and small businesses. It supports separate personal and business workspaces, per-workspace currency, hosted PostgreSQL persistence, Supabase Auth, private receipt storage, and receipt extraction with Gemini.

## Current product status

- Supabase email/password sign-up and sign-in
- User- and workspace-scoped expense CRUD
- Hosted PostgreSQL persistence through Supabase Session Pooler
- Private Supabase Storage for receipts, with per-receipt keep/delete choice
- Gemini 3.6 Flash receipt extraction through the backend-only Interactions API
- Review-before-save receipt flow with merchant, amount, date, category, tax, and payment method suggestions
- Conservative AI limits: 3 scans per user per minute and 30 per UTC day
- Reports, categories, CSV export, account details, sign-out, light/dark theme, and responsive layouts
- A safe demo fallback when the app is intentionally run without hosted configuration

The app is not considered production-ready until hosted authentication, workspace isolation, private receipt links, deletion cleanup, and Render cold-start behavior have been checked.

## Run locally

```bash
npm install
npm run dev
```

The Vite frontend runs on the address shown in the terminal and proxies `/api` requests to the Express server on port 3001.

Copy `.env.example` to `.env` and set the values for the mode you want. Never commit `.env` or paste a real key into source code or chat.

### Hosted Supabase mode

Use the hosted Supabase database connection and Supabase Auth:

```text
DEMO_MODE=false
AUTH_MODE=supabase
DATABASE_SSL=true
DATABASE_URL=your-session-pooler-connection-string
SUPABASE_URL=your-project-url
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GEMINI_API_KEY=your-server-only-gemini-key
GEMINI_MODEL=gemini-3.6-flash
```

The browser only receives the publishable Supabase key. Do not add a Supabase service-role key to Vite variables.

### Local PostgreSQL mode

```text
DEMO_MODE=false
AUTH_MODE=demo
DATABASE_SSL=false
DATABASE_URL=postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/hisaab
```

Then run:

```bash
npm run db:migrate
```

### Demo mode

Leave `DEMO_MODE=true` and `AUTH_MODE=demo` to use temporary in-memory data. Demo data resets when the server restarts.

## Production-style build

```bash
npm run build
npm start
```

## Render Free deployment

The repository includes `render.yaml`. It defines one Node web service on Render's Free plan, builds with `npm ci && npm run build`, starts with `npm start`, and checks `/api/health`.

Render environment variables are available during the build and at runtime. Provide the secret values when Render asks for them:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY`

The Render Free service uses Supabase for persistent database and receipt storage because Render's free filesystem is temporary. Free web services sleep after inactivity and can take about a minute to wake up.

## Database and storage SQL

Run these files in order in the hosted Supabase SQL Editor:

1. `db/supabase/001_schema.sql`
2. `db/supabase/002_security_rls.sql`
3. `db/supabase/003_receipt_storage.sql`

The third file creates the private `receipts` bucket and owner-only Storage policies.
