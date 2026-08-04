# Marketplace reviewer account

Munch supports a pre-provisioned reviewer account with ordinary Better Auth email/password authentication at:

`https://munch.business/review/sign-in`

Public password signup is disabled. Normal users continue to use passwordless magic links. Reviewer credentials are created outside GitHub, supplied privately in the marketplace submission, and never committed to the repository.

## Provisioning

Run the provisioning script with production database and Better Auth configuration plus these one-time environment variables:

- `MUNCH_REVIEWER_EMAIL`
- `MUNCH_REVIEWER_PASSWORD` — 16 to 128 characters
- `MUNCH_REVIEWER_NAME` — optional
- `MUNCH_REVIEWER_EXPIRES_AT` — optional future ISO timestamp; defaults to 180 days

Command:

```sh
bun scripts/provision-reviewer.ts
```

The script uses Better Auth's email/password signup path only within its own process so Better Auth performs password hashing. The running web service keeps public password signup disabled. Existing reviewer accounts must be provisioned again with the same password or a new reviewer email.

## Data and access

Provisioning performs these auditable actions:

1. Creates or verifies the reviewer credential account.
2. Marks the account active and verified.
3. Grants an expiring `premium_access` entitlement with source `reviewer`.
4. Creates a sample household owned by the reviewer.
5. Seeds a personal breakfast recipe and plan.
6. Seeds a household spaghetti recipe, Monday dinner plan, and explicit onion grocery item.
7. Records sanitized audit events without the password.

The reviewer account exercises the same Premium capability resolver, RLS policies, MCP tools, account portal, and household routes as paying users. It does not bypass authorization or database isolation.

## Rotation and removal

Rotate by provisioning a new reviewer email and updating the marketplace submission credentials. Revoke an existing override with `revokePremiumOverride` or set its entitlement inactive. Remove the account through normal account-deletion controls after dissolving its sample household.
