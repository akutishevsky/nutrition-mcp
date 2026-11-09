-- Drop the S1 AI task credit ledger (De-credit slice, Amendment C).
--
-- Credits are ditched in favour of subscription-only Premium gating:
-- the ledger module (src/billing/ai-credits.ts) and every call site are
-- removed in the same change, and the canonical schema no longer
-- creates the table on fresh installs. This update removes the table
-- from databases that already applied 0034_ai_credit_ledger.sql.
-- Idempotent: safe on fresh installs where the table never existed.

drop table if exists munch.ai_credit_ledger;
