# ShiftMate

Track work shifts across multiple jobs, see what you're owed, and export timesheets.
Built with Expo (SDK 57) and Expo Router, with Supabase for accounts and cloud sync.

## Features

- Workplaces with hourly rates, colours and a usual weekly schedule
- Shifts with breaks, overnight support, payment status and a saved pay rate per shift
- Home summary, weekly/monthly work log, calendar, payment tracking and reports
- Export timesheets as PDF or CSV, or share a text summary (hours only, no pay figures)
- Email sign-up / sign-in, password reset, account deletion
- Offline-first: works without a connection and syncs when back online
- Light and dark themes, currency and 12h/24h settings, optional weekly reminders

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
npx expo start
```

Environment variables (`.env`, never committed):

| Variable | Where to find it |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (the anon / publishable key, **not** `service_role`) |

Without these the app runs in local-only mode with demo data and no sign-in.

### Supabase

1. Run [supabase/schema.sql](supabase/schema.sql) in the SQL Editor. It is safe to run again, so it also upgrades an older database.
   It creates the tables, row-level security policies, data checks and the `delete_my_account()` function.
2. Authentication → URL Configuration:
   - Site URL: `shiftmate://auth-callback`
   - Redirect URLs: `shiftmate://auth-callback` and, for Expo Go, `exp://**`
3. Authentication → Providers → Email: choose whether "Confirm email" is required.

### Crash reporting (Sentry)

Without a DSN the app only logs errors to the console. The Sentry plugin is always part of the
build, though, so an Android build needs step 3 (credentials, or turning the upload off) even
without a DSN.

1. In Sentry, create a project of type **React Native** and copy its **DSN**.
2. Set `EXPO_PUBLIC_SENTRY_DSN` to it. Locally that is `.env`; for EAS builds add it to the
   `preview` and `production` environments as plain text
   (`eas env:create --environment production --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --visibility plaintext`).
3. Release builds upload source maps to Sentry, which needs credentials. **On Android a missing or
   wrong credential makes the build fail** at the Sentry upload step, so provide all three
   (Sentry → Settings → Auth Tokens creates the token):
   - `SENTRY_AUTH_TOKEN`: as a **sensitive** EAS environment variable, never in the repo
   - `SENTRY_ORG` and `SENTRY_PROJECT`: your organization and project slugs (plain text)

   To build without uploading (reports still arrive, but their stack traces are hard to read),
   set `SENTRY_DISABLE_AUTO_UPLOAD=true` in that EAS environment instead.

Reports are sent only from release builds (not while developing) and carry the error, where it
happened and an anonymous account id. No emails, names, IP addresses, console output or
screenshots. `src/lib/error-reporting.ts` is the one place this is configured. Sentry includes
native code, so it needs a new development or release build to take effect.

### Development build

Expo Go is enough for most work, but reminders (`expo-notifications`) need a development build on Android:

```bash
npx eas build --profile development --platform android
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint via Expo |

## Releasing

Build profiles are in [eas.json](eas.json); the identifier is `com.jkunwar.shiftmate` on both platforms.

1. `npx eas login`, then `npx eas init` (links the project and adds its id to `app.json`).
2. Add the Supabase values as EAS environment variables so store builds can see them
   (`EXPO_PUBLIC_*` values are compiled in at build time, and `.env` is not uploaded):
   ```bash
   npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<project>.supabase.co" --environment production --visibility plaintext
   npx eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>" --environment production --visibility plaintext
   ```
   Repeat with `--environment preview` (and `development`) for those profiles.
3. `npx eas build --profile production --platform all`, then `npx eas submit`.

Before submitting to the stores you'll also need a privacy policy URL, store listing text and screenshots.
