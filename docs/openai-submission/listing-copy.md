# Listing copy

## App information

- Display name: **Munch**
- Subtitle: **Track meals and nutrition**
- Category: **FOOD**
- Website: `https://munch.business`
- Support: `https://munch.business/help`
- Privacy: `https://munch.business/privacy`
- Terms: `https://munch.business/terms`
- MCP endpoint: `https://munch.business/mcp`

## Description

Munch helps users look up foods, review and confirm meals, preserve nutrition history, reuse saved foods, inspect goals and trends, and manage recipes, meal plans, groceries, and household nutrition records through ChatGPT.

Munch requires authentication and derives identity from the authorized account. It stores confirmed records in Railway PostgreSQL and uses USDA FoodData Central and Open Food Facts for source-aware food lookup. Munch is a consumer wellness product and does not provide medical advice, diagnosis, treatment, emergency guidance, or clinical dosing.

## Suggested starter prompts

- Log the lunch in this photo after I review the portions.
- Show my calorie and macro totals for the last seven days.
- Look up the nutrition for this barcode.
- Save this as My Peanut Butter Sandwich Lunch, then log half of it and plan it for Thursday lunch.
- Show what is still on my grocery list.
- Find the breakfast food I log most often.

## Commercial boundary

Munch Free is permanent and covers the website and app in full. Munch Premium is optional, is purchased and managed only on the Munch website, and is what MCP access itself is part of: a Free account cannot approve an MCP connection, and MCP tool calls without an active Premium entitlement are refused with an explanation that routes to the website. No MCP tool, tool result, or embedded ChatGPT widget initiates checkout.
