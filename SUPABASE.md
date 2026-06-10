# Supabase — real shared backend (auth + agents/teams)

The app runs in **two modes**, chosen automatically by whether the Supabase env
vars are present:

| Mode | When | Data |
|---|---|---|
| **Local mock** (default) | No env vars | Per-browser `localStorage`. Great for demos. |
| **Supabase** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set | Real auth + **shared** agents/teams across everyone. |

Nothing else in the app changes — auth, hierarchy, roster, admin, stats, etc. all
keep working; in Supabase mode the **agents and teams tables are shared and live**
(realtime), and login is real Supabase Auth.

## Setup (≈5 minutes)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the schema.** Open the project's **SQL Editor** and paste/run
   [`supabase/schema.sql`](./supabase/schema.sql). This creates the `teams` and
   `agents` tables, Row Level Security policies, a realtime publication, and seeds
   the six teams.

3. **Turn off email confirmation** (so signup logs the user in immediately):
   **Authentication → Providers → Email → uncheck "Confirm email"** (you can turn
   it back on later and add a confirmation flow).

4. **Add env vars.** Copy `.env.example` → `.env.local` and fill in from
   **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your anon public key...
   ```
   On Vercel/Netlify, add these same two as project **environment variables** and redeploy.

5. **Create the owner.** Run the app, **sign up** with your email/password (this
   creates your agent row + auth user). Then in the Supabase SQL editor:
   ```sql
   update public.agents set platform_role = 'owner' where email = 'you@email.com';
   ```
   Sign out and back in — you're now the owner and can manage everyone.

That's it. New people **sign up → onboard → get routed to a team**, and everyone
sees the same shared roster, hierarchy, and stats in real time.

## What's wired

- **Auth** — `signup` / `login` / `logout` / session-restore go through Supabase
  Auth (`src/services/supabase/auth.ts`). On signup, an `agents` row is created and
  linked to the auth user via `auth_user_id`.
- **Shared agents & teams** — hydrated on load + **realtime subscription**
  (`src/app/supabaseBootstrap.ts`), and every agent/team mutation in the store
  (create/update/delete/reassign/role/permissions/goals, create team) **writes
  through** to Supabase (`src/services/supabase/data.ts`).
- **Security** — RLS lets anyone signed in *read* the shared roster, edit *their own*
  row, and only **owners/admins** create/update others or delete (enforced by the
  `is_admin()` SQL function, mirroring the in-app RBAC).

## Still local-only (next steps if you want full multi-user)

Referrals, daily numbers/production, announcements, chat, invites, and audit logs
still live in the local store. They're structured the same way, so extending the
pattern is straightforward: add a table to `schema.sql`, a fetch/push pair in
`services/supabase/data.ts`, and hydrate + write-through. Chat and announcements
would also benefit from Supabase Realtime the same way agents/teams do here.

> Note: this integration was built and the **local fallback verified**, but the live
> Supabase path needs your project's URL + keys to validate end-to-end. Follow the
> steps above and it'll connect.
