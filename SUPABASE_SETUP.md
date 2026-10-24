# Supabase Setup Guide

This document describes the manual steps to set up Supabase for Max it Partage.

## Prerequisites

- A Supabase account at [supabase.com](https://supabase.com)
- Access to the Supabase SQL editor

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose an organization (or create one)
4. Fill in project details:
   - **Name**: `maxit-partage` (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the closest region to Senegal (e.g., `eu-west-1` or `af-south-1` if available)
5. Click "Create new project" and wait for provisioning (~2 minutes)

### 2. Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open the migration file: `supabase/migrations/0001_init.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click "Run" or press `Ctrl+Enter`
7. Verify all tables were created successfully in the **Table Editor**

### 3. Enable Row Level Security (RLS)

RLS policies are included in the migration file, but verify they are active:

1. Go to **Authentication** → **Policies** (left sidebar)
2. Confirm you see policies for:
   - `profiles` (SELECT own, UPDATE own)
   - `collectes` (SELECT if creator or participant, INSERT/UPDATE if creator)
   - `participants` (SELECT if member, UPDATE own status)
3. All tables should show RLS as **Enabled** (green badge)

### 4. Test RPC Functions

Verify the security-definer functions work correctly:

1. In **SQL Editor**, run test queries:

```sql
-- Test get_invite_preview (should fail with invalid token)
SELECT get_invite_preview('invalid-token');

-- Test that functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_invite_preview', 'claim_invitation', 'pay_participant');
```

Expected: 3 rows returned showing the RPC functions exist.

### 5. Copy API Credentials

1. Go to **Project Settings** → **API** (left sidebar)
2. Copy the following values:
   - **Project URL**: The URL under "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - **Anon (public) key**: The key under "Project API keys" → "anon public"
3. Create a `.env` file at the project root (copy from `.env.example`)
4. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Verify Configuration

1. Start your development server: `npm run dev`
2. Open the browser console
3. The app should connect to Supabase without errors
4. Check that `supabase.auth.getSession()` works (no authentication errors)

## Security Checklist

- ✅ RLS is enabled on all tables (`profiles`, `collectes`, `participants`, `history`)
- ✅ RPC functions are marked `SECURITY DEFINER`
- ✅ Invite tokens are never returned in SELECT queries (only via RPC)
- ✅ Phone numbers are only visible to the collecte creator
- ✅ `.env` file is in `.gitignore` (credentials never committed)

## Troubleshooting

### "relation does not exist" errors
- The migration did not run successfully. Re-run `0001_init.sql` in SQL Editor.

### "JWT expired" or authentication errors
- Check that `VITE_SUPABASE_ANON_KEY` is the **anon** key, not the service role key.
- Verify the URL has `https://` prefix.

### RLS policy errors ("new row violates row-level security")
- Verify policies exist: `SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'collectes', 'participants');`
- Check that anonymous auth is enabled: **Authentication** → **Providers** → **Email** (toggle on, even if not using email auth).

### Functions not found
- Ensure the migration created functions: `SELECT proname FROM pg_proc WHERE proname LIKE '%invitation%';`

## Next Steps

After completing this setup:

1. Test creating a collecte in the app
2. Generate an invitation link
3. Open the invitation link (incognito mode) and claim it
4. Verify the guest user sees only their collecte

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
