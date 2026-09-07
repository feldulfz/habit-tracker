# Daymark

A daily task tracker with a GitHub-style contribution calendar. Daymark uses
Google sign-in through Supabase, stores each user's tasks securely in Postgres,
and shows both overall and per-habit time history. Habits can have an optional
minimum duration, while each daily log records the actual minutes spent.

## Local setup

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. During development,
   this script resets the Daymark tables before recreating them.
3. Enable Google in Supabase under Authentication → Providers.
4. Copy `.env.example` to `.env.local` and add the project URL and publishable
   key.
5. Install dependencies with `pnpm install`.
6. Start the site with `pnpm dev`.

Without environment variables, the site opens in a fully interactive preview
mode with sample data. Preview changes are intentionally not saved.

## Duration intensity

For habits with a minimum, the activity color represents how much of that goal
was reached: under 25%, under 50%, under 100%, or goal met. For habits without
a minimum, the four color levels represent under 15, under 30, under 60, and
60 or more minutes.

## Project structure

The application is organized by feature so authentication and task tracking can
change independently:

```text
app/                         Route entry points and global page setup
features/
  auth/                      Google sign-in UI and session state
  tasks/
    components/              Task dashboard, lists, charts, and dialogs
    data/                    Preview data
    hooks/                   Task loading and mutation logic
    lib/                     Date and activity calculations
    model/                   Task and completion types
shared/
  components/                Reusable UI shared between features
  lib/supabase/              Shared Supabase client
supabase/                    Database schema and security policies
```

## Google OAuth configuration

Create a Web OAuth client in Google Cloud. Add the callback URL shown on the
Supabase Google provider page as an authorized redirect URI. Add both the local
site URL and deployed site URL to the Supabase redirect allow list.

## Production

The site is built with Vinext and produces a Cloudflare Worker-compatible
bundle. Run `pnpm build` to create the production output.
