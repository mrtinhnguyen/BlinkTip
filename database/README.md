# Database Setup

## Quick Start

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `schema.sql`
4. Click "Run" to execute
5. Verify tables are created in Table Editor

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Test Connection

```bash
pnpm test-db
```

## Tables

- **creators**: Content creator profiles and wallet addresses
- **tips**: Payment records from humans and agents
- **agent_actions**: AI agent evaluation and decision logs

## Views

- **creator_stats**: Aggregated earnings and tip counts per creator
