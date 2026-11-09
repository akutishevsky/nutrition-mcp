# Free, Premium, and household contract

Munch is a factual food, macro, recipe, planning, grocery, and household data service operated primarily through ChatGPT.

## Free

Every active account can connect through OAuth and use core food search, barcode lookup, meal logging, daily summaries, 30 days of conversational history, up to 25 saved foods, export, revocation, and account deletion. OAuth and MCP never initiate Stripe Checkout or promote an upgrade.

## Premium

Premium is purchased independently on the Munch website for $2.99 per month. It adds unlimited personal history and saved foods, structured recipes, recipe nutrition arithmetic, meal calendars, grocery lists, and household ownership. Existing direct subscribers receive these capabilities automatically after authentication.

## Paid household seats

A directly paid Premium account may own one household with up to six connected accounts total: the owner plus up to five additional members. The owner is included in the $2.99 Premium price. Each active non-owner household membership adds one $2.00 per month recurring seat to the owner's Stripe subscription. Pending invitations are not billed; the seat is added, with Stripe proration, when an invitation is accepted.

A paid household seat grants that member full Premium only while the member remains in the household and the owner's active subscription contains enough paid household seats to cover the active non-owner roster. A household seat is not a standalone $2 Premium plan. Leaving or being removed from the household ends household-provided Premium unless the member also has an independent active Premium entitlement.

The household relationship is the eligibility condition for the discounted seat. Household recipes, planned meals, and grocery lists are therefore collaborative household resources and cannot be disabled while retaining household-seat pricing. Role differences may control whether a member can edit shared resources, but every active non-owner role consumes a paid seat.

Personal meal, hydration, weight, goals, and other personal nutrition history remain private to each account. Shared objects retain the factual household display name recorded for an action when a non-owner account is later deleted.

Stripe subscription-item quantities are persisted and reconciled from webhooks. Household-provided Premium fails closed if the active household roster exceeds the billed seat quantity or the owner's qualifying Premium subscription is no longer active. Shared records are retained rather than silently deleted when billing access ends.

Paid household ownership is tied to the owner's Stripe subscription and is not transferred implicitly between billing customers. An owner who wants another person to become the billing owner must dissolve the household and the new owner can create a new household from their own directly paid Premium account.

## Model boundary

Munch stores ingredients, servings, nutrients, provenance, dates, revisions, grocery items, and observed usage. It does not store generated tags such as favorite, healthy, high-protein, easy, or recommended. The client model derives those conclusions from factual data and user-supplied constraints.

Munch does not infer pantry inventory and does not determine calorie, protein, weight-loss, or medical targets.
