FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# The upstream repository intentionally includes the original maintainer's
# analytics, support links, contact details, and production domain in static
# assets. Munch never ships those inherited personalizations. The existing
# idempotent cleanup script removes Google Analytics and maintainer-specific
# routes/links from the container image before it is deployed.
RUN bun run depersonalize

USER bun
EXPOSE 8080
# --smol runs Bun's GC more aggressively and grows the heap more slowly,
# keeping RSS low on small Railway instances.
CMD ["bun", "--smol", "src/index.ts"]
