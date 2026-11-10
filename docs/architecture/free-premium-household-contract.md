# Free, Premium, and household contract

Munch is a factual food, macro, recipe, planning, grocery, and household data service operated primarily through ChatGPT.

## Free

Every active account can use core food search, barcode lookup, meal logging, daily summaries, full history with no day limit, structured recipes, recipe nutrition arithmetic, meal calendars, grocery lists, Pantry, and every Munch-supplied AI feature on the website and in the app (photo estimates, meal ideas, receipt and pantry scans, plan suggestions, recipe-import resolution) — free and unmetered, with no entitlement gate (Amendment D, 2026-11-09). Free also includes export, revocation, and account deletion. The one remaining free-tier quantity limit is up to 25 saved foods. The one channel Free does not include is MCP access itself: connecting through OAuth and calling MCP tools require Premium (below), enforced at the consent page and again on every MCP request, so an already-connected client whose entitlement lapses is refused at its next tool call. OAuth and MCP never initiate Stripe Checkout.

## Premium

Premium is purchased independently on the Munch website for $3.00 per month. Its identity is ad-free in the app, the future in-app AI chat agent, and MCP access, plus household ownership and unlimited saved foods. Existing direct subscribers receive these capabilities automatically after authentication.

## Paid household seats

A directly paid Premium account may own one household with up to six connected accounts total: the owner plus up to five additional members. The owner is included in the $3.00 Premium price. Each active non-owner household membership adds one $2.00 per month recurring seat to the owner's Stripe subscription. Pending invitations are not billed; the seat is added, with Stripe proration, when an invitation is accepted.

A paid household seat grants that member full Premium only while the member remains in the household and the owner's active subscription contains enough paid household seats to cover the active non-owner roster. A household seat is not a standalone $2 Premium plan. Leaving or being removed from the household ends household-provided Premium unless the member also has an independent active Premium entitlement.

The household relationship is the eligibility condition for the discounted seat. Household recipes, planned meals, and grocery lists are therefore collaborative household resources and cannot be disabled while retaining household-seat pricing. Role differences may control whether a member can edit shared resources, but every active non-owner role consumes a paid seat.

Personal meal, hydration, weight, goals, and other personal nutrition history remain private to each account. Shared objects retain the factual household display name recorded for an action when a non-owner account is later deleted.

Stripe subscription-item quantities are persisted and reconciled from webhooks. Household-provided Premium fails closed if the active household roster exceeds the billed seat quantity or the owner's qualifying Premium subscription is no longer active. Shared records are retained rather than silently deleted when billing access ends.

Paid household ownership is tied to the owner's Stripe subscription and is not transferred implicitly between billing customers. An owner who wants another person to become the billing owner must dissolve the household and the new owner can create a new household from their own directly paid Premium account.

## Model boundary

Munch stores ingredients, servings, nutrients, provenance, dates, revisions, grocery items, and observed usage. It does not store generated tags such as favorite, healthy, high-protein, easy, or recommended. The client model derives those conclusions from factual data and user-supplied constraints.

Munch does not infer pantry inventory and does not determine calorie, protein, weight-loss, or medical targets.
