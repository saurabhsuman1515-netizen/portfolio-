# Portfolio backend setup

The contact form submits to `api/contact.js`, a Vercel Serverless Function.
Messages are stored in Supabase Postgres; database credentials never reach the browser.

1. Create a Supabase project.
2. In its **SQL Editor**, run `database/schema.sql`.
3. In **Settings → API Keys**, copy the project URL and its **secret** key.
4. In Vercel → this project → **Settings → Environment Variables**, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
5. Redeploy.

Submitted messages will then be available in Supabase’s `contact_messages` table.
The API validates inputs, has a hidden bot trap, and rate-limits requests per running function instance.

For email alerts, configure a Supabase Database Webhook for inserts into `contact_messages` and point it at an email provider or automation you control.
