---
description: Reference the GRAIL API documentation before implementing integrations.
---

# GRAIL API Integration Reference

When you are asked to implement any feature involving Gold trading, balance checking, or custodial wallets, you MUST use this skill to ensure consistency with the Oro GRAIL protocol.

## Instructions

1.  **Read the local spec first:** Always read [GRAIL_API_SPEC.md](file:///Users/tai/Documents/mmo/heodat/DOCS/GRAIL_API_SPEC.md) to get the correct endpoints and data shapes.
2.  **Edge Functions only:** Ensure all logic lives in `supabase/functions/`. NEVER propose calling GRAIL from `src/`.
3.  **Unit Conversion:** GRAIL uses `troy_ounce`. The app uses grams.
    *   `1 troy ounce = 31.1034768 grams`.
    *   Perform calculations in the Edge Function to return grams to the mobile client.
4.  **Transaction Security:** 
    *   Most trading endpoints return a `serializedTx`.
    *   You must sign this transaction using the partner's executive authority on the server before submitting it via `/api/transactions/submit`.

## Verification

Before finalizing any GRAIL implementation:
- Check if `x-api-key` is handled via `Deno.env.get()`.
- Ensure the endpoint matches the Devnet or Mainnet URL specified in the local spec.
