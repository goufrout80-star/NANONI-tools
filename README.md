# NANONI Studio — Waitlist Landing Page

AI-powered creative SaaS platform waitlist.
19 tools. One platform. Powered by Google Gemini.

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (database + edge functions)
- Resend (email verification)
- hCaptcha (bot protection)
- Deployed on Vercel

## Setup

1. Clone the repo
2. Install dependencies:
   ```
   npm install
   ```
3. Copy env example:
   ```
   cp .env.example .env
   ```
4. Fill in your `.env` values (see `.env.example`)

5. Run locally:
   ```
   npm run dev
   ```

## Environment Variables
See `.env.example` for required variables. Never commit `.env` to git.

## Supabase Edge Functions
Deploy with:
```
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy submit-waitlist
npx supabase functions deploy verify-code
npx supabase functions deploy resend-code
```

Set secrets in Supabase Dashboard → Settings → Edge Functions → Secrets:
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HCAPTCHA_SECRET_KEY`

## Deploy
Connected to Vercel. Push to main branch to trigger automatic deployment.

Make sure these env vars are set in Vercel Dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_HCAPTCHA_SITE_KEY`
