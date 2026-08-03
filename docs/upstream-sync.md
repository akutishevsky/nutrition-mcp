# Upstream synchronization policy

Munch is a commercial-development fork of `akutishevsky/nutrition-mcp`.

## Remotes

```bash
git remote -v
git remote add upstream https://github.com/akutishevsky/nutrition-mcp.git
git fetch upstream
```

`origin` points to `michaelhmiv/Munch`. `upstream` points to the original Nutrition MCP repository.

## What should remain easy to sync

The following areas should stay close to upstream unless a Munch requirement forces divergence:

- nutrition calculations and validation;
- import and export behavior;
- widgets and structured MCP responses;
- timezone and unit handling;
- trend and pattern calculations;
- protocol compatibility and MCP SDK upgrades;
- generic bug fixes and security fixes.

## Munch-specific areas

The following areas may intentionally diverge:

- Railway PostgreSQL persistence;
- Munch account identity;
- Stripe subscriptions and entitlements;
- administrative and customer portals;
- restricted database roles and Munch-specific RLS;
- federated USDA/Open Food Facts search;
- saved foods, meal items, and draft confirmation;
- Munch branding, policies, and commercial operations.

## Sync procedure

1. Fetch upstream.
2. Review upstream commits since the last recorded sync point.
3. Create a dedicated `sync/upstream-YYYY-MM-DD` branch.
4. Merge or cherry-pick changes in small groups.
5. Resolve conflicts without removing Munch authorization, entitlement, privacy, or database boundaries.
6. Run formatting, type checking, unit tests, database migration tests, OAuth tests, and black-box MCP tests.
7. Open a PR documenting imported commits and intentional omissions.
8. Update the recorded upstream commit after merge.

## Contribution policy

Broadly useful fixes should be considered for contribution to the upstream project. Do not submit Munch customer data, credentials, commercial secrets, billing logic, private operational information, or Munch-specific policy text upstream.
