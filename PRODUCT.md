# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Consumers who track what they eat by chatting with an AI assistant (ChatGPT, Claude, Muse, and other MCP clients) or through the Munch website. Their job: log meals, look up foods, plan, and understand their nutrition without spreadsheet drudgery or a clinical-feeling app. Secondary audience: marketplace reviewers and directory users evaluating whether to connect Munch to their assistant.

## Product Purpose

Munch is a production remote MCP service for personal nutrition tracking: source-backed food lookup, meal review with an explicit confirmation step before anything is saved, saved foods, recipes (including URL import with review), meal planning, grocery lists, goals, water, weight, and household collaboration. Success means a published, monetized presence in the assistant marketplaces: a permanent free tier as the front door, with Premium subscribers acquired and billed on the Munch website.

## Positioning

Source-aware, confirm-first nutrition tracking. Every nutrition value traces to USDA FoodData Central or Open Food Facts, with provider results cached against immutable source snapshots, and no record is written until the user explicitly confirms it. Identity and data isolation are enforced by OAuth 2.1 authorization plus forced row-level security in PostgreSQL.

## Operating Context

Used inside AI chat clients over remote MCP (endpoint https://munch.business/mcp, OAuth 2.1), and on the website for account management and billing (Stripe Checkout/Portal, website only). An Android app exists as a wrapper presence; Google Play listing is a draft with no tracks. Policies live at munch.business/privacy, /terms, /help, /security. Support: support@munch.business.

## Capabilities and Constraints

- Free tier is permanent; Premium is sold only on the Munch website via Stripe.
- ChatGPT-facing surfaces (tool descriptions, results, widgets, listing) never advertise pricing or initiate checkout — both a product law and an OpenAI platform rule.
- Consumer wellness product: no medical advice, diagnosis, treatment, or clinical determinations; health status is never inferred from indirect signals.
- Account controls are user-operable: export, revoke access, delete account.
- Tool inventory is large (95 tools) and every tool carries read/write annotation and a plain-language title.

## Brand Commitments

- The name "Munch" is binding (Michael, confirmed 2026-11-09).
- The brand green is binding (Michael, 2026-11-09: "Keep the name and the green — replace only the mark").
- The current M mark is NOT binding: it is being replaced at Michael's direction (2026-11-09, "the current one stinks").
- Voice: plain, friendly, non-clinical. Never hype, never medical.

## Evidence on Hand

Live production service at munch.business with a working OAuth/MCP surface (verified 2026-11-09). 95 annotated MCP tools with a complete submission manifest. Live privacy, terms, security, and help pages. No testimonials, press, or customer logos exist — future work must not fabricate them.

## Product Principles

1. Nothing is saved without the user's explicit confirmation.
2. Every number carries its source.
3. The website is the only cash register; assistants are the front door, never the checkout.
4. Non-clinical, always: wellness tracking, never medical advice.
5. Privacy is architecture (row-level security, export, revoke, delete), not policy copy.
