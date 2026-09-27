# Security Policy

## Reporting a vulnerability

Please **do not** report security problems through public GitHub issues, pull requests or discussions.

Report privately through either channel:

- **GitHub private vulnerability reporting** (preferred): <https://github.com/akutishevsky/nutrition-mcp/security/advisories/new>
- **Email:** anton@nutrition-mcp.com, with the subject starting `[security]`

Please include:

- the affected endpoint, tool or page
- steps to reproduce
- what an attacker could achieve
- whether you tested only against your own account

A machine-readable contact is published at <https://nutrition-mcp.com/.well-known/security.txt>.

## What to expect

nutrition-mcp is run by a single maintainer, so these are targets, not guarantees:

- **Acknowledgement** within 7 days.
- **Initial assessment** (whether it's a vulnerability and how severe) within 21 days.
- **Status updates** at least every 30 days until it's resolved.
- **A fix** within 90 days for critical and high severity issues, and on a best-effort basis (aiming for 180 days) for the rest.
- **Once it's fixed,** I may publish a GitHub security advisory, typically for issues that affect self-hosted deployments or users' data. If one is published, you'll be credited unless you'd rather not be named.

There is no bug bounty.

## Scope

In scope:

- `https://nutrition-mcp.com`, including the MCP endpoint (`/mcp`), the OAuth endpoints (`/register`, `/authorize`, `/authorize/google`, `/auth/google/callback`, `/approve`, `/token`) and the `/.well-known/` documents
- the in-chat widgets the server returns
- the code on the `main` branch of this repository

Out of scope:

- self-hosted forks and deployments run by anyone else
- the upstream services this project relies on (Supabase, Google, DigitalOcean, Patreon, Open Food Facts) — report those to the vendor
- volumetric denial of service
- social engineering and phishing
- physical attacks
- automated scanner output with no demonstrated impact
- accessing other users' data beyond the minimum needed to show the issue

## Supported versions

Only the hosted deployment at `https://nutrition-mcp.com` and the `main` branch are supported. Merging to `main` deploys to production, so there are no release branches to backport fixes to.

## Safe harbour

Good-faith security research that follows this policy is treated as authorized, and I won't pursue or support legal action over it, as long as you:

- use only accounts you own or have permission to test
- don't keep other users' data, and stop and report as soon as you reach any
- don't degrade the service for other users
- give reasonable time to fix the issue before disclosing it publicly
- don't demand payment or make threats in exchange for a report
