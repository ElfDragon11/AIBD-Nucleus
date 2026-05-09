-- pgvector for Phase 2+ embeddings on people/opportunities (Phase 0 lock).
-- Requires Supabase Postgres or any Postgres with the vector extension available.
-- Local: `supabase start` uses a compatible image; hosted: enable pgvector in Dashboard.
create extension if not exists vector with schema extensions;
