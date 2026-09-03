# Desk Postgres API (Netlify Functions + Neon)

A minimal API that gives your Desk app (Almanac, Household Ledger, Business
Split, Advanced, Academics) real cloud storage in a Postgres database,
with email/password login. It replaces the placeholder Supabase wiring
that shipped in `index.html` — the app-side code didn't need to change,
just the client that talks to it.

## What's here

```
netlify.toml
package.json
schema.sql
netlify/functions/
  signup.js        POST  { email, password } -> { token, user }
  signin.js        POST  { email, password } -> { token, user }
  session.js       GET   (Bearer token)      -> { user }
  sync-get.js      GET   (Bearer token)      -> { data: [{app, data}] }
  sync-upsert.js   POST  (Bearer token) { app, data } -> { error }
  _shared/db.js     Neon Postgres connection helper
  _shared/auth.js   JWT sign/verify helper
  _shared/http.js   JSON response + CORS helper
```

## 1. Create the database (Neon)

1. Go to https://neon.tech, create a free project.
2. Copy the connection string it gives you (starts with `postgres://...`,
   and includes `?sslmode=require`).
3. Open the Neon SQL editor (or run `psql "$DATABASE_URL" -f schema.sql`
   from your machine) and run the contents of `schema.sql` once. This
   creates two tables: `users` and `desk_data`.

Any other managed Postgres works too (RDS, Supabase's raw Postgres, a VPS,
etc.) — just point `DATABASE_URL` at it. The only Neon-specific part is
the `@neondatabase/serverless` driver, which talks to Postgres over
HTTP instead of a raw TCP connection — this matters because Netlify
Functions are short-lived and a normal connection pool doesn't survive
between invocations. If you use a different host, you can swap that
driver for `pg` and open a fresh (or pooled, e.g. via PgBouncer)
connection per request instead.

## 2. Deploy the API to Netlify

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket), or use the
   Netlify CLI (`npx netlify-cli deploy --prod`) to deploy it directly.
2. In the Netlify site settings, add two environment variables:
   - `DATABASE_URL` — the Neon connection string from step 1.
   - `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`).
     This signs the login tokens; keep it secret.
3. Deploy. Your functions will be live at:
   `https://<your-site-name>.netlify.app/.netlify/functions/<name>`

## 3. Point the app at it

Open `index.html`, find this near the top of the big `<script>` block:

```js
var DESK_API_BASE = "https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions";
```

Replace it with your real Netlify Functions URL from step 2. That's the
only edit needed — everything else (the sign-in modal, sync status
indicator, per-app sync bridge) already talks to whatever `supabaseClient`
points at, and it now points at this API instead of Supabase.

## 4. Try it

Open `index.html` in a browser, click "New here? Create an account",
sign up with an email + password. From then on, every change made in
any panel (adding an expense, a task, etc.) gets pushed to `desk_data`
in Postgres a moment after you make it, and pulled back down the next
time you sign in on any device/browser.

## Notes

- Passwords are hashed with bcrypt before they're ever stored.
- Sessions are JWTs valid for 30 days, stored in `localStorage` under
  `desk_api_token` (not `httpOnly`, since this is a static-file app with
  no server session — reasonable for a personal/family tool, but not
  bank-grade; don't reuse this pattern for anything higher-stakes without
  hardening it, e.g. shorter-lived tokens + refresh tokens).
- Each user's data is fully isolated: every query is scoped to
  `user_id` taken from the verified JWT, never from client input.
- To wipe a user's data, delete their row(s) from `desk_data` in the
  Neon SQL editor, or drop and re-run `schema.sql` to start clean.
